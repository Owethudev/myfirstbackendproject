import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { getCoverStyle } from "../utils.ts";
import type { EventItem, FeedRequestState, UserProfile } from "../types.ts";

type EventFeedProps = {
  events: EventItem[];
  user: UserProfile | null;
  viewMode: "current" | "grid";
  requestState: FeedRequestState;
  onRetry: () => void;
  onViewModeChange: (view: "current" | "grid") => void;
  onDeleteEvent: (eventId: string) => void;
};

export function EventFeed({
  events,
  user,
  viewMode,
  requestState,
  onRetry,
  onViewModeChange,
  onDeleteEvent,
}: EventFeedProps) {
  // This part shows events separately from project posts.
  const isGridView = viewMode === "grid";

  return (
    <motion.section
      id="events"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06 }}
      className="content-feed event-feed"
    >
      <div className="feed-heading">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">
            Community events
          </p>
          <h2>
            FIND YOUR NEXT ROOM
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
            Retry loading events
          </button>
        </div>
      ) : null}

      {requestState.status === "loading" && events.length === 0 ? (
        <div className="feed-empty-state" role="status">
          Loading events...
        </div>
      ) : requestState.status === "ready" && events.length === 0 ? (
        <div className="feed-empty-state">
          No events yet. Be the first to share one with the community.
        </div>
      ) : events.length > 0 ? (
        <div
          className={
            isGridView ? "grid gap-4 grid-cols-2 md:grid-cols-3" : "space-y-4"
          }
        >
          {events.map((event) => (
            <motion.article
              key={event._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="content-card event-content-card"
            >
              <div
                className="content-card-cover event-card-cover"
                style={getCoverStyle(event.name)}
              >
                <div>
                  <p className="card-author">
                    {event.author ? event.author.toUpperCase() : "HOST"}
                  </p>
                  <h3 className="card-title">
                    {event.name}
                  </h3>
                </div>
              </div>

              <div className="content-card-body">
                <p className="content-card-name">
                  {event.theme}
                </p>
                <div className="event-details">
                  <p>Location • {event.location}</p>
                  <p>Time • {event.time}</p>
                  <p>Host • {event.author ?? "Unknown"}</p>
                </div>

                <div className="content-card-footer">
                  {user && event.author === user.username ? (
                    <button
                      type="button"
                      className="delete-content-button"
                      onClick={() => onDeleteEvent(event._id)}
                      aria-label="Delete event"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : null}
    </motion.section>
  );
}
