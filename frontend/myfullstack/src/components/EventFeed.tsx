import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { getCoverStyle } from "../utils.ts";
import type { EventItem, UserProfile } from "../types.ts";

type EventFeedProps = {
  events: EventItem[];
  user: UserProfile;
  onDeleteEvent: (eventId: string) => void;
};

export function EventFeed({ events, user, onDeleteEvent }: EventFeedProps) {
  // This part shows events separately from project posts.
  return (
    <motion.section
      id="events"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between rounded-[1.5rem] border border-[#2D1E2F]/10 bg-[#FFF8F0]/75 p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF6B35]">
            Community events
          </p>
          <h2 className="mt-1 font-['Bebas_Neue'] text-2xl text-[#2D1E2F]">
            FIND YOUR NEXT ROOM
          </h2>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-[#2D1E2F]/20 bg-[#FFF8F0]/70 p-6 text-center text-sm text-[#2D1E2F]/70">
          No events yet. Be the first to share one with the community.
        </div>
      ) : (
        events.map((event) => (
          <motion.article
            key={event._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[1.75rem] border border-[#2D1E2F]/10 bg-[#FFF8F0] shadow-[0_16px_50px_rgba(45,30,47,0.10)]"
          >
            <div
              className="flex min-h-36 items-end justify-between px-5 py-5 text-[#2D1E2F]"
              style={getCoverStyle(event.name)}
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#2D1E2F]/70">
                  {event.author ? event.author.toUpperCase() : "HOST"}
                </p>
                <h3 className="mt-2 font-['Bebas_Neue'] text-3xl leading-none">
                  {event.name}
                </h3>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <p className="text-sm font-semibold text-[#2D1E2F]">
                {event.theme}
              </p>
              <div className="space-y-1 text-sm text-[#2D1E2F]/70">
                <p>Location • {event.location}</p>
                <p>Time • {event.time}</p>
                <p>Host • {event.author ?? "Unknown"}</p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#2D1E2F]/10 pt-4">
                {event.author === user.username ? (
                  <button
                    type="button"
                    className="ml-2 rounded-full border p-2.5 text-[#EF476F] transition hover:-translate-y-0.5"
                    onClick={() => onDeleteEvent(event._id)}
                    aria-label="Delete event"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
            </div>
          </motion.article>
        ))
      )}
    </motion.section>
  );
}
