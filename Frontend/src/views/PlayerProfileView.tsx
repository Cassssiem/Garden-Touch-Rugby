import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Position } from '../types';

export const PlayerProfileView: React.FC = () => {
  const {
    currentUser,
    players,
    clubConfig,
    updateCurrentUserProfile,
    photos,
    addPhoto,
    togglePlayerStatus,
    setIsAuthModalOpen,
    setAuthModalMode,
    showToast,
  } = useApp();

  // Find linked player profile from players
  const myPlayer = players.find(
    (p) =>
      (currentUser?.playerId && p.id === currentUser.playerId) ||
      (currentUser?.nickname && p.nickname.toLowerCase() === currentUser.nickname.toLowerCase()) ||
      (currentUser?.fullName && p.fullName.toLowerCase() === currentUser.fullName.toLowerCase())
  );

  // Active view mode: 'overview' or 'edit'
  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview');

  // Profile Edit Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [jerseyNumber, setJerseyNumber] = useState(currentUser?.jerseyNumber || '11');
  const [position, setPosition] = useState<Position>(currentUser?.position || 'MIDDLE');
  const [roleSpecialty, setRoleSpecialty] = useState(myPlayer?.roleSpecialty || `${currentUser?.position || 'MIDDLE'} Specialist`);
  const [tacticalNotes, setTacticalNotes] = useState(myPlayer?.tacticalNotes || currentUser?.notes || '');
  const [heightCm, setHeightCm] = useState<number>(myPlayer?.heightCm || 180);
  const [weightKg, setWeightKg] = useState<number>(myPlayer?.weightKg || 80);
  const [speedIndex, setSpeedIndex] = useState<number>(myPlayer?.speedIndex || 8.5);
  const [avatarUrl, setAvatarUrl] = useState(myPlayer?.avatarUrl || '');
  const [avatarPreview, setAvatarPreview] = useState(myPlayer?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when currentUser or myPlayer changes
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName);
      setNickname(currentUser.nickname);
      setJerseyNumber(currentUser.jerseyNumber || '11');
      setPosition(currentUser.position || 'MIDDLE');
      if (myPlayer) {
        setRoleSpecialty(myPlayer.roleSpecialty || `${myPlayer.position} Specialist`);
        setTacticalNotes(myPlayer.tacticalNotes || currentUser.notes || '');
        setHeightCm(myPlayer.heightCm || 180);
        setWeightKg(myPlayer.weightKg || 80);
        setSpeedIndex(myPlayer.speedIndex || 8.5);
        setAvatarUrl(myPlayer.avatarUrl || '');
        setAvatarPreview(myPlayer.avatarUrl || '');
      } else {
        setRoleSpecialty(`${currentUser.position || 'MIDDLE'} Specialist`);
        setTacticalNotes(currentUser.notes || '');
      }
    }
  }, [currentUser, myPlayer]);

  // Handle avatar image file upload
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarPreview(result);
        setAvatarUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);

    try {
      await updateCurrentUserProfile({
        fullName: fullName.trim(),
        nickname: nickname.trim(),
        position,
        jerseyNumber: jerseyNumber.trim(),
        notes: tacticalNotes.trim(),
        roleSpecialty: roleSpecialty.trim(),
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        speedIndex: Number(speedIndex),
        avatarUrl: avatarUrl.trim(),
      });
      setActiveTab('overview');
    } catch {
      showToast('Could not save profile updates. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Photo Form State
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('Matchday Action Play');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoFixture, setPhotoFixture] = useState(`Round ${clubConfig.matchdayCycle} Match`);
  const [photographer, setPhotographer] = useState('Club Media / Sideline');
  const [photoCategory, setPhotoCategory] = useState<'tries' | 'huddle' | 'mvp' | 'all'>('tries');
  const [photoPreview, setPhotoPreview] = useState('');

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoPreview) {
      showToast('Please upload an image file or provide an image link.');
      return;
    }

    const playerId = myPlayer?.id || currentUser?.playerId || 'p-current';
    addPhoto({
      imageUrl: photoPreview,
      title: photoTitle.trim() || 'Player Photo',
      caption: photoCaption.trim() || 'Uploaded to personal player profile.',
      fixture: photoFixture.trim() || `Round ${clubConfig.matchdayCycle}`,
      photographer: photographer.trim() || 'Club Media',
      taggedPlayerIds: [playerId],
      isPinned: false,
      date: new Date().toISOString().split('T')[0],
      tagCategory: photoCategory,
    });

    setIsAddPhotoOpen(false);
    setPhotoPreview('');
    setPhotoCaption('');
    showToast('Photo added to your profile gallery!');
  };

  // Filter photos tagged with this player
  const playerPhotos = myPlayer
    ? photos.filter((p) => p.taggedPlayerIds?.includes(myPlayer.id))
    : [];

  // =========================================================================
  // NOT SIGNED IN STATE: Prompts user to log in or create an account
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-rose-950/50 border border-rose-500/40 flex items-center justify-center text-rose-500 mb-6 shadow-2xl">
          <span className="material-symbols-outlined text-4xl">badge</span>
        </div>

        <span className="px-2.5 py-0.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 font-mono text-xs uppercase tracking-wider rounded-sm font-bold mb-2">
          PLAYER PROFILE LINK
        </span>

        <h1 className="font-headline text-3xl sm:text-4xl uppercase text-white tracking-tight">
          Sign In to Access Your Player Profile
        </h1>
        <p className="text-sm text-[#ac8889] max-w-md mt-2 leading-relaxed">
          Your player profile is linked to your registered club account. Sign in or create a player account to update your name, nickname, jersey number, position, biometrics, and profile pictures.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            onClick={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm shadow-xl font-bold flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-sm">login</span>
            <span>Sign In to Account</span>
          </button>
          <button
            onClick={() => {
              setAuthModalMode('signup');
              setIsAuthModalOpen(true);
            }}
            className="px-6 py-3 bg-[#1b1b1f] hover:bg-[#25252b] text-rose-400 hover:text-white font-headline text-xs uppercase tracking-wider rounded-sm border border-rose-500/40 font-bold transition-all"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>Create New Player Account</span>
          </button>
        </div>

      </div>
    );
  }

  const isApproved = currentUser.status === 'APPROVED' || currentUser.role === 'ADMIN';

  // =========================================================================
  // SIGNED IN USER PLAYER PROFILE
  // =========================================================================
  return (
    <div className="flex flex-col w-full">
      {/* Top Telemetry Header */}
      <section className="w-full bg-[#0e0e12] border-b border-[#2a292e] px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[11px] uppercase tracking-wider rounded-sm font-bold">
                ACCOUNT LINKED PROFILE
              </span>
              <span className="font-mono text-xs text-[#ac8889]">
                Signed In as <strong className="text-white">{currentUser.email}</strong>
              </span>
              <span className={`px-2 py-0.5 font-mono text-[10px] uppercase rounded-sm font-bold ${
                isApproved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              }`}>
                {isApproved ? 'APPROVED CLUB MEMBER' : 'PENDING ADMIN APPROVAL'}
              </span>
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl uppercase text-white tracking-tight mt-1">
              Player Profile: <span className="text-rose-500">{currentUser.fullName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#ac8889]">
              Your official athlete dossier is linked directly to your account. Update your bio, biometrics, jersey number, and action photos.
            </p>
          </div>

          {/* Quick Segmented Nav */}
          <div className="flex items-center gap-2 bg-[#1b1b1f] p-1 rounded-sm border border-[#2a292e]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-headline text-xs uppercase tracking-wider rounded-sm font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'overview'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-[#ac8889] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">badge</span>
              <span>Profile Dossier</span>
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 font-headline text-xs uppercase tracking-wider rounded-sm font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'edit'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-[#ac8889] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* ========================================================================= */}
        {/* ATHLETE HERO COCKPIT (Always Visible)                                     */}
        {/* ========================================================================= */}
        <section className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-6 shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-600"></div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full lg:w-auto">
            {/* Avatar with Jersey Badge */}
            <div className="relative shrink-0 group">
              <div className="w-36 h-36 rounded-sm bg-[#0e0e12] border-2 border-rose-500/50 shadow-2xl overflow-hidden flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={currentUser.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-rose-500">
                    <span className="material-symbols-outlined text-5xl">sports_rugby</span>
                    <span className="font-headline text-xs uppercase text-white mt-1">
                      {currentUser.position}
                    </span>
                  </div>
                )}
              </div>
              <span className="absolute -top-2 -left-2 bg-rose-600 text-white font-headline text-lg px-2.5 py-0.5 rounded-sm font-bold shadow-md">
                #{currentUser.jerseyNumber || '11'}
              </span>

              <button
                onClick={() => setActiveTab('edit')}
                className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white font-mono text-[11px] uppercase cursor-pointer"
              >
                <span className="material-symbols-outlined text-rose-500 text-xl">photo_camera</span>
                <span>Change Photo</span>
              </button>
            </div>

            {/* Identity & Bio */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <span className="px-2.5 py-0.5 bg-rose-600 text-white font-headline text-xs uppercase font-bold rounded-sm">
                  "{currentUser.nickname}"
                </span>
                <span className="px-2.5 py-0.5 bg-[#131317] border border-rose-500/30 text-rose-400 font-mono text-xs uppercase rounded-sm font-bold">
                  {currentUser.position}
                </span>
                <span className="px-2.5 py-0.5 bg-[#131317] border border-[#2a292e] text-[#ac8889] font-mono text-xs uppercase rounded-sm">
                  {myPlayer?.roleSpecialty || `${currentUser.position} Specialist`}
                </span>
              </div>

              <h2 className="font-headline text-3xl sm:text-4xl uppercase text-white mt-1">
                {currentUser.fullName}
              </h2>
              <p className="text-sm text-[#ac8889] mt-1 max-w-xl leading-relaxed">
                {myPlayer?.tacticalNotes ||
                  currentUser.notes ||
                  'Registered touch rugby athlete. Known for sharp spatial awareness, line speed, and link distribution.'}
              </p>

              {/* Biometrics Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 w-full">
                <div className="bg-[#131317] p-2.5 rounded-sm border border-[#2a292e]">
                  <span className="block font-mono text-[10px] uppercase text-[#ac8889]">Height</span>
                  <span className="font-headline text-base text-white">
                    {myPlayer?.heightCm || heightCm} <span className="text-xs text-rose-500">CM</span>
                  </span>
                </div>
                <div className="bg-[#131317] p-2.5 rounded-sm border border-[#2a292e]">
                  <span className="block font-mono text-[10px] uppercase text-[#ac8889]">Weight</span>
                  <span className="font-headline text-base text-white">
                    {myPlayer?.weightKg || weightKg} <span className="text-xs text-rose-500">KG</span>
                  </span>
                </div>
                <div className="bg-[#131317] p-2.5 rounded-sm border border-[#2a292e]">
                  <span className="block font-mono text-[10px] uppercase text-[#ac8889]">Speed Index</span>
                  <span className="font-headline text-base text-white">
                    {myPlayer?.speedIndex || speedIndex} <span className="text-xs text-rose-500">/10</span>
                  </span>
                </div>
                <div className="bg-[#131317] p-2.5 rounded-sm border border-[#2a292e]">
                  <span className="block font-mono text-[10px] uppercase text-[#ac8889]">Member Since</span>
                  <span className="font-headline text-base text-white">
                    {myPlayer?.memberSince || '2026'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & RSVP Box */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3 bg-[#131317] p-4 rounded-sm border border-[#2a292e]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#ac8889] uppercase">NEXT FIXTURE RSVP</span>
              <span className={`w-2.5 h-2.5 rounded-full ${myPlayer?.status === 'available' ? 'bg-emerald-400 animate-ping' : 'bg-[#ac8889]'}`}></span>
            </div>

            <div className="p-3 bg-[#1b1b1f] rounded-sm border border-[#2a292e] flex items-center justify-between">
              <div className="flex flex-col">
                <span className={`font-headline text-sm uppercase font-bold ${
                  myPlayer?.status === 'available' ? 'text-emerald-400' : 'text-[#ac8889]'
                }`}>
                  {myPlayer?.status?.toUpperCase() || 'AVAILABLE'}
                </span>
                <span className="font-mono text-[10px] text-[#ac8889] uppercase mt-0.5">
                  Round #{clubConfig.matchdayCycle} • Wednesday
                </span>
              </div>
              {myPlayer && (
                <button
                  type="button"
                  onClick={() => togglePlayerStatus(myPlayer.id)}
                  className="px-2.5 py-1 text-xs font-headline uppercase rounded-sm bg-[#2a292e] hover:bg-rose-600 hover:text-white text-[#e4e1e7] font-bold transition-colors"
                >
                  Toggle
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-[#2a292e]">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>Update Profile Details</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddPhotoOpen(true)}
                className="w-full py-2 px-3 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm text-rose-400">add_a_photo</span>
                <span>Add Pictures to Profile</span>
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* TAB 1: PROFILE OVERVIEW (Stats + Action Gallery)                         */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8">
            {/* Career Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#1b1b1f] border border-[#2a292e] p-5 rounded-sm flex flex-col justify-between shadow-sm">
                <span className="font-mono text-xs uppercase text-[#ac8889]">Caps / Matches</span>
                <span className="font-headline text-4xl text-white font-bold my-1">
                  {myPlayer?.caps || 0}
                </span>
                <span className="font-mono text-[10px] text-[#ac8889]">Official Appearances</span>
              </div>
              <div className="bg-[#1b1b1f] border border-[#2a292e] p-5 rounded-sm flex flex-col justify-between shadow-sm border-l-2 border-l-rose-500">
                <span className="font-mono text-xs uppercase text-[#ac8889]">Career Tries</span>
                <span className="font-headline text-4xl text-rose-500 font-bold my-1">
                  {myPlayer?.tries || 0}
                </span>
                <span className="font-mono text-[10px] text-rose-400 font-bold">Try Scorer Points</span>
              </div>
              <div className="bg-[#1b1b1f] border border-[#2a292e] p-5 rounded-sm flex flex-col justify-between shadow-sm">
                <span className="font-mono text-xs uppercase text-[#ac8889]">Chuckers Won</span>
                <span className="font-headline text-4xl text-white font-bold my-1">
                  {myPlayer?.chuckersWon || 0}
                </span>
                <span className="font-mono text-[10px] text-[#ac8889]">Game Victories</span>
              </div>
              <div className="bg-[#1b1b1f] border border-[#2a292e] p-5 rounded-sm flex flex-col justify-between shadow-sm">
                <span className="font-mono text-xs uppercase text-[#ac8889]">Referee MVPs</span>
                <span className="font-headline text-4xl text-amber-400 font-bold my-1">
                  {myPlayer?.mvps || 0}
                </span>
                <span className="font-mono text-[10px] text-amber-400">Official Citations</span>
              </div>
            </div>

            {/* Player Action Gallery */}
            <div className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-6 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#2a292e] pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-500">photo_library</span>
                  <h3 className="font-headline text-base uppercase text-white font-bold">
                    My Athlete Photo Gallery ({playerPhotos.length} Pictures)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPhotoOpen(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                  <span>Upload Picture</span>
                </button>
              </div>

              {playerPhotos.length === 0 ? (
                <div className="bg-[#141418] border border-[#2a292e] p-10 rounded-sm text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1b1b1f] flex items-center justify-center text-[#ac8889]">
                    <span className="material-symbols-outlined text-2xl">no_photography</span>
                  </div>
                  <h4 className="font-headline text-base uppercase text-white">No Pictures in Your Gallery Yet</h4>
                  <p className="text-xs text-[#ac8889] max-w-sm">
                    Add matchday action shots, try celebrations, and team pictures to personalize your athlete profile.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddPhotoOpen(true)}
                    className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow"
                  >
                    + Add Your First Picture
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {playerPhotos.map((photo) => (
                    <div
                      key={`gallery-pic-${photo.id}`}
                      className="bg-[#141418] border border-[#2a292e] rounded-sm overflow-hidden flex flex-col shadow group"
                    >
                      <div className="relative h-48 bg-[#0e0e12] overflow-hidden">
                        <img
                          src={photo.imageUrl}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-rose-400 font-mono text-[10px] uppercase rounded font-bold">
                          {photo.tagCategory}
                        </span>
                      </div>
                      <div className="p-3 flex flex-col gap-1">
                        <span className="font-headline text-sm uppercase text-white truncate">{photo.title}</span>
                        <p className="text-xs text-[#ac8889] line-clamp-2">{photo.caption}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-[#2a292e] text-[10px] font-mono text-[#ac8889]">
                          <span>{photo.fixture}</span>
                          <span>{photo.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: EDIT PROFILE FORM                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveProfile} className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-6 flex flex-col gap-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#2a292e] pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">manage_accounts</span>
                <h3 className="font-headline text-lg uppercase text-white font-bold">
                  Update Your Athlete Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="text-xs font-mono text-[#ac8889] hover:text-white uppercase flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Back to Overview</span>
              </button>
            </div>

            {/* Profile Avatar & Picture Upload */}
            <div className="bg-[#141418] border border-[#2a292e] p-4 rounded-sm flex flex-col sm:flex-row items-center gap-5">
              <div className="w-24 h-24 rounded-sm bg-[#0e0e12] border border-rose-500/40 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-rose-500">account_circle</span>
                )}
              </div>
              <div className="flex flex-col gap-2 w-full">
                <label className="block text-xs font-mono uppercase text-white font-bold">
                  Profile Photo / Avatar
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="block w-full text-xs text-[#ac8889] file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-headline file:uppercase file:bg-rose-600 file:text-white hover:file:bg-rose-500 cursor-pointer"
                />
                <div className="flex items-center gap-2 text-xs font-mono text-[#ac8889]">
                  <span>Or enter image URL:</span>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => {
                      setAvatarUrl(e.target.value);
                      setAvatarPreview(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-[#1b1b1f] border border-[#2a292e] px-2.5 py-1 text-xs text-white rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Identity Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase text-[#ac8889] font-bold">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase text-[#ac8889] font-bold">
                  Squad Nickname
                </label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm outline-none font-bold text-rose-400"
                />
              </div>
            </div>

            {/* Position, Jersey & Specialty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase text-[#ac8889] font-bold">
                  Primary Position
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as Position)}
                  className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm outline-none font-headline uppercase"
                >
                  <option value="MIDDLE">MIDDLE</option>
                  <option value="LINK">LINK</option>
                  <option value="WING">WING</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase text-[#ac8889] font-bold">
                  Jersey Number
                </label>
                <input
                  type="text"
                  required
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm outline-none font-mono font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase text-[#ac8889] font-bold">
                  Role Specialty
                </label>
                <input
                  type="text"
                  value={roleSpecialty}
                  onChange={(e) => setRoleSpecialty(e.target.value)}
                  placeholder="e.g. Playmaker / Stepper"
                  className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>

            {/* Biometrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase text-[#ac8889]">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm outline-none font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase text-[#ac8889]">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm outline-none font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase text-[#ac8889]">
                  Speed Index (/10)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={speedIndex}
                  onChange={(e) => setSpeedIndex(Number(e.target.value))}
                  className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm outline-none font-mono"
                />
              </div>
            </div>

            {/* Bio & Tactical Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase text-[#ac8889] font-bold">
                Tactical Notes &amp; Playing Bio
              </label>
              <textarea
                rows={3}
                value={tacticalNotes}
                onChange={(e) => setTacticalNotes(e.target.value)}
                placeholder="Describe your strengths, preferred combinations, defensive reads..."
                className="bg-[#141418] text-white border border-[#353439] focus:border-rose-500 rounded-sm px-3 py-2 text-sm outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2a292e]">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow-md shadow-rose-950/50 flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: ADD PHOTO TO PROFILE GALLERY                                       */}
      {/* ========================================================================= */}
      {isAddPhotoOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1b1b1f] border border-rose-500/50 rounded-sm p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4 my-auto">
            <div className="flex items-center justify-between border-b border-[#2a292e] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">add_a_photo</span>
                <h3 className="font-headline text-lg uppercase text-white font-bold">
                  Add Picture to Your Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPhotoOpen(false)}
                className="text-[#ac8889] hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddPhotoSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-mono uppercase text-[#ac8889] font-bold">
                  Select Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="block w-full text-xs text-[#ac8889] file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-headline file:uppercase file:bg-rose-600 file:text-white hover:file:bg-rose-500 cursor-pointer"
                />

                {photoPreview && (
                  <div className="w-full h-44 rounded-sm overflow-hidden border border-[#2a292e] mt-2 bg-[#0e0e12]">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1 font-bold">
                    Picture Title
                  </label>
                  <input
                    type="text"
                    required
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    placeholder="e.g. Try Dive"
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1 font-bold">
                    Category Tag
                  </label>
                  <select
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value as any)}
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  >
                    <option value="tries">Tries &amp; Scoring</option>
                    <option value="mvp">MVP &amp; Awards</option>
                    <option value="huddle">Team Huddle &amp; Spirit</option>
                    <option value="all">General Match Action</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1 font-bold">
                  Play Caption / Moment Details
                </label>
                <textarea
                  rows={2}
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Describe what happened in this play..."
                  className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                    Fixture
                  </label>
                  <input
                    type="text"
                    value={photoFixture}
                    onChange={(e) => setPhotoFixture(e.target.value)}
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                    Photographer
                  </label>
                  <input
                    type="text"
                    value={photographer}
                    onChange={(e) => setPhotographer(e.target.value)}
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2a292e]">
                <button
                  type="button"
                  onClick={() => setIsAddPhotoOpen(false)}
                  className="px-4 py-2 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow-md"
                >
                  Publish to Profile Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
