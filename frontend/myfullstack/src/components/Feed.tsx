import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { getCoverStyle } from "../utils.ts";
import type { FeedRequestState, PostItem, UserProfile } from "../types.ts";

type FeedProps = {
  posts: PostItem[];
  user: UserProfile | null;
  viewMode: "current" | "grid";
  requestState: FeedRequestState;
  onRetry: () => void;
  onViewModeChange: (view: "current" | "grid") => void;
  onDeletePost: (postId: string) => void;
};

export function Feed({
  posts,
  user,
  viewMode,
  requestState,
  onRetry,
  onViewModeChange,
  onDeletePost,
}: FeedProps) {
  // This part shows project posts and the buttons that belong to each post.
  const isGridView = viewMode === "grid";

  return (
    <motion.section
      id="feed"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06 }}
      className="content-feed project-feed"
    >
      <div className="feed-heading">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">
            Community feed
          </p>
          <h2>
            SHOW US YOUR WORK
          </h2>
        </div>

        <div className="view-switch">
          <button
            type="button"
            onClick={() => onViewModeChange("current")}
            className={viewMode === "current" ? "is-active" : ""}
            aria-pressed={viewMode === "current"}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={viewMode === "grid" ? "is-active" : ""}
            aria-pressed={viewMode === "grid"}
          >
            Grid
          </button>
        </div>
      </div>

      {requestState.status === "error" ? (
        <div className="feed-empty-state" role="alert">
          <p>{requestState.message}</p>
          <button type="button" onClick={onRetry}>
            Retry loading posts
          </button>
        </div>
      ) : null}

      {requestState.status === "loading" && posts.length === 0 ? (
        <div className="feed-empty-state" role="status">
          Loading posts...
        </div>
      ) : requestState.status === "ready" && posts.length === 0 ? (
        <div className="feed-empty-state">
          No posts yet. Be the first to share a project and spark the feed.
        </div>
      ) : posts.length > 0 ? (
        <div
          className={
            isGridView ? "grid gap-4 grid-cols-2 md:grid-cols-3" : "space-y-4"
          }
        >
          {posts.map((post) => (
            <motion.article
              key={post._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="content-card"
            >
              <div
                className="content-card-cover project-card-cover"
                style={getCoverStyle(post.name)}
              >
                <div>
                  <p className="card-author">
                    {post.author ? post.author.toUpperCase() : "CREATOR"}
                  </p>
                  <h3 className="card-title">
                    {post.name}
                  </h3>
                </div>
                {isGridView && user && post.author === user.username ? (
                  <button
                    type="button"
                    className="delete-content-button"
                    onClick={() => onDeletePost(post._id)}
                    aria-label="Delete post"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>

              {!isGridView ? (
                <div className="content-card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="content-card-name">
                        {post.name}
                      </p>
                      <p className="content-card-meta">
                        Creator • {post.author ?? "Unknown"}
                      </p>
                    </div>
                  </div>

                  <p className="content-card-description">
                    {post.description}
                  </p>

                  <a
                    href={post.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="content-card-link"
                  >
                    View project / portfolio
                  </a>

                  <div className="content-card-footer">
                    <div className="flex gap-2"></div>
                    {user && post.author === user.username ? (
                      <button
                        type="button"
                        className="delete-content-button"
                        onClick={() => onDeletePost(post._id)}
                        aria-label="Delete post"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </motion.article>
          ))}
        </div>
      ) : null}
    </motion.section>
  );
}
