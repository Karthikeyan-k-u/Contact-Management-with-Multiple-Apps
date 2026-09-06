import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export const USER_PROFILE_STORAGE_KEY = 'nexus_crm_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Karthik',
  email: 'karthik@nexus.app',
  role: 'Admin',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
};

interface UserProfileContextValue {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

function loadProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (saved) {
      const p = JSON.parse(saved);
      return {
        name: p.name || DEFAULT_PROFILE.name,
        email: p.email || DEFAULT_PROFILE.email,
        role: p.role || DEFAULT_PROFILE.role,
        avatar: p.avatar || DEFAULT_PROFILE.avatar,
      };
    }
  } catch {
    // Ignored
  }
  return DEFAULT_PROFILE;
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);

  useEffect(() => {
    try {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignored
    }
  }, [profile]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextValue {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return ctx;
}