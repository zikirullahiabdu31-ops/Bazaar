/**
 * UserMenu — wallet avatar button + dropdown for connected users.
 *
 * Shows the user's display name (from localStorage profile) in the button
 * instead of the raw public key. Falls back to the truncated key when no
 * display name has been saved yet.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useProfile } from '../hooks/useProfile';
import { Button } from './ui/Button';
import { Link } from 'react-router-dom';

export const UserMenu: React.FC = () => {
  const { publicKey, disconnect } = useWallet();
  const { displayLabel } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border-primary/40 bg-card/60 max-w-[200px]"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {/* Live green dot */}
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse"
          aria-label="Connected"
        />
        {/* Display name or truncated key */}
        <span className="truncate text-sm font-medium">{displayLabel}</span>
      </Button>

      {isOpen && (
        <div
          role="menu"
          aria-label="User menu"
          className="absolute right-0 mt-2 w-52 rounded-xl border bg-card p-2 shadow-xl z-50"
        >
          {/* Key hint at the top when a display name is set */}
          {publicKey && (
            <div className="px-3 py-2 mb-1 border-b border-border">
              <p className="text-xs text-muted-foreground font-mono truncate">
                {publicKey.slice(0, 8)}…{publicKey.slice(-6)}
              </p>
            </div>
          )}

          <Link
            to="/dashboard"
            role="menuitem"
            className="block px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
            onClick={() => setIsOpen(false)}
          >
            📊 Dashboard
          </Link>
          <Link
            to="/settings"
            role="menuitem"
            className="block px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
            onClick={() => setIsOpen(false)}
          >
            ⚙️ Settings
          </Link>
          <hr className="my-1 border-border" />
          <button
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              disconnect();
            }}
            className="w-full text-left px-3 py-2 text-sm rounded-lg text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            🚪 Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
