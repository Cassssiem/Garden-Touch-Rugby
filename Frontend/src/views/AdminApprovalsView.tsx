import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAccount, Position } from '../types';

export const AdminApprovalsView: React.FC = () => {
  const {
    users,
    currentUser,
    approveUser,
    rejectUser,
    signup,
    switchUserDemo,
    setActivePage,
    setIsAuthModalOpen,
    setAuthModalMode,
    players,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';

  const pendingUsers = users.filter((u) => u.status === 'PENDING');
  const approvedUsers = users.filter((u) => u.status === 'APPROVED');
  const rejectedUsers = users.filter((u) => u.status === 'REJECTED');

  const filteredUsers = users.filter((u) => {
    if (activeTab !== 'ALL' && u.status !== activeTab) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.nickname.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.position.toLowerCase().includes(q) ||
        (u.notes && u.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSimulateNewApplicant = async () => {
    const randomNames = [
      { full: 'Marcus Venter', nick: 'Venter', pos: 'LINK' as Position, jersey: '8' },
      { full: 'Kagiso Dlamini', nick: 'Dlamini', pos: 'WING' as Position, jersey: '14' },
      { full: 'Dylan O\'Connor', nick: 'DOC', pos: 'MIDDLE' as Position, jersey: '4' },
      { full: 'Bongani Ndlovu', nick: 'Bongs', pos: 'MIDDLE' as Position, jersey: '9' },
    ];
    const picked = randomNames[Math.floor(Math.random() * randomNames.length)];
    const randomId = Math.floor(100 + Math.random() * 900);

    await signup({
      fullName: picked.full,
      nickname: picked.nick,
      email: `${picked.nick.toLowerCase()}${randomId}@example.com`,
      password: 'password123',
      position: picked.pos,
      jerseyNumber: picked.jersey,
      notes: 'Touch rugby enthusiast with 2 seasons provincial experience. Excited to play!',
    });
    setActiveTab('PENDING');
  };

  return (
    <div className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2a292e] pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-rose-600/30 text-rose-400 border border-rose-500/40 text-[10px] font-mono uppercase tracking-wider rounded">
              Administrator Governance
            </span>
            <span className="font-mono text-xs text-[#ac8889]">
              • Gardens RFC Membership Verification
            </span>
          </div>
          <h1 className="font-headline text-3xl uppercase tracking-wider text-white">
            Member Approval Portal
          </h1>
          <p className="text-xs text-[#ac8889] font-mono max-w-2xl">
            Review new membership registrations. Applicants will NOT be added to the squad roster, availability pool, or website database until officially approved by an administrator.
          </p>
        </div>

        {/* Quick Admin Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isAdmin && (
            <button
              onClick={() => switchUserDemo('admin')}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">shield_person</span>
              <span>Switch to Admin Mode</span>
            </button>
          )}
          <button
            onClick={handleSimulateNewApplicant}
            className="px-3.5 py-2 bg-[#1b1b1f] hover:bg-[#25252b] text-[#ac8889] hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm border border-[#2a292e] transition-colors flex items-center gap-1.5 font-bold"
            title="Create a sample applicant to test acceptance"
          >
            <span className="material-symbols-outlined text-sm text-amber-400">add_reaction</span>
            <span>+ Simulate New Applicant</span>
          </button>
          <button
            onClick={() => {
              setAuthModalMode('signup');
              setIsAuthModalOpen(true);
            }}
            className="px-3.5 py-2 bg-[#141418] hover:bg-[#202026] text-rose-400 hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm border border-rose-500/30 transition-colors flex items-center gap-1.5 font-bold"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>Sign Up Form</span>
          </button>
        </div>
      </div>

      {/* Admin Notice if not logged in as Admin */}
      {!isAdmin && (
        <div className="bg-amber-950/30 border border-amber-500/50 p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-400 text-2xl shrink-0">
              admin_panel_settings
            </span>
            <div className="flex flex-col">
              <span className="font-headline uppercase text-amber-300 font-bold">
                Guest / Member View Mode
              </span>
              <span className="text-[#ac8889] text-[11px] font-mono">
                You are currently viewing as {currentUser ? `${currentUser.fullName} (${currentUser.status})` : 'Guest'}. To accept or decline membership applications, switch to Club Admin.
              </span>
            </div>
          </div>
          <button
            onClick={() => switchUserDemo('admin')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow shrink-0"
          >
            Login as Admin
          </button>
        </div>
      )}

      {/* Stats Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#141418] border border-amber-500/30 p-4 rounded-sm flex flex-col justify-between shadow">
          <div className="flex items-center justify-between">
            <span className="font-headline text-xs uppercase tracking-wider text-amber-400 font-bold">
              Pending Approvals
            </span>
            <span className="material-symbols-outlined text-amber-400 text-lg">hourglass_top</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-headline text-3xl text-white font-bold">
              {pendingUsers.length}
            </span>
            <span className="font-mono text-[10px] text-[#ac8889]">require action</span>
          </div>
        </div>

        <div className="bg-[#141418] border border-emerald-500/30 p-4 rounded-sm flex flex-col justify-between shadow">
          <div className="flex items-center justify-between">
            <span className="font-headline text-xs uppercase tracking-wider text-emerald-400 font-bold">
              Approved Members
            </span>
            <span className="material-symbols-outlined text-emerald-400 text-lg">verified</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-headline text-3xl text-white font-bold">
              {approvedUsers.length}
            </span>
            <span className="font-mono text-[10px] text-[#ac8889]">on active roster</span>
          </div>
        </div>

        <div className="bg-[#141418] border border-[#2a292e] p-4 rounded-sm flex flex-col justify-between shadow">
          <div className="flex items-center justify-between">
            <span className="font-headline text-xs uppercase tracking-wider text-[#ac8889] font-bold">
              Declined Requests
            </span>
            <span className="material-symbols-outlined text-[#ac8889] text-lg">block</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-headline text-3xl text-zinc-300 font-bold">
              {rejectedUsers.length}
            </span>
            <span className="font-mono text-[10px] text-[#ac8889]">archived</span>
          </div>
        </div>

        <div className="bg-[#141418] border border-rose-500/30 p-4 rounded-sm flex flex-col justify-between shadow">
          <div className="flex items-center justify-between">
            <span className="font-headline text-xs uppercase tracking-wider text-rose-400 font-bold">
              Squad Players
            </span>
            <span className="material-symbols-outlined text-rose-400 text-lg">groups</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-headline text-3xl text-white font-bold">
              {players.length}
            </span>
            <span className="font-mono text-[10px] text-[#ac8889]">in club database</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-[#141418] border border-[#2a292e] p-3 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-sm font-headline text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-[#1b1b1f] hover:bg-[#25252a] text-[#ac8889] hover:text-white'
            }`}
          >
            <span>Pending Review</span>
            <span className="px-1.5 py-0.2 bg-black/40 rounded text-[10px] font-mono">
              {pendingUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-3 py-1.5 rounded-sm font-headline text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-[#1b1b1f] hover:bg-[#25252a] text-[#ac8889] hover:text-white'
            }`}
          >
            <span>Approved</span>
            <span className="px-1.5 py-0.2 bg-black/40 rounded text-[10px] font-mono">
              {approvedUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-3 py-1.5 rounded-sm font-headline text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'REJECTED'
                ? 'bg-zinc-700 text-white shadow'
                : 'bg-[#1b1b1f] hover:bg-[#25252a] text-[#ac8889] hover:text-white'
            }`}
          >
            <span>Declined</span>
            <span className="px-1.5 py-0.2 bg-black/40 rounded text-[10px] font-mono">
              {rejectedUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-sm font-headline text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ALL'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-[#1b1b1f] hover:bg-[#25252a] text-[#ac8889] hover:text-white'
            }`}
          >
            <span>All Registrations</span>
            <span className="px-1.5 py-0.2 bg-black/40 rounded text-[10px] font-mono">
              {users.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#ac8889]">
            <span className="material-symbols-outlined text-sm">search</span>
          </span>
          <input
            type="text"
            placeholder="Search applicants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1b1b1f] border border-[#2a292e] rounded-sm pl-8 pr-3 py-1.5 text-xs text-white font-mono focus:border-rose-500 outline-none"
          />
        </div>
      </div>

      {/* Applications List */}
      {filteredUsers.length === 0 ? (
        <div className="bg-[#141418] border border-[#2a292e] p-12 text-center rounded-sm flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1b1b1f] flex items-center justify-center text-[#ac8889]">
            <span className="material-symbols-outlined text-2xl">inbox</span>
          </div>
          <h3 className="font-headline text-base uppercase tracking-wider text-white">
            No Applications Found
          </h3>
          <p className="text-xs text-[#ac8889] font-mono max-w-sm">
            {activeTab === 'PENDING'
              ? 'All current applicant registrations have been reviewed and accepted! New member sign-ups will show up here.'
              : 'No matching registrations found for this filter.'}
          </p>
          <button
            onClick={handleSimulateNewApplicant}
            className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider font-bold rounded-sm shadow"
          >
            Simulate New Applicant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((user, idx) => {
            const isPending = user.status === 'PENDING';
            const isApproved = user.status === 'APPROVED';
            const isRejected = user.status === 'REJECTED';

            return (
              <div
                key={`app-user-${user.id}-${idx}`}
                className={`bg-[#141418] border rounded-sm p-5 shadow-lg flex flex-col justify-between gap-4 transition-all ${
                  isPending
                    ? 'border-amber-500/50 bg-[#171512] shadow-amber-950/20'
                    : isApproved
                    ? 'border-emerald-500/30'
                    : 'border-[#2a292e]'
                }`}
              >
                {/* Header: Name, Position, Status */}
                <div className="flex items-start justify-between gap-3 border-b border-[#2a292e] pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-sm flex items-center justify-center font-headline text-base font-bold uppercase shadow ${
                        isPending
                          ? 'bg-amber-600 text-white'
                          : isApproved
                          ? 'bg-rose-600 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {user.nickname ? user.nickname.slice(0, 2) : user.fullName.slice(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-headline text-base uppercase text-white font-bold">
                          {user.fullName}
                        </span>
                        {user.nickname && (
                          <span className="text-xs font-headline uppercase text-rose-400 font-bold">
                            "{user.nickname}"
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-[#ac8889] truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-sm font-headline text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                        Pending Review
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-sm font-headline text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        Approved &amp; Added
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2.5 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-sm font-headline text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">close</span>
                        Declined
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-3 gap-2 bg-[#1b1b1f] p-3 rounded-sm border border-[#2a292e] text-xs">
                  <div>
                    <span className="block font-mono text-[9px] uppercase text-[#ac8889]">
                      Position
                    </span>
                    <span className="font-headline uppercase text-white font-bold">
                      {user.position}
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[9px] uppercase text-[#ac8889]">
                      Desired Jersey
                    </span>
                    <span className="font-mono text-white font-bold">
                      #{user.jerseyNumber}
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[9px] uppercase text-[#ac8889]">
                      Date Applied
                    </span>
                    <span className="font-mono text-white">
                      {user.appliedAt}
                    </span>
                  </div>
                </div>

                {/* Notes from Applicant */}
                {user.notes && (
                  <div className="bg-[#131317] p-2.5 rounded-sm border border-[#2a292e] text-xs">
                    <span className="block font-mono text-[9px] uppercase text-[#ac8889] mb-0.5">
                      Applicant Experience &amp; Notes:
                    </span>
                    <p className="text-zinc-300 font-sans italic text-[11px] leading-relaxed">
                      "{user.notes}"
                    </p>
                  </div>
                )}

                {/* Card Actions */}
                <div className="pt-2 border-t border-[#2a292e] flex items-center justify-between gap-2">
                  <div className="text-[11px] font-mono text-[#ac8889]">
                    {isPending ? (
                      <span className="text-amber-400 font-bold">
                        ⚠️ Must be accepted before added to website
                      </span>
                    ) : isApproved ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">group</span>
                        Active in squad database
                      </span>
                    ) : (
                      <span className="text-zinc-500">Not added to squad</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => rejectUser(user.id)}
                          className="px-3 py-1.5 bg-[#1f1f23] hover:bg-zinc-800 text-zinc-400 hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm border border-[#2a292e] transition-colors"
                          title="Decline this application"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => approveUser(user.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-headline text-xs uppercase tracking-wider font-bold rounded-sm shadow-md transition-all flex items-center gap-1.5"
                          title="Accept application and immediately add player to club squad"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          <span>Accept &amp; Add to Squad</span>
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => setActivePage('availability-pool')}
                        className="px-3 py-1.5 bg-[#1b1b1f] hover:bg-[#25252b] text-[#ac8889] hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm border border-[#2a292e] transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">sports_rugby</span>
                        <span>View in Pool</span>
                      </button>
                    )}

                    {isRejected && (
                      <button
                        type="button"
                        onClick={() => approveUser(user.id)}
                        className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-600 text-emerald-400 hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm border border-emerald-500/30 transition-colors"
                      >
                        Re-evaluate &amp; Accept
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
