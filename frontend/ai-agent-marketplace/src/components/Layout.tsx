/**
 * Layout — sticky nav shell shared by all inner routes.
 *
 * Auth-aware navigation (Issue 1):
 *  - Nav items tagged `auth: true` are shown to everyone but rendered with a
 *    lock icon + tooltip when the wallet is disconnected.
 *  - Clicking a locked item triggers the connect flow instead of navigating.
 *  - The "Connect" button switches to a primary (filled) style when no wallet
 *    is connected so it stands out as the clear call-to-action.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { Button } from './ui/Button';
import { UserMenu } from './UserMenu';
import { Lock, Wallet } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  /** When true the item requires wallet connection. */
  auth?: boolean;
}

const navItems: NavItem[] = [
  { path: '/marketplace', label: 'Marketplace', icon: '🏪' },
  { path: '/create-job', label: 'Post Job', icon: '📝', auth: true },
  { path: '/register-agent', label: 'Register Agent', icon: '🤖', auth: true },
  { path: '/dashboard', label: 'Dashboard', icon: '📊', auth: true },
];

// ── small tooltip wrapper ────────────────────────────────────────────────────
const LockedTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative group inline-flex">
    {children}
    <div
      role="tooltip"
      className={[
        'pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50',
        'whitespace-nowrap rounded-lg bg-popover border border-border px-3 py-1.5',
        'text-xs text-popover-foreground shadow-md',
        'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100',
        'transition-all duration-150',
      ].join(' ')}
    >
      <span className="flex items-center gap-1">
        <Lock className="h-3 w-3" />
        Connect wallet to access
      </span>
    </div>
  </div>
);

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isConnected, connect, isConnecting } = useWallet();
  const navigate = useNavigate();

  // Close mobile menu on outside click
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobileMenuOpen]);

  /** Navigate when connected, otherwise trigger connect flow. */
  const handleLockedClick = (path: string) => {
    if (isConnected) {
      navigate(path);
    } else {
      connect();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link to="/marketplace" className="flex items-center space-x-2 shrink-0">
            <span className="text-2xl" aria-hidden="true">🤖</span>
            <span className="text-xl font-bold text-primary">AgentMarket</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navItems.map((item) => {
              const isLocked = item.auth && !isConnected;

              if (isLocked) {
                return (
                  <LockedTooltip key={item.path}>
                    <button
                      onClick={() => handleLockedClick(item.path)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium
                                 text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent/50
                                 transition-colors select-none"
                      aria-label={`${item.label} — connect wallet to access`}
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                      <Lock className="h-3 w-3 opacity-70" />
                    </button>
                  </LockedTooltip>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`
                  }
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <UserMenu />
            ) : (
              /* Primary-styled button when disconnected — makes it the obvious CTA */
              <Button
                onClick={() => connect()}
                disabled={isConnecting}
                className="gap-2 font-semibold shadow-sm"
                size="sm"
                aria-label="Connect Freighter wallet"
              >
                <Wallet className="h-4 w-4" />
                {isConnecting ? 'Connecting…' : 'Connect Wallet'}
              </Button>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t px-4 py-3 space-y-1 bg-background/95 backdrop-blur"
          >
            {navItems.map((item) => {
              const isLocked = item.auth && !isConnected;

              if (isLocked) {
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLockedClick(item.path);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg
                               text-sm font-medium text-muted-foreground/60 hover:bg-accent/50
                               transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground/50">
                      <Lock className="h-3 w-3" />
                      Connect wallet
                    </span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    }`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              );
            })}

            {!isConnected && (
              <div className="pt-2 border-t">
                <Button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    connect();
                  }}
                  className="w-full gap-2 font-semibold"
                  disabled={isConnecting}
                >
                  <Wallet className="h-4 w-4" />
                  {isConnecting ? 'Connecting…' : 'Connect Wallet'}
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>Built on Stellar Soroban • AI Agent Marketplace</p>
        </div>
      </footer>
    </div>
  );
};
