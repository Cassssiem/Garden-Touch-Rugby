import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Position } from '../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    signup,
    login,
    switchUserDemo,
  } = useApp();

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign up form state
  const [signupFullName, setSignupFullName] = useState('');
  const [signupNickname, setSignupNickname] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPosition, setSignupPosition] = useState<Position>('MIDDLE');
  const [signupJersey, setSignupJersey] = useState('11');
  const [signupNotes, setSignupNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your username or email address');
      return;
    }
    setIsSubmitting(true);
    const res = await login(loginIdentifier, loginPassword);
    setIsSubmitting(false);
    if (res.success) {
      setIsAuthModalOpen(false);
      setLoginIdentifier('');
      setLoginPassword('');
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signupFullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    const res = await signup({
      fullName: signupFullName,
      nickname: signupNickname || signupFullName.split(' ')[0],
      email: signupEmail,
      password: signupPassword || 'player123',
      position: signupPosition,
      jerseyNumber: signupJersey || '11',
      notes: signupNotes,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsAuthModalOpen(false);
      setSignupFullName('');
      setSignupNickname('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupNotes('');
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleDemoSelect = (role: 'admin' | 'approved' | 'pending') => {
    switchUserDemo(role);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1b1b1f] border border-[#353439] rounded-sm w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a292e] bg-[#141418]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <span className="material-symbols-outlined text-xl">
                {authModalMode === 'login' ? 'lock' : 'person_add'}
              </span>
            </div>
            <div>
              <h2 className="font-headline text-lg uppercase tracking-wider text-white">
                {authModalMode === 'login' ? 'Member Sign In' : 'Join Gardens RFC'}
              </h2>
              <p className="font-mono text-xs text-[#ac8889]">
                {authModalMode === 'login'
                  ? 'Access your touch rugby club membership'
                  : 'Register for squad roster & matchday fixtures'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAuthModalOpen(false);
              setErrorMessage(null);
            }}
            className="w-8 h-8 rounded-sm bg-[#1f1f23] hover:bg-rose-600 text-[#ac8889] hover:text-white flex items-center justify-center transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#2a292e] bg-[#16161b]">
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-headline uppercase tracking-wider font-bold transition-colors text-center border-b-2 ${
              authModalMode === 'login'
                ? 'border-rose-500 text-rose-400 bg-[#1b1b1f]'
                : 'border-transparent text-[#ac8889] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-headline uppercase tracking-wider font-bold transition-colors text-center border-b-2 ${
              authModalMode === 'signup'
                ? 'border-rose-500 text-rose-400 bg-[#1b1b1f]'
                : 'border-transparent text-[#ac8889] hover:text-white'
            }`}
          >
            Sign Up / Apply
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="bg-rose-950/40 border border-rose-500/50 p-3 rounded-sm text-xs text-rose-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {authModalMode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1.5">
                  Username or Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin or player@gardensrfc.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full bg-[#131317] border border-[#2a292e] rounded-sm px-3.5 py-2.5 text-white font-mono text-sm focus:border-rose-500 outline-none transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase text-[#ac8889]">
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#131317] border border-[#2a292e] rounded-sm px-3.5 py-2.5 text-white font-mono text-sm focus:border-rose-500 outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-headline text-xs uppercase tracking-wider font-bold rounded-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
              </button>

              {/* Demo Accounts Bar */}
              <div className="hidden" aria-hidden="true">
                <span className="block font-mono text-[10px] uppercase text-[#ac8889] mb-2 tracking-wider">
                  Quick Demo Accounts:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoSelect('admin')}
                    className="p-2 bg-[#131317] hover:bg-rose-950/40 border border-[#2a292e] hover:border-rose-500/50 rounded-sm text-left transition-colors flex flex-col gap-0.5"
                  >
                    <span className="font-headline text-[11px] uppercase text-rose-400 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">shield_person</span>
                      Club Admin
                    </span>
                    <span className="font-mono text-[9px] text-[#ac8889] truncate">Full approval rights</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoSelect('approved')}
                    className="p-2 bg-[#131317] hover:bg-[#25252b] border border-[#2a292e] hover:border-zinc-500 rounded-sm text-left transition-colors flex flex-col gap-0.5"
                  >
                    <span className="font-headline text-[11px] uppercase text-emerald-400 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">sports_rugby</span>
                      Approved Player
                    </span>
                    <span className="font-mono text-[9px] text-[#ac8889] truncate">Active in squad</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoSelect('pending')}
                    className="p-2 bg-[#131317] hover:bg-amber-950/40 border border-[#2a292e] hover:border-amber-500/50 rounded-sm text-left transition-colors flex flex-col gap-0.5"
                  >
                    <span className="font-headline text-[11px] uppercase text-amber-400 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">hourglass_top</span>
                      Pending Applicant
                    </span>
                    <span className="font-mono text-[9px] text-[#ac8889] truncate">Awaiting admin</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Notice Banner */}
              <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-sm flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-400 text-lg shrink-0 mt-0.5">
                  verified_user
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-headline text-xs uppercase text-amber-300 font-bold tracking-wider">
                    Admin Approval Required
                  </span>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed font-sans">
                    When you sign up, your application is submitted to the Club Administrator. You will be added to the official club roster and availability pool as soon as the admin approves your application.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cameron Smith"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    className="w-full bg-[#131317] border border-[#2a292e] rounded-sm px-3 py-2 text-white font-mono text-xs focus:border-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                    Playing Nickname
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cam, Flash"
                    value={signupNickname}
                    onChange={(e) => setSignupNickname(e.target.value)}
                    className="w-full bg-[#131317] border border-[#2a292e] rounded-sm px-3 py-2 text-white font-mono text-xs focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="cameron@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full bg-[#131317] border border-[#2a292e] rounded-sm px-3 py-2 text-white font-mono text-xs focus:border-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Create a password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full bg-[#131317] border border-[#2a292e] rounded-sm px-3 py-2 text-white font-mono text-xs focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              {/* Position and Jersey */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                    Primary Position
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['MIDDLE', 'LINK', 'WING'] as Position[]).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setSignupPosition(pos)}
                        className={`py-2 px-2 rounded-sm font-headline text-xs uppercase tracking-wider text-center border transition-all ${
                          signupPosition === pos
                            ? 'bg-rose-600 text-white border-rose-500 font-bold shadow-sm'
                            : 'bg-[#131317] text-[#ac8889] border-[#2a292e] hover:text-white'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                    Preferred Jersey #
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="11"
                    value={signupJersey}
                    onChange={(e) => setSignupJersey(e.target.value)}
                    className="w-full bg-[#131317] border border-[#2a292e] rounded-sm px-3 py-2 text-white font-mono text-xs focus:border-rose-500 outline-none text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                  Rugby Experience / Note to Admin
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Played 4 years club touch in provincial league. Looking forward to Wednesday fixtures!"
                  value={signupNotes}
                  onChange={(e) => setSignupNotes(e.target.value)}
                  className="w-full bg-[#131317] border border-[#2a292e] rounded-sm p-2.5 text-white font-mono text-xs focus:border-rose-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-headline text-xs uppercase tracking-wider font-bold rounded-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">how_to_reg</span>
                <span>{isSubmitting ? 'Submitting Application...' : 'Submit Application for Admin Review'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
