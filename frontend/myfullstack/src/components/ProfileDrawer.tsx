import { type FormEvent, type Dispatch, type SetStateAction } from "react";
import { motion } from "framer-motion";
import { LogOut, Send, Trash2, X } from "lucide-react";
import type { PostForm, ProfileForm, UserProfile } from "../types.ts";

type ProfileDrawerProps = {
  user: UserProfile;
  isOpen: boolean;
  isEditing: boolean;
  profileForm: ProfileForm;
  postForm: PostForm;
  message: string;
  onClose: () => void;
  onToggleEditing: () => void;
  onProfileFormChange: Dispatch<SetStateAction<ProfileForm>>;
  onPostFormChange: Dispatch<SetStateAction<PostForm>>;
  onProfileSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPostSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
  onDeleteProfile: () => void;
};

export function ProfileDrawer({
  user,
  isOpen,
  isEditing,
  profileForm,
  postForm,
  message,
  onClose,
  onToggleEditing,
  onProfileFormChange,
  onPostFormChange,
  onProfileSubmit,
  onPostSubmit,
  onLogout,
  onDeleteProfile,
}: ProfileDrawerProps) {
  // I keep profile editing, project publishing, and account actions together as one profile workflow.
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

          <div className="space-y-3 rounded-[1.5rem] border border-[#2D1E2F]/10 bg-[#FFF8F0]/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#2D1E2F]">
                Profile actions
              </p>
              <button
                type="button"
                className="rounded-full border border-[#2D1E2F]/10 bg-[#FFF8F0] px-3 py-2 text-sm font-semibold text-[#2D1E2F]"
                onClick={onToggleEditing}
              >
                {isEditing ? "Cancel" : "Edit"}
              </button>
            </div>
            {isEditing ? (
              <form onSubmit={onProfileSubmit} className="space-y-3">
                <input
                  placeholder="New username"
                  value={profileForm.username}
                  onChange={(event) =>
                    onProfileFormChange({
                      ...profileForm,
                      username: event.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                />
                <input
                  placeholder="New email"
                  type="email"
                  value={profileForm.email}
                  onChange={(event) =>
                    onProfileFormChange({
                      ...profileForm,
                      email: event.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                />
                <input
                  placeholder="New password"
                  type="password"
                  value={profileForm.password}
                  onChange={(event) =>
                    onProfileFormChange({
                      ...profileForm,
                      password: event.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#2D1E2F]/10 bg-[#FFF8F0] px-4 py-3 outline-none transition focus:border-[#EF476F] focus:ring-2 focus:ring-[#EF476F]/30"
                />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#2D1E2F] px-4 py-3 font-semibold text-[#FFF8F0]"
                >
                  Save profile
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="w-full rounded-2xl border border-[#EF476F]/20 bg-[#EF476F]/10 px-4 py-3 text-sm font-semibold text-[#EF476F]"
                onClick={onToggleEditing}
              >
                Edit profile
              </button>
            )}
          </div>

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
