import { type FormEvent, type Dispatch, type SetStateAction } from "react";
import { motion } from "framer-motion";
import { LogOut, Send, X } from "lucide-react";
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
}: ProfileDrawerProps) {
  const showProjectCard = activeFeed === "projects";
  const showEventCard = activeFeed === "events";

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "-110%" }}
        transition={{ type: "spring", stiffness: 280, damping: 32 }}
        className="profile-drawer"
        role="dialog"
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        aria-labelledby="profile-drawer-title"
        inert={!isOpen}
      >
        <div className="profile-drawer-header">
          <div>
            <p className="profile-drawer-kicker">Your account</p>
            <h2 className="profile-drawer-title" id="profile-drawer-title">
              {user.username}
            </h2>
          </div>
          <button
            type="button"
            className="profile-drawer-close"
            onClick={onClose}
            aria-label="Close profile drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="profile-drawer-content">
          <div className="profile-account-card">
            <span className="profile-account-label">Signed in as</span>
            <span className="profile-account-email">{user.email}</span>
          </div>

          {showProjectCard ? (
            <section className="profile-form-card" aria-labelledby="project-form-title">
              <div className="profile-form-heading">
                <p className="profile-drawer-kicker">Community feed</p>
                <h3 id="project-form-title">Share your project</h3>
                <p className="profile-form-description">
                  Show the community what you've been working on.
                </p>
              </div>
              <form onSubmit={onPostSubmit} className="profile-form">
                <label className="profile-form-field">
                  Project title
                  <input
                    value={postForm.name}
                    onChange={(event) =>
                      onPostFormChange({ ...postForm, name: event.target.value })
                    }
                    placeholder="e.g. A new portfolio"
                    required
                  />
                </label>
                <label className="profile-form-field">
                  Description
                  <textarea
                    value={postForm.description}
                    onChange={(event) =>
                      onPostFormChange({
                        ...postForm,
                        description: event.target.value,
                      })
                    }
                    placeholder="What should people know about your project?"
                    required
                  />
                </label>
                <label className="profile-form-field">
                  Portfolio link
                  <input
                    value={postForm.portfolio}
                    onChange={(event) =>
                      onPostFormChange({
                        ...postForm,
                        portfolio: event.target.value,
                      })
                    }
                    placeholder="https://"
                    required
                  />
                </label>
                <button type="submit" className="profile-form-submit">
                  Publish project
                  <Send size={15} />
                </button>
              </form>
              {message ? (
                <p className="profile-drawer-message" role="status">
                  {message}
                </p>
              ) : null}
            </section>
          ) : null}

          {showEventCard ? (
            <section
              className="profile-form-card profile-event-form-card"
              aria-labelledby="event-form-title"
            >
              <div className="profile-form-heading">
                <p className="profile-drawer-kicker">Community events</p>
                <h3 id="event-form-title">Create an event</h3>
                <p className="profile-form-description">
                  Bring the community together around an idea.
                </p>
              </div>
              <form onSubmit={onEventSubmit} className="profile-form">
                <label className="profile-form-field">
                  Event name
                  <input
                    value={eventForm.name}
                    onChange={(event) =>
                      onEventFormChange({
                        ...eventForm,
                        name: event.target.value,
                      })
                    }
                    placeholder="Give your event a name"
                    required
                  />
                </label>
                <label className="profile-form-field">
                  Location
                  <input
                    value={eventForm.location}
                    onChange={(event) =>
                      onEventFormChange({
                        ...eventForm,
                        location: event.target.value,
                      })
                    }
                    placeholder="Online or a place"
                    required
                  />
                </label>
                <label className="profile-form-field">
                  Theme
                  <input
                    value={eventForm.theme}
                    onChange={(event) =>
                      onEventFormChange({
                        ...eventForm,
                        theme: event.target.value,
                      })
                    }
                    placeholder="What's it about?"
                    required
                  />
                </label>
                <label className="profile-form-field">
                  Event time
                  <input
                    type="datetime-local"
                    value={eventForm.time}
                    onChange={(event) =>
                      onEventFormChange({
                        ...eventForm,
                        time: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <button type="submit" className="profile-form-submit">
                  Publish event
                  <Send size={15} />
                </button>
              </form>
              {message ? (
                <p className="profile-drawer-message" role="status">
                  {message}
                </p>
              ) : null}
            </section>
          ) : null}

          <div className="profile-drawer-account-actions">
            <button
              type="button"
              className="profile-drawer-action"
              onClick={onLogout}
            >
              <LogOut size={16} />
              Log out
            </button>
            <button
              type="button"
              className="profile-drawer-action profile-drawer-action-secondary"
              onClick={onLogoutEverywhere}
            >
              <LogOut size={16} />
              Log out everywhere
            </button>
          </div>
        </div>
      </motion.aside>

      {isOpen ? (
        <button
          type="button"
          className="profile-drawer-backdrop"
          onClick={onClose}
          aria-label="Close profile menu"
        />
      ) : null}
    </>
  );
}
