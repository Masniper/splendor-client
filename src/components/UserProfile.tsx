import React from "react";
import { useUserProfile } from "../hooks/useUserProfile";

type UserProfileProps = {
  authToken: string | null;
  theme: "light" | "dark";
  onBack: () => void;
  onLogout: () => void;
};

export function UserProfile({
  authToken,
  theme,
  onBack,
  onLogout,
}: UserProfileProps) {
  const isDark = theme === "dark";
  const {
    profile,
    form,
    isLoading,
    isSaving,
    error,
    successMessage,
    hasChanges,
    fetchProfile,
    updateField,
    resetForm,
    saveProfile,
  } = useUserProfile(authToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile();
  };

  const initials = (profile?.username || "U").trim().charAt(0).toUpperCase();
  const avatarSrc = form.profile_picture.trim();

  return (
    <div
      className={`min-h-screen p-4 sm:p-8 transition-colors duration-500 bg-cover bg-center bg-fixed ${
        isDark ? "text-stone-100" : "text-gray-800"
      }`}
      style={{
        backgroundImage: `linear-gradient(${
          isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)"
        }, ${isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)"}), url('/images/startup-bg.jpg')`,
      }}
    >
      <div
        className={`mx-auto w-full max-w-3xl rounded-3xl border-2 p-6 sm:p-8 shadow-2xl ${
          isDark
            ? "bg-zinc-900/90 border-zinc-700/70"
            : "bg-white/95 border-gray-200/80"
        }`}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`rounded-lg px-4 py-2 font-bold transition-colors ${
              isDark
                ? "bg-zinc-800 text-stone-200 hover:bg-zinc-700 border border-zinc-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            Back
          </button>
          <button
            type="button"
            onClick={onLogout}
            className={`rounded-lg px-4 py-2 font-bold transition-colors ${
              isDark
                ? "bg-zinc-800 text-red-300 hover:bg-zinc-700 border border-zinc-700"
                : "bg-gray-100 text-red-600 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            Logout
          </button>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-amber-500 tracking-wide font-serif">
          User Profile
        </h1>
        <p className={`mt-1 text-sm ${isDark ? "text-stone-400" : "text-gray-600"}`}>
          Manage your account information.
        </p>

        {isLoading ? (
          <div className="mt-8 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
            Loading profile...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  isDark
                    ? "border-red-500/50 bg-red-900/40 text-red-200"
                    : "border-red-300 bg-red-50 text-red-700"
                }`}
              >
                <div>{error}</div>
                <button
                  type="button"
                  onClick={fetchProfile}
                  className="mt-2 font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}

            {successMessage && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  isDark
                    ? "border-emerald-500/40 bg-emerald-900/30 text-emerald-200"
                    : "border-emerald-300 bg-emerald-50 text-emerald-700"
                }`}
              >
                {successMessage}
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-amber-500/60 bg-zinc-700/40">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Profile avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <div className={`text-sm ${isDark ? "text-stone-400" : "text-gray-500"}`}>
                  Email
                </div>
                <div className="font-semibold">{profile?.email || "-"}</div>
              </div>
            </div>

            <div>
              <label className={`mb-1 block text-sm font-semibold ${isDark ? "text-stone-300" : "text-gray-700"}`}>
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700 text-stone-100 focus:border-amber-500"
                    : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                }`}
              />
            </div>

            <div>
              <label className={`mb-1 block text-sm font-semibold ${isDark ? "text-stone-300" : "text-gray-700"}`}>
                Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={4}
                className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700 text-stone-100 focus:border-amber-500"
                    : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                }`}
                placeholder="Tell something about yourself"
              />
            </div>

            <div>
              <label className={`mb-1 block text-sm font-semibold ${isDark ? "text-stone-300" : "text-gray-700"}`}>
                Profile Picture URL
              </label>
              <input
                type="url"
                value={form.profile_picture}
                onChange={(e) => updateField("profile_picture", e.target.value)}
                className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700 text-stone-100 focus:border-amber-500"
                    : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                }`}
                placeholder="https://example.com/avatar.png"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={!hasChanges || isSaving}
                className="rounded-xl bg-amber-600 px-5 py-3 font-bold text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className={`rounded-xl px-5 py-3 font-bold transition-colors ${
                  isDark
                    ? "bg-zinc-800 text-stone-200 hover:bg-zinc-700 border border-zinc-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
