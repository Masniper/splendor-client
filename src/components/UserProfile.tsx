import React from "react";
import { Coins } from "lucide-react";
import { useUserProfile } from "../hooks/useUserProfile";

/** Must match back-end `WELCOME_REWARD_COINS` in user.service.ts */
const GUEST_UPGRADE_BONUS_COINS = 500;

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
    isUpgrading,
    error,
    successMessage,
    hasChanges,
    fetchProfile,
    updateField,
    resetForm,
    saveProfile,
    upgradeGuestAccount,
  } = useUserProfile(authToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile();
  };

  const [upgradeForm, setUpgradeForm] = React.useState<{
    username: string;
    email: string;
    password: string;
  }>({ username: "", email: "", password: "" });

  const role = profile?.role;
  const isGuest = role === "GUEST";

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await upgradeGuestAccount({
      username: upgradeForm.username.trim(),
      email: upgradeForm.email.trim(),
      password: upgradeForm.password,
    });
    if (ok) {
      setUpgradeForm({ username: "", email: "", password: "" });
    }
  };

  const initials = (profile?.username || "U").trim().charAt(0).toUpperCase();
  const avatarSrc = form.profile_picture.trim();
  const wins = profile?.wins ?? 0;
  const losses = profile?.losses ?? 0;
  const winRate = Number(profile?.winRate ?? 0).toFixed(2);
  const coins = profile?.coins ?? 0;

  return (
    <div
      className={`min-h-screen bg-cover bg-center bg-fixed p-4 font-sans transition-colors duration-500 sm:p-8 ${
        isDark ? "text-stone-100" : "text-gray-800"
      }`}
      style={{
        backgroundImage: `linear-gradient(${
          isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)"
        }, ${isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)"}), url('/images/startup-bg.jpg')`,
      }}
    >
      <div
        className={`mx-auto w-full max-w-xl rounded-3xl border p-6 shadow-2xl sm:p-8 ${
          isDark
            ? "border-zinc-700/70 bg-zinc-900/90"
            : "border-gray-200/80 bg-white/95"
        }`}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              isDark
                ? "border-zinc-700 bg-zinc-800 text-stone-200 hover:bg-zinc-700"
                : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Back
          </button>
          <button
            type="button"
            onClick={onLogout}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              isDark
                ? "border-zinc-700 bg-zinc-800 text-red-300 hover:bg-zinc-700"
                : "border-gray-200 bg-gray-100 text-red-600 hover:bg-gray-200"
            }`}
          >
            Logout
          </button>
        </div>

        <h1 className="font-serif text-3xl font-bold tracking-wide text-amber-500">
          Profile
        </h1>
        <p
          className={`mt-1 text-sm ${isDark ? "text-stone-400" : "text-gray-600"}`}
        >
          {isGuest
            ? "Guest session — upgrade to keep your progress everywhere."
            : "Your account and stats."}
        </p>

        {isLoading ? (
          <div
            className={`mt-8 rounded-xl border p-4 text-sm ${
              isDark
                ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            Loading…
          </div>
        ) : (
          <>
            {error && (
              <div
                className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                  isDark
                    ? "border-red-500/40 bg-red-950/50 text-red-200"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <p>{error}</p>
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
                className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                  isDark
                    ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
                }`}
              >
                {successMessage}
              </div>
            )}

            {/* Identity + balance */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-amber-500/50 bg-zinc-700/40">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                    {initials}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold">
                    {profile?.username || "Player"}
                  </span>
                  {isGuest ? (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase ${
                        isDark
                          ? "border-zinc-600 bg-zinc-800 text-stone-400"
                          : "border-gray-300 bg-gray-100 text-gray-600"
                      }`}
                    >
                      Guest
                    </span>
                  ) : (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase ${
                        isDark
                          ? "border-emerald-600/50 bg-emerald-950/50 text-emerald-300"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      Member
                    </span>
                  )}
                </div>
                {!isGuest && profile?.email && (
                  <p
                    className={`mt-1 truncate text-sm ${isDark ? "text-stone-400" : "text-gray-600"}`}
                  >
                    {profile.email}
                  </p>
                )}
                <div
                  className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
                    isDark
                      ? "border-zinc-600 bg-zinc-800/80"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <Coins
                    className={`h-4 w-4 ${isDark ? "text-amber-500" : "text-amber-600"}`}
                  />
                  <span
                    className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-stone-500" : "text-gray-500"}`}
                  >
                    Balance
                  </span>
                  <span className="text-sm font-bold tabular-nums text-amber-500">
                    {coins}
                  </span>
                  <span
                    className={`text-xs ${isDark ? "text-stone-500" : "text-gray-500"}`}
                  >
                    coins
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              <div
                className={`rounded-xl border p-3 text-center ${
                  isDark ? "border-zinc-700 bg-zinc-800/60" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="text-[10px] font-semibold uppercase opacity-70">
                  XP
                </div>
                <div className="text-lg font-bold text-amber-500">
                  {profile?.xp ?? 0}
                </div>
              </div>
              <div
                className={`rounded-xl border p-3 text-center ${
                  isDark ? "border-zinc-700 bg-zinc-800/60" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="text-[10px] font-semibold uppercase opacity-70">
                  W / L
                </div>
                <div className="text-lg font-bold">
                  {wins} / {losses}
                </div>
              </div>
              <div
                className={`rounded-xl border p-3 text-center ${
                  isDark ? "border-zinc-700 bg-zinc-800/60" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="text-[10px] font-semibold uppercase opacity-70">
                  Win %
                </div>
                <div className="text-lg font-bold text-sky-500">{winRate}%</div>
              </div>
            </div>

            {isGuest && (
              <div
                className={`mt-8 rounded-2xl border p-5 ${
                  isDark ? "border-amber-600/30 bg-amber-950/20" : "border-amber-200 bg-amber-50/80"
                }`}
              >
                <h2
                  className={`font-serif text-lg font-bold ${isDark ? "text-amber-100" : "text-amber-950"}`}
                >
                  Upgrade to a full account
                </h2>
                <p
                  className={`mt-2 text-sm leading-relaxed ${isDark ? "text-stone-300" : "text-amber-950/80"}`}
                >
                  Add email and password to save your progress and sign in on any device.
                  You will receive{" "}
                  <strong className="text-amber-400">
                    {GUEST_UPGRADE_BONUS_COINS} bonus coins
                  </strong>{" "}
                  after a successful upgrade.
                </p>
                <form onSubmit={handleUpgrade} className="mt-5 space-y-3">
                  <div>
                    <label
                      className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${isDark ? "text-stone-400" : "text-gray-600"}`}
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      autoComplete="username"
                      value={upgradeForm.username}
                      onChange={(e) =>
                        setUpgradeForm((p) => ({ ...p, username: e.target.value }))
                      }
                      required
                      minLength={2}
                      maxLength={32}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                        isDark
                          ? "border-zinc-600 bg-zinc-900 text-stone-100 focus:border-amber-500"
                          : "border-gray-300 bg-white text-gray-900 focus:border-amber-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${isDark ? "text-stone-400" : "text-gray-600"}`}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      value={upgradeForm.email}
                      onChange={(e) =>
                        setUpgradeForm((p) => ({ ...p, email: e.target.value }))
                      }
                      required
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                        isDark
                          ? "border-zinc-600 bg-zinc-900 text-stone-100 focus:border-amber-500"
                          : "border-gray-300 bg-white text-gray-900 focus:border-amber-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${isDark ? "text-stone-400" : "text-gray-600"}`}
                    >
                      Password (min. 6 characters)
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={upgradeForm.password}
                      onChange={(e) =>
                        setUpgradeForm((p) => ({ ...p, password: e.target.value }))
                      }
                      required
                      minLength={6}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                        isDark
                          ? "border-zinc-600 bg-zinc-900 text-stone-100 focus:border-amber-500"
                          : "border-gray-300 bg-white text-gray-900 focus:border-amber-500"
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUpgrading}
                    className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUpgrading ? "Upgrading…" : `Upgrade & claim ${GUEST_UPGRADE_BONUS_COINS} coins`}
                  </button>
                </form>
              </div>
            )}

            {!isGuest && (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <h2
                  className={`font-serif text-base font-bold ${isDark ? "text-stone-200" : "text-gray-800"}`}
                >
                  Edit profile
                </h2>
                <div>
                  <label
                    className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${isDark ? "text-stone-400" : "text-gray-600"}`}
                  >
                    Display name
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => updateField("username", e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                      isDark
                        ? "border-zinc-600 bg-zinc-900 text-stone-100 focus:border-amber-500"
                        : "border-gray-300 bg-white text-gray-900 focus:border-amber-500"
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${isDark ? "text-stone-400" : "text-gray-600"}`}
                  >
                    Bio
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => updateField("bio", e.target.value)}
                    rows={3}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                      isDark
                        ? "border-zinc-600 bg-zinc-900 text-stone-100 focus:border-amber-500"
                        : "border-gray-300 bg-white text-gray-900 focus:border-amber-500"
                    }`}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label
                    className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${isDark ? "text-stone-400" : "text-gray-600"}`}
                  >
                    Avatar image URL
                  </label>
                  <input
                    type="url"
                    value={form.profile_picture}
                    onChange={(e) =>
                      updateField("profile_picture", e.target.value)
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                      isDark
                        ? "border-zinc-600 bg-zinc-900 text-stone-100 focus:border-amber-500"
                        : "border-gray-300 bg-white text-gray-900 focus:border-amber-500"
                    }`}
                    placeholder="https://…"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={!hasChanges || isSaving}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isSaving}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                      isDark
                        ? "border-zinc-600 text-stone-200 hover:bg-zinc-800"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Reset
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
