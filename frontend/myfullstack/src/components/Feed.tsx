import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { getCoverStyle } from "../utils.ts";
import type { PostItem, UserProfile } from "../types.ts";

type FeedProps = {
  posts: PostItem[];
  user: UserProfile;
  viewMode: "current" | "grid";
  onViewModeChange: (view: "current" | "grid") => void;
  onDeletePost: (postId: string) => void;
};

export function Feed({
  posts,
  user,
  viewMode,
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
      className="space-y-4"
    >
      <div className="flex items-start justify-between gap-3 rounded-[1.5rem] border border-[#2D1E2F]/10 bg-[#FFF8F0]/75 p-4 shadow-sm">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#EF476F]">
            Community feed
          </p>
          <h2 className="mt-1 font-['Bebas_Neue'] text-2xl text-[#2D1E2F]">
            SHOW US YOUR WORK
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0] p-1">
          <button
            type="button"
            onClick={() => onViewModeChange("current")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "current"
                ? "bg-[#EF476F] text-[#FFF8F0]"
                : "text-[#2D1E2F]"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "grid"
                ? "bg-[#EF476F] text-[#FFF8F0]"
                : "text-[#2D1E2F]"
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-[#2D1E2F]/20 bg-[#FFF8F0]/70 p-6 text-center text-sm text-[#2D1E2F]/70">
          No posts yet. Be the first to share a project and spark the feed.
        </div>
      ) : (
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
              className="overflow-hidden rounded-[1.75rem] border border-[#2D1E2F]/10 bg-[#FFF8F0] shadow-[0_16px_50px_rgba(45,30,47,0.10)]"
            >
              <div
                className="flex min-h-36 items-end justify-between px-5 py-5 text-[#2D1E2F]"
                style={getCoverStyle(post.name)}
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#2D1E2F]/70">
                    {post.author ? post.author.toUpperCase() : "CREATOR"}
                  </p>
                  <h3 className="mt-2 font-['Bebas_Neue'] text-3xl leading-none">
                    {post.name}
                  </h3>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#2D1E2F]">
                      {post.name}
                    </p>
                    <p className="text-sm text-[#2D1E2F]/70">
                      Creator • {post.author ?? "Unknown"}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-6 text-[#2D1E2F]/80">
                  {post.description}
                </p>

                <a
                  href={post.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm font-semibold text-[#3D5A40] underline-offset-4 hover:text-[#EF476F] hover:underline"
                >
                  View project / portfolio
                </a>

                <div className="flex items-center justify-between gap-2 border-t border-[#2D1E2F]/10 pt-4">
                  <div className="flex gap-2"></div>
                  {post.author === user.username ? (
                    <button
                      type="button"
                      className="ml-2 rounded-full border p-2.5 text-[#EF476F] transition hover:-translate-y-0.5"
                      onClick={() => onDeletePost(post._id)}
                      aria-label="Delete post"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </motion.section>
  );
}
