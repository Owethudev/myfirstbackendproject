import assert from "node:assert/strict";
import test from "node:test";
import { createCacheService } from "./cache.service.js";

const createRedisMock = () => {
  const values = new Map();
  let isReady = true;
  const client = {
    get: async (key) => values.get(key) ?? null,
    set: async (key, value, options) => {
      assert.equal(options.EX, 60);
      values.set(key, value);
    },
    incr: async (key) => {
      const revision = Number(values.get(key) ?? 0) + 1;
      values.set(key, String(revision));
      return revision;
    },
  };

  Object.defineProperty(client, "isReady", {
    get: () => isReady,
  });

  return {
    client,
    values,
    setReady: (ready) => {
      isReady = ready;
    },
  };
};

test("feed values are loaded once and served from Redis until expiry", async () => {
  const redis = createRedisMock();
  const cache = createCacheService({ client: redis.client });
  let loads = 0;
  const loader = async () => {
    loads += 1;
    return { items: [{ _id: "post-1" }] };
  };

  const first = await cache.getOrLoad("public-posts", "page:1:limit:6", 60, loader);
  const second = await cache.getOrLoad("public-posts", "page:1:limit:6", 60, loader);

  assert.deepEqual(second, first);
  assert.equal(loads, 1);
  assert.deepEqual(cache.getMetrics(), {
    hits: 1,
    misses: 1,
    errors: 0,
    bypasses: 0,
    singleFlightHits: 0,
  });
});

test("resource invalidation makes previously cached feed pages unreachable", async () => {
  const redis = createRedisMock();
  const cache = createCacheService({ client: redis.client });
  let loads = 0;
  const loader = async () => ({ value: ++loads });

  await cache.getOrLoad("public-posts", "page:1:limit:6", 60, loader);
  await cache.invalidate("public-posts");
  const updated = await cache.getOrLoad("public-posts", "page:1:limit:6", 60, loader);

  assert.deepEqual(updated, { value: 2 });
  assert.equal(loads, 2);
});

test("concurrent misses for the same feed page share one MongoDB load", async () => {
  const redis = createRedisMock();
  const cache = createCacheService({ client: redis.client });
  let loads = 0;
  let resolveLoad;
  let markLoaderStarted;
  const loaderStarted = new Promise((resolve) => {
    markLoaderStarted = resolve;
  });
  const loader = () => {
    loads += 1;
    markLoaderStarted();
    return new Promise((resolve) => {
      resolveLoad = resolve;
    });
  };

  const first = cache.getOrLoad("public-events", "page:1:limit:12", 60, loader);
  const second = cache.getOrLoad("public-events", "page:1:limit:12", 60, loader);
  await loaderStarted;
  resolveLoad({ items: [] });

  assert.deepEqual(await first, { items: [] });
  assert.deepEqual(await second, { items: [] });
  assert.equal(loads, 1);
  assert.equal(cache.getMetrics().singleFlightHits, 1);
});

test("Redis outages bypass the cache and still return MongoDB results", async () => {
  const redis = createRedisMock();
  redis.setReady(false);
  const cache = createCacheService({ client: redis.client });
  const value = { items: [] };
  const result = await cache.getOrLoad(
    "public-events",
    "page:1:limit:12",
    60,
    async () => value,
  );

  assert.equal(result, value);
  assert.equal(cache.getMetrics().bypasses, 1);
});

test("Redis read failures are logged and fall back to MongoDB", async () => {
  const warnings = [];
  const redis = createRedisMock();
  redis.client.get = async () => {
    throw new Error("connection lost");
  };
  const cache = createCacheService({
    client: redis.client,
    logger: { warn: (...args) => warnings.push(args) },
  });

  const result = await cache.getOrLoad(
    "public-posts",
    "page:1:limit:6",
    60,
    async () => ({ items: [] }),
  );

  assert.deepEqual(result, { items: [] });
  assert.equal(cache.getMetrics().errors, 1);
  assert.match(warnings[0][0], /continuing without cache/);
});

test("Redis write failures do not replace a successful MongoDB result", async () => {
  const warnings = [];
  const redis = createRedisMock();
  redis.client.set = async () => {
    throw new Error("write failed");
  };
  const cache = createCacheService({
    client: redis.client,
    logger: { warn: (...args) => warnings.push(args) },
  });
  const value = { items: [] };

  const result = await cache.getOrLoad(
    "public-posts",
    "page:1:limit:6",
    60,
    async () => value,
  );

  assert.equal(result, value);
  assert.equal(cache.getMetrics().errors, 1);
  assert.match(warnings[0][0], /continuing without cache/);
});

test("Redis invalidation failures are logged without failing the write workflow", async () => {
  const warnings = [];
  const redis = createRedisMock();
  redis.client.incr = async () => {
    throw new Error("invalidation failed");
  };
  const cache = createCacheService({
    client: redis.client,
    logger: { warn: (...args) => warnings.push(args) },
  });

  await assert.doesNotReject(cache.invalidate("public-events"));
  assert.equal(cache.getMetrics().errors, 1);
  assert.match(warnings[0][0], /invalidation failed/);
});
