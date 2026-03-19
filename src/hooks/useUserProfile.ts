import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5001/api";

export interface UserProfileData {
  id: string;
  username: string;
  email?: string;
  bio?: string | null;
  profile_picture?: string | null;
  is_guest?: boolean;
  coins?: number;
  mmr?: number;
  created_at?: string;
}

type UpdateProfilePayload = {
  username: string;
  bio: string;
  profile_picture: string;
};

const normalize = (value: string | null | undefined) => (value ?? "").trim();

export function useUserProfile(authToken: string | null) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [form, setForm] = useState<UpdateProfilePayload>({
    username: "",
    bio: "",
    profile_picture: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parseError = useCallback(async (response: Response) => {
    try {
      const data = await response.json();
      return data?.error || data?.message || "Request failed";
    } catch {
      return "Request failed";
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/user/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = await response.json();
      const user: UserProfileData | undefined = data?.user;
      if (!user) {
        throw new Error("Invalid profile response");
      }

      setProfile(user);
      setForm({
        username: user.username || "",
        bio: user.bio || "",
        profile_picture: user.profile_picture || "",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load profile";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, parseError]);

  useEffect(() => {
    if (!authToken) return;
    fetchProfile();
  }, [authToken, fetchProfile]);

  const updateField = useCallback(
    (field: keyof UpdateProfilePayload, value: string) => {
      setSuccessMessage(null);
      setError(null);
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    if (!profile) return;
    setForm({
      username: profile.username || "",
      bio: profile.bio || "",
      profile_picture: profile.profile_picture || "",
    });
    setError(null);
    setSuccessMessage(null);
  }, [profile]);

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return (
      normalize(form.username) !== normalize(profile.username) ||
      normalize(form.bio) !== normalize(profile.bio) ||
      normalize(form.profile_picture) !== normalize(profile.profile_picture)
    );
  }, [form, profile]);

  const saveProfile = useCallback(async () => {
    if (!authToken) return false;
    if (!hasChanges) return true;

    const username = normalize(form.username);
    if (!username) {
      setError("Username is required.");
      return false;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          username,
          bio: form.bio,
          profile_picture: form.profile_picture,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = await response.json();
      const updatedUser: UserProfileData | undefined = data?.user;
      if (!updatedUser) {
        throw new Error("Invalid update response");
      }

      setProfile((prev) => ({
        ...(prev || { id: updatedUser.id, username: updatedUser.username }),
        ...updatedUser,
      }));
      setForm({
        username: updatedUser.username || "",
        bio: updatedUser.bio || "",
        profile_picture: updatedUser.profile_picture || "",
      });
      setSuccessMessage("Profile updated successfully.");
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [authToken, form, hasChanges, parseError]);

  return {
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
  };
}
