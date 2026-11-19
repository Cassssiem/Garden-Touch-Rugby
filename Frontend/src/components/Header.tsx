import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GardensLogo } from './GardensLogo';

export const Header: React.FC = () => {
  const {
    activePage,
    setActivePage,
    clubConfig,
    updateClubConfig,
    players,
    clearAllPlayers,
    clearAllGames,
    backendUrl,
    setBackendUrl,
    fetchBackendData,
    setSelectedMatchRound,
    showToast,
    currentUser,
    pendingApprovalsCount,
    setIsAuthModalOpen,
    setAuthModalMode,
    logout,
    switchUserDemo,
    setAdminDashboardTab,
  } = useApp();

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [tempBackendUrl, setTempBackendUrl] = useState(backendUrl);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isSelector = currentUser?.role === 'ADMIN' || currentUser?.role === 'SELECTOR' || !!currentUser?.isSelector;

  interface NavLink {
    id: string;
    label: string;
    badge?: number | null;
  }

  const userNavLinks: NavLink[] = [
    { id: 'home', label: 'Home' },
    { id: 'availability-pool', label: 'Availability Pool' },
    { id: 'team-selection', label: isSelector ? 'Team Selection ★' : 'Team Selection' },
    { id: 'match-history', label: 'Match History' },
    { id: 'player-hub', label: 'Squad' },
  ];

  const adminNavLinks: NavLink[] = [
    { id: 'home', label: 'Home' },
    { id: 'availability-pool', label: 'Availability Pool' },
    { id: 'team-selection', label: 'Team Selection' },
    { id: 'match-history', label: 'Match History' },
    { id: 'player-hub', label: 'Squad' },
    {
      id: 'admin-dashboard',
      label: 'Admin Dashboard',
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
    },
  ];

  const navLinks = (isAdmin ? adminNavLinks : userNavLinks).filter(
    (link) => link.id !== 'team-selection' || isSelector
  );

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#0e0e12]/95 backdrop-blur-xl border-b border-[#2a292e]/80 shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
        <div className="h-20 max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Title */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 group"
            onClick={() => setActivePage('home')}
          >
            <GardensLogo size="md" className="w-11 h-11 group-hover:scale-105 transition-transform drop-shadow-[0_2px_12px_rgba(225,29,72,0.45)]" />
            <div className="flex flex-col min-w-0">
              <span className="font-headline text-base sm:text-xl uppercase tracking-wider text-rose-500 leading-none group-hover:text-rose-400 transition-colors truncate max-w-[38vw] sm:max-w-none">
                {clubConfig.clubName}
              </span>
              <span className="hidden sm:block font-mono text-[10px] uppercase tracking-widest text-[#ac8889] leading-none mt-1 truncate max-w-[38vw] sm:max-w-none">
                {clubConfig.tagline}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#1b1b1f] p-1 rounded-sm border border-[#2a292e]">
            {navLinks.map((link) => {
              const isActive = activePage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    if (link.id === 'match-results-capture') {
                      setSelectedMatchRound(null);
                    }
                    setActivePage(link.id);
                  }}
                  className={`px-3 py-1.5 font-headline text-xs uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.45)]'
                      : 'text-[#ac8889] hover:text-white hover:bg-[#2a292e]'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge != null && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[10px] font-mono font-bold rounded-full animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* User Account / Sign In */}
            {!currentUser ? (
              <button
                aria-label="Log in or sign up"
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b1b1f] hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-headline uppercase tracking-wider rounded-sm border border-rose-500/40 transition-all font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                <span className="hidden sm:inline">Log In / Sign Up</span>
              </button>
            ) : (
              <>
                <button
                  aria-label="Sign out"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b1b1f] hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-headline uppercase tracking-wider rounded-sm border border-rose-500/40 transition-all font-bold shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
                <div className="hidden" aria-hidden="true">
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`px-2.5 py-1.5 rounded-sm border text-xs font-headline uppercase tracking-wider flex items-center gap-1.5 transition-all font-bold ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-rose-950/60 text-rose-300 border-rose-500/50 hover:bg-rose-900/60'
                      : currentUser.status === 'PENDING'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 hover:bg-amber-900/60'
                      : 'bg-[#1b1b1f] text-emerald-400 border-emerald-500/40 hover:bg-[#25252b]'
                  }`}
                  title={`Signed in as ${currentUser.fullName}`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {currentUser.role === 'ADMIN'
                      ? 'shield_person'
                      : currentUser.status === 'PENDING'
                      ? 'hourglass_top'
                      : 'account_circle'}
                  </span>
                  <span className="max-w-[100px] truncate">{currentUser.nickname}</span>
                  {currentUser.role === 'ADMIN' && pendingApprovalsCount > 0 && (
                    <span className="w-4 h-4 bg-amber-500 text-black text-[10px] font-mono font-bold rounded-full flex items-center justify-center animate-pulse">
                      {pendingApprovalsCount}
                    </span>
                  )}
                  <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
                </button>

                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-[#1b1b1f] border border-[#353439] rounded-sm shadow-2xl p-3 z-50 flex flex-col gap-2.5"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#2a292e]">
                      <div className="flex flex-col">
                        <span className="font-headline text-sm uppercase text-white font-bold">
                          {currentUser.fullName}
                        </span>
                        <span className="font-mono text-[10px] text-[#ac8889] truncate">
                          {currentUser.email}
                        </span>
                      </div>
                      <div>
                        {currentUser.role === 'ADMIN' ? (
                          <span className="px-1.5 py-0.5 bg-rose-600/30 text-rose-400 border border-rose-500/40 font-mono text-[9px] uppercase rounded font-bold">
                            Admin
                          </span>
                        ) : currentUser.status === 'PENDING' ? (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[9px] uppercase rounded font-bold">
                            Pending Review
                          </span>
                        ) : isSelector ? (
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[9px] uppercase rounded font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>Selector</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[9px] uppercase rounded font-bold">
                            Squad Member
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View My Player Profile */}
                    <button
                      onClick={() => {
                        setActivePage('player-profile');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 bg-[#25252b] hover:bg-rose-600 hover:text-white border border-[#353439] rounded-sm text-xs font-headline uppercase tracking-wider text-rose-300 flex items-center gap-2 font-bold transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">badge</span>
                      <span>My Player Profile</span>
                    </button>

                    {/* Team Selection link for Selectors */}
                    {isSelector && currentUser.role !== 'ADMIN' && (
                      <button
                        onClick={() => {
                          setActivePage('team-selection');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 bg-emerald-950/40 hover:bg-emerald-600 hover:text-white border border-emerald-500/40 rounded-sm text-xs font-headline uppercase tracking-wider text-emerald-300 flex items-center gap-2 font-bold transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">groups</span>
                        <span>Pick Match Lineup (Selector Mode)</span>
                      </button>
                    )}

                    {currentUser.role === 'ADMIN' && (
                      <div className="flex flex-col gap-1.5 pb-1">
                        <button
                          onClick={() => {
                            setAdminDashboardTab('add-match');
                            setActivePage('admin-dashboard');
                          }}
                          className="w-full text-left px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs uppercase font-headline tracking-wider rounded-sm flex items-center justify-between font-bold shadow"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                            <span>Admin Dashboard</span>
                          </span>
                          {pendingApprovalsCount > 0 && (
                            <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[10px] font-mono rounded font-bold animate-pulse">
                              {pendingApprovalsCount} new
                            </span>
                          )}
                        </button>

                        <div className="grid grid-cols-4 gap-1 font-mono text-[9px] uppercase">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminDashboardTab('add-match');
                              setActivePage('admin-dashboard');
                            }}
                            className="p-1 bg-[#131317] hover:bg-[#25252b] text-white border border-[#2a292e] rounded-sm text-center"
                          >
                            + Match
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminDashboardTab('update-match');
                              setActivePage('admin-dashboard');
                            }}
                            className="p-1 bg-[#131317] hover:bg-[#25252b] text-white border border-[#2a292e] rounded-sm text-center"
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminDashboardTab('approvals');
                              setActivePage('admin-dashboard');
                            }}
                            className="p-1 bg-[#131317] hover:bg-[#25252b] text-amber-300 border border-[#2a292e] rounded-sm text-center"
                          >
                            Approvals
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminDashboardTab('selectors');
                              setActivePage('admin-dashboard');
                            }}
                            className="p-1 bg-[#131317] hover:bg-[#25252b] text-rose-400 hover:text-white border border-[#2a292e] rounded-sm text-center font-bold"
                          >
                            Selectors
                          </button>
                        </div>
                        <button
                          onClick={() => setIsConfigModalOpen(true)}
                          className="w-full text-left px-3 py-1.5 text-xs uppercase font-headline text-white hover:bg-[#2a292e] rounded-sm flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-rose-500 text-sm">edit_calendar</span>
                          <span>Edit Club &amp; Matchday Info</span>
                        </button>
                        <button
                          onClick={() => setIsBackendModalOpen(true)}
                          className="w-full text-left px-3 py-1.5 text-xs uppercase font-headline text-emerald-400 hover:bg-[#2a292e] rounded-sm flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-emerald-400 text-sm">dns</span>
                          <span>Connect Custom Backend</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Clear all players from the application?')) {
                              clearAllPlayers();
                            }
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs uppercase font-headline text-rose-400 hover:bg-rose-950/40 rounded-sm flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-rose-400 text-sm">person_remove</span>
                          <span>Clear All Players ({players.length})</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Clear all recorded games and match results?')) {
                              clearAllGames();
                            }
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs uppercase font-headline text-rose-400 hover:bg-rose-950/40 rounded-sm flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-rose-400 text-sm">sports_score</span>
                          <span>Clear All Games</span>
                        </button>
                      </div>
                    )}

                    {currentUser.status === 'PENDING' && (
                      <div className="bg-amber-950/30 border border-amber-500/30 p-2 rounded-sm text-[11px] text-amber-200/90 font-sans">
                        ⏳ Application is currently under review by the club admin.
                      </div>
                    )}

                    {/* Quick Demo Switcher */}
                    <div className="pt-2 border-t border-[#2a292e]">
                      <span className="block font-mono text-[9px] uppercase text-[#ac8889] mb-1.5 tracking-wider">
                        Switch Account (Demo):
                      </span>
                      <div className="grid grid-cols-3 gap-1 text-[10px] font-headline uppercase">
                        <button
                          type="button"
                          onClick={() => switchUserDemo('admin')}
                          className="p-1 bg-[#131317] hover:bg-[#25252b] text-rose-400 border border-[#2a292e] rounded-sm text-center font-bold"
                        >
                          Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => switchUserDemo('approved')}
                          className="p-1 bg-[#131317] hover:bg-[#25252b] text-emerald-400 border border-[#2a292e] rounded-sm text-center font-bold"
                        >
                          Member
                        </button>
                        <button
                          type="button"
                          onClick={() => switchUserDemo('pending')}
                          className="p-1 bg-[#131317] hover:bg-[#25252b] text-amber-400 border border-[#2a292e] rounded-sm text-center font-bold"
                        >
                          Pending
                        </button>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-[#2a292e]">
                      <button
                        onClick={logout}
                        className="w-full text-left px-3 py-1.5 text-xs uppercase font-headline text-rose-400 hover:bg-rose-950/40 rounded-sm flex items-center gap-1.5 font-bold"
                      >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
                </div>
              </>
            )}

            {/* Official Badge */}
            <div className="hidden lg:flex flex-col items-end border-l border-[#2a292e] pl-3">
              <span className="font-headline text-xs uppercase text-white tracking-wider">Selector Admin</span>
              <span className="font-mono text-[10px] uppercase text-rose-500 font-semibold tracking-wider">Match Official</span>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden min-w-10 min-h-10 p-2 text-[#e4e1e7] hover:bg-[#2a292e] rounded-sm"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0e0e12] border-b border-[#2a292e] p-3 sm:p-4 flex flex-col gap-2 max-h-[calc(100dvh-5rem)] overflow-y-auto">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  if (link.id === 'match-results-capture') {
                    setSelectedMatchRound(null);
                  }
                  setActivePage(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 font-headline text-sm uppercase tracking-wider rounded-sm flex items-center justify-between ${
                  activePage === link.id ? 'bg-rose-600 text-white' : 'text-[#ac8889] hover:bg-[#1b1b1f]'
                }`}
              >
                <span>{link.label}</span>
                {link.badge != null && (
                  <span className="px-2 py-0.5 bg-amber-500 text-black text-xs font-mono font-bold rounded-full">
                    {link.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Connect Custom Backend Modal */}
      {isBackendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1b1b1f] border border-[#353439] rounded-sm p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#2a292e] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">dns</span>
                <h3 className="font-headline text-lg uppercase text-white">Connect Backend API</h3>
              </div>
              <button onClick={() => setIsBackendModalOpen(false)} className="text-[#ac8889] hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-[#ac8889] leading-relaxed">
              If your backend is running, enter its base URL below (e.g. <code className="text-white bg-[#131317] px-1 py-0.5 rounded">http://localhost:5000</code>). The app will sync players and matches automatically. If left blank, players and matches are managed cleanly in the browser.
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#ac8889]">
                Backend Base URL
              </label>
              <input
                type="text"
                value={tempBackendUrl}
                onChange={(e) => setTempBackendUrl(e.target.value)}
                placeholder="e.g. http://localhost:5000"
                className="w-full bg-[#131317] border border-[#353439] text-white px-3 py-2 text-sm rounded-sm font-mono focus:border-rose-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2a292e]">
              <button
                type="button"
                onClick={() => {
                  setTempBackendUrl('');
                  setBackendUrl('');
                  setIsBackendModalOpen(false);
                  showToast('Backend URL cleared; using local state');
                }}
                className="px-3 py-2 bg-[#2a292e] text-[#ac8889] hover:text-white font-headline text-xs uppercase rounded-sm"
              >
                Disconnect / Clear
              </button>
              <button
                type="button"
                onClick={async () => {
                  setBackendUrl(tempBackendUrl.trim());
                  setIsBackendModalOpen(false);
                  if (tempBackendUrl.trim()) {
                    await fetchBackendData();
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow"
              >
                Save &amp; Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Club Info Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1b1b1f] border border-[#353439] rounded-sm p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#2a292e] pb-3">
              <h3 className="font-headline text-lg uppercase text-white">Edit Club Branding &amp; Matchday</h3>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-[#ac8889] hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                updateClubConfig({
                  clubName: (form.elements.namedItem('clubName') as HTMLInputElement).value,
                  tagline: (form.elements.namedItem('tagline') as HTMLInputElement).value,
                });
                setIsConfigModalOpen(false);
              }}
              className="flex flex-col gap-3"
            >
              <div>
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#ac8889] block mb-1">
                  Club Title
                </label>
                <input
                  name="clubName"
                  defaultValue={clubConfig.clubName}
                  className="w-full bg-[#131317] border border-[#353439] text-white px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#ac8889] block mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  name="tagline"
                  defaultValue={clubConfig.tagline}
                  className="w-full bg-[#131317] border border-[#353439] text-white px-3 py-2 text-sm rounded-sm focus:border-rose-500 outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#2a292e]">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 bg-[#2a292e] text-[#e4e1e7] font-headline text-xs uppercase rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm shadow font-bold"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
