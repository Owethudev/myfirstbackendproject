import { type FormEvent, type Dispatch, type SetStateAction } from "react";
import { motion } from "framer-motion";
import { LogOut, Send, Trash2, X } from "lucide-react";
import type { EventForm, PostForm, UserProfile } from "../types.ts";

type ProfileDrawerProps = {
  user: UserProfile;
  isOpen: boolean;
  activeFeed: "projects" | "events";
  postForm: PostForm;
  eventForm: EventForm;
  message: string;
  onClose: () => void;
  onPostFormChange: Dispatch<SetStateAction<PostForm>>;
  onEventFormChange: Dispatch<SetStateAction<EventForm>>;
  onPostSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEventSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
  onLogoutEverywhere: () => void;
  onDeleteProfile: () => void;
};

export function ProfileDrawer({
  user,
  isOpen,
  activeFeed,
  postForm,
  eventForm,
  message,
  onClose,
  onPostFormChange,
  onEventFormChange,
  onPostSubmit,
  onEventSubmit,
  onLogout,
  onLogoutEverywhere,
  onDeleteProfile,
}: ProfileDrawerProps) {
  // This drawer holds profile information and the create-card that matches the current feed.
  const showProjectCard = activeFeed === "projects";
  const showEventCard = activeFeed === "events";

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "-110%" }}
        transition={{ type: "spring", stiffness: 280, damping: 32 }}
        className="fixed inset-y-0 left-0 z-40 w-[90vw] max-w-sm overflow-y-auto border-r border-[#2D1E2F]/10 bg-[#FFF8F0]/95 p-5 shadow-[24px_0_60px_rgba(45,30,47,0.18)] backdrop-blur md:w-[360px]"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF6B35]">
              Profile
            </p>
            <h2 className="mt-1 font-['Bebas_Neue'] text-3xl text-[#2D1E2F]">
              {user.username}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0] p-2 text-[#2D1E2F] transition hover:bg-[#F9F5EE]"
            onClick={onClose}
            aria-label="Close profile drawer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-[#2D1E2F]/10 bg-[#FFF8F0]/80 p-4 text-sm text-[#2D1E2F]">
            <p className="font-semibold">Email</p>
            <p className="text-[#2D1E2F]/70">{user.email}</p>
          </div>

          {showProjectCard ? (
            <div className="rounded-[1.5rem] border border-[#2D1E2F]/10 bg-[#FFF8F0]/80 p-4">
              <p className="mb-3 text-sm font-semibold text-[#2D1E2F]">
                Post a project
              </p>
              <form onSubmit={onPostSubmit} className="space-y-3">
                <input
                  placeholder="Project title"
                  value={postForm.name}
                  onChange={(event) =>
                    onPostFormChange({ ...postForm, name: event.target.value })
                  }
                  className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                  required
                />
                <textarea
                  placeholder="Short project description"
                  value={postForm.description}
                  onChange={(event) =>
                    onPostFormChange({
                      ...postForm,
                      description: event.target.value,
                    })
                  }
                  className="min-h-24 w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                  required
                />
                <input
                  placeholder="Portfolio link"
                  value={postForm.portfolio}
                  onChange={(event) =>
                    onPostFormChange({
                      ...postForm,
                      portfolio: event.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                  required
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-4 py-3 font-semibold text-[#FFF8F0]"
                >
                  Publish project
                  <Send size={16} />
                </button>
              </form>
              {message ? (
                <p className="mt-3 rounded-2xl border border-[#F9B208]/30 bg-[#F9B208]/10 px-4 py-2 text-sm text-[#2D1E2F]">
                  {message}
                </p>
              ) : null}
            </div>
          ) : null}

          {showEventCard ? (
            <div className="rounded-[1.5rem] border border-[#2D1E2F]/10 bg-[#FFF8F0]/80 p-4">
              <p className="mb-3 text-sm font-semibold text-[#2D1E2F]">
                Post an event
              </p>
              <form onSubmit={onEventSubmit} className="space-y-3">
                <input
                  placeholder="Event name"
                  value={eventForm.name}
                  onChange={(event) =>
                    onEventFormChange({
                      ...eventForm,
                      name: event.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                  required
                />
                <input
                  placeholder="Location"
                  value={eventForm.location}
                  onChange={(event) =>
                    onEventFormChange({
                      ...eventForm,
                      location: event.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                  required
                />
                <input
                  placeholder="Theme"
                  value={eventForm.theme}
                  onChange={(event) =>
                    onEventFormChange({
                      ...eventForm,
                      theme: event.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                  required
                />
                <input
                  type="datetime-local"
                  aria-label="Event time"
                  value={eventForm.time}
                  onChange={(event) =>
                    onEventFormChange({
                      ...eventForm,
                      time: event.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                  required
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EF476F] px-4 py-3 font-semibold text-[#FFF8F0]"
                >
                  Publish event
                  <Send size={16} />
                </button>
              </form>
              {message ? (
                <p className="mt-3 rounded-2xl border border-[#F9B208]/30 bg-[#F9B208]/10 px-4 py-2 text-sm text-[#2D1E2F]">
                  {message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 font-semibold text-[#2D1E2F]"
              onClick={onLogout}
            >
              <LogOut size={16} />
              Log out
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#FF6B35]/20 bg-[#FFF8F0] px-4 py-3 font-semibold text-[#FF6B35]"
              onClick={onLogoutEverywhere}
            >
              <LogOut size={16} />
              Log out everywhere
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#EF476F]/20 bg-[#EF476F]/10 px-4 py-3 font-semibold text-[#EF476F]"
              onClick={onDeleteProfile}
            >
              <Trash2 size={16} />
              Delete profile
            </button>
          </div>
        </div>
      </motion.aside>

      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[#1F1B24]/40"
          onClick={onClose}
          aria-label="Close profile menu"
        />
      ) : null}
    </>
  );
}
