/**
 * useProfile — localStorage-backed off-chain user profile.
 *
 * Stores { displayName, email, bio } keyed by the user's Stellar public key
 * so each wallet gets its own isolated profile. Falls back to empty strings
 * when no data is found.
 *
 * Strategy: localStorage only (no server, no signing). Simple and instant;
 * the data lives in the browser and is keyed per-wallet so different wallets
 * on the same machine don't share profiles.
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';

export interface UserProfile {
  displayName: string;
  email: string;
  bio: string;
}

const EMPTY_PROFILE: UserProfile = { displayName: '', email: '', bio: '' };

function storageKey(publicKey: string) {
  return `bazaar:profile:${publicKey}`;
}

function readFromStorage(publicKey: string | null): UserProfile {
  if (!publicKey) return EMPTY_PROFILE;
  try {
    const raw = localStorage.getItem(storageKey(publicKey));
    if (!raw) return EMPTY_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      displayName: parsed.displayName ?? '',
      email: parsed.email ?? '',
      bio: parsed.bio ?? '',
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

function writeToStorage(publicKey: string, profile: UserProfile): void {
  try {
    localStorage.setItem(storageKey(publicKey), JSON.stringify(profile));
  } catch {
    // Storage might be unavailable (private browsing, quota exceeded); fail silently.
  }
}

export function useProfile() {
  const { publicKey } = useWallet();
  const [profile, setProfileState] = useState<UserProfile>(() => readFromStorage(publicKey));

  // Re-read from storage whenever the connected wallet changes.
  useEffect(() => {
    setProfileState(readFromStorage(publicKey));
  }, [publicKey]);

  /**
   * Persist a new profile. Merges the incoming changes with the current
   * profile state and writes to localStorage.
   */
  const saveProfile = useCallback(
    (updates: Partial<UserProfile>): void => {
      if (!publicKey) return;
      const next: UserProfile = {
        displayName: updates.displayName ?? profile.displayName,
        email: updates.email ?? profile.email,
        bio: updates.bio ?? profile.bio,
      };
      writeToStorage(publicKey, next);
      setProfileState(next);
    },
    [publicKey, profile],
  );

  /** Convenience: what to display in the nav / user menu (falls back to short key). */
  const displayLabel = profile.displayName.trim()
    ? profile.displayName.trim()
    : publicKey
    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
    : '';

  return { profile, saveProfile, displayLabel };
}
