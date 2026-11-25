import { createClient } from "redis";

const KEY_PREFIX = "snpl:v1";
const DEFAULT_FEED_TTL_SECONDS = 60;
const MAX_FEED_TTL_SECONDS = 3600;
let configuredFeedTtlSeconds;

const getFeedCacheTtlSeconds = () => {
  if (configuredFeedTtlSeconds !== undefined) {
    return configuredFeedTtlSeconds;
  }

  const configuredTtl = process.env.PUBLIC_FEED_CACHE_TTL_SECONDS;
  if (configuredTtl === undefined) {
    configuredFeedTtlSeconds = DEFAULT_FEED_TTL_SECONDS;
    return configuredFeedTtlSeconds;
  }

  const ttl = Number(configuredTtl);
  if (Number.isInteger(ttl) && ttl >= 1 && ttl <= MAX_FEED_TTL_SECONDS) {
    configuredFeedTtlSeconds = ttl;
    return configuredFeedTtlSeconds;
  }

  console.warn(
    `Invalid PUBLIC_FEED_CACHE_TTL_SECONDS; using ${DEFAULT_FEED_TTL_SECONDS} seconds.`,
  );
  configuredFeedTtlSeconds = DEFAULT_FEED_TTL_SECONDS;
  return configuredFeedTtlSeconds;
};

export const createCacheService = ({
  client,
  getClient = () => client,
  logger = console,
} = {}) => {
  const inFlightLoads = new Map();
  const metrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    bypasses: 0,
    singleFlightHits: 0,
  };

  const logRedisError = (operation, error) => {
    metrics.errors += 1;
    logger.warn(`Redis cache ${operation} failed; continuing without cache.`, {
      error: error instanceof Error ? error.message : "Unknown Redis error",
    });
  };

  const loadWithCache = async (resource, key, ttlSeconds, loader) => {
    const activeClient = getClient();
    if (!activeClient?.isReady) {
      metrics.bypasses += 1;
      return loader();
    }

    const revisionKey = `${KEY_PREFIX}:${resource}:revision`;
    let cacheKey;
    let cacheReadFailed = false;

    try {
      const revision = (await activeClient.get(revisionKey)) ?? "0";
      cacheKey = `${KEY_PREFIX}:${resource}:${revision}:${key}`;
      const cached = await activeClient.get(cacheKey);
      if (cached !== null) {
        try {
          const value = JSON.parse(cached);
          metrics.hits += 1;
          return value;
        } catch {
          metrics.errors += 1;
          logger.warn("Redis cache entry could not be decoded; refreshing from MongoDB.");
        }
      }
      metrics.misses += 1;
    } catch (error) {
      cacheReadFailed = true;
      logRedisError("read", error);
    }

    const value = await loader();
    if (cacheReadFailed || !activeClient.isReady) {
      return value;
    }

    try {
      await activeClient.set(cacheKey, JSON.stringify(value), { EX: ttlSeconds });
    } catch (error) {
      logRedisError("write", error);
    }

    return value;
  };

  const getOrLoad = async (resource, key, ttlSeconds, loader) => {
    const requestKey = `${resource}:${key}`;
    const pendingLoad = inFlightLoads.get(requestKey);
    if (pendingLoad) {
      metrics.singleFlightHits += 1;
      return pendingLoad;
    }

    const load = loadWithCache(resource, key, ttlSeconds, loader);
    inFlightLoads.set(requestKey, load);
    try {
      return await load;
    } finally {
      if (inFlightLoads.get(requestKey) === load) {
        inFlightLoads.delete(requestKey);
      }
    }
  };

  const invalidate = async (resource) => {
    const requestPrefix = `${resource}:`;
    for (const requestKey of inFlightLoads.keys()) {
      if (requestKey.startsWith(requestPrefix)) {
        inFlightLoads.delete(requestKey);
      }
    }

    const activeClient = getClient();
    if (!activeClient?.isReady) {
      metrics.bypasses += 1;
      return;
    }

    try {
      await activeClient.incr(`${KEY_PREFIX}:${resource}:revision`);
    } catch (error) {
      logRedisError("invalidation", error);
    }
  };

  return {
    getOrLoad,
    invalidate,
    getMetrics: () => ({ ...metrics }),
  };
};

let redisClient = null;
let redisConnectionStarted = false;

export const initializeCache = () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl || redisConnectionStarted) {
    return;
  }

  redisConnectionStarted = true;
  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: (retries) => Math.min((retries + 1) * 100, 3000),
      },
    });
  } catch (error) {
    redisConnectionStarted = false;
    console.warn("Invalid REDIS_URL; continuing with MongoDB only.", {
      error: error instanceof Error ? error.message : "Unknown Redis error",
    });
    return;
  }
  redisClient.on("error", (error) => {
    console.error("Redis client error.", {
      error: error instanceof Error ? error.message : "Unknown Redis error",
    });
  });
  void redisClient.connect().catch((error) => {
    redisConnectionStarted = false;
    console.warn("Redis is unavailable; continuing with MongoDB only.", {
      error: error instanceof Error ? error.message : "Unknown Redis error",
    });
  });
};

export const cacheService = createCacheService({ getClient: () => redisClient });
export const getPublicFeedCacheTtlSeconds = getFeedCacheTtlSeconds;
