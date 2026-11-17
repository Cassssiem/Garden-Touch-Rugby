import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Player, Position } from '../types';

export const PlayerHubView: React.FC = () => {
  const {
    clubConfig,
    players,
    users,
    selectedPlayerId,
    setSelectedPlayerId,
    updatePlayer,
    photos,
    addPhoto,
    setActivePage,
    showToast,
    currentUser,
  } = useApp();

  const isAdmin = currentUser?.role === 'ADMIN';

  // Find linked player for current user if accepted
  const myPlayer = players.find(
    (p) =>
      p.id === currentUser?.playerId ||
      (currentUser?.nickname && p.nickname.toLowerCase() === currentUser.nickname.toLowerCase())
  );

  const isUserAccepted = currentUser?.status === 'APPROVED' || isAdmin;

  // Selected player for viewing profile modal/dossier
  const [profilePlayerId, setProfilePlayerId] = useState<string | null>(selectedPlayerId || (players[0]?.id ?? null));
  const activeProfilePlayer = players.find((p) => p.id === profilePlayerId) || players[0];

  // Search & Filter for All Signed Up Players
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editingTargetPlayer, setEditingTargetPlayer] = useState<Player | null>(null);

  // Form fields for Edit Profile
  const [editFullName, setEditFullName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editJersey, setEditJersey] = useState('');
  const [editPosition, setEditPosition] = useState<Position>('MIDDLE');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editTacticalNotes, setEditTacticalNotes] = useState('');
  const [editHeight, setEditHeight] = useState<number>(180);
  const [editWeight, setEditWeight] = useState<number>(80);
  const [editSpeed, setEditSpeed] = useState<number>(8.5);
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');

  // Add Photo to Profile Modal State
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [photoTargetPlayerId, setPhotoTargetPlayerId] = useState<string>('');
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoFixture, setPhotoFixture] = useState(`Round ${clubConfig.matchdayCycle} Touch Fixture`);
  const [photographer, setPhotographer] = useState('Club Media / Sideline');
  const [photoCategory, setPhotoCategory] = useState<'tries' | 'huddle' | 'mvp' | 'all'>('tries');
  const [photoImagePreview, setPhotoImagePreview] = useState<string>('');

  // Open Edit Profile Modal
  const handleOpenEditProfile = (player: Player) => {
    setEditingTargetPlayer(player);
    setEditFullName(player.fullName);
    setEditNickname(player.nickname);
    setEditJersey(player.jerseyNumber);
    setEditPosition(player.position);
    setEditSpecialty(player.roleSpecialty || `${player.position} Specialist`);
    setEditTacticalNotes(player.tacticalNotes || '');
    setEditHeight(player.heightCm || 180);
    setEditWeight(player.weightKg || 80);
    setEditSpeed(player.speedIndex || 8.5);
    setEditAvatarUrl(player.avatarUrl || '');
    setAvatarPreview(player.avatarUrl || '');
    setIsEditProfileOpen(true);
  };

  // Avatar file upload reader
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarPreview(result);
        setEditAvatarUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTargetPlayer) return;

    await updatePlayer(editingTargetPlayer.id, {
      fullName: editFullName.trim(),
      nickname: editNickname.trim(),
      jerseyNumber: editJersey.trim(),
      position: editPosition,
      roleSpecialty: editSpecialty.trim(),
      tacticalNotes: editTacticalNotes.trim(),
      heightCm: Number(editHeight),
      weightKg: Number(editWeight),
      speedIndex: Number(editSpeed),
      avatarUrl: editAvatarUrl.trim(),
    });

    setIsEditProfileOpen(false);
    showToast(`Profile updated for ${editNickname || editFullName}!`);
  };

  // Open Add Photo to Profile Modal
  const handleOpenAddPhoto = (playerId: string) => {
    setPhotoTargetPlayerId(playerId);
    setPhotoTitle('Match Action Play');
    setPhotoCaption('');
    setPhotoImagePreview('');
    setIsAddPhotoOpen(true);
  };

  // Gallery photo file upload reader
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save new photo to player's profile
  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoImagePreview) {
      showToast('Please upload an image file or provide an image link.');
      return;
    }

    addPhoto({
      imageUrl: photoImagePreview,
      title: photoTitle.trim() || 'Player Profile Picture',
      caption: photoCaption.trim() || 'Added to athlete dossier media gallery.',
      fixture: photoFixture.trim() || `Round ${clubConfig.matchdayCycle}`,
      photographer: photographer.trim() || 'Club Media',
      taggedPlayerIds: [photoTargetPlayerId],
      isPinned: false,
      date: new Date().toISOString().split('T')[0],
      tagCategory: photoCategory,
    });

    setIsAddPhotoOpen(false);
    setPhotoImagePreview('');
    setPhotoCaption('');
    showToast('Picture successfully added to player profile gallery!');
  };

  // Filter signed up players
  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.jerseyNumber.includes(searchTerm) ||
      player.position.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    return true;
  });

  // Photos for the active profile player
  const playerPhotos = activeProfilePlayer
    ? photos.filter((p) => p.taggedPlayerIds?.includes(activeProfilePlayer.id))
    : [];

  return (
    <div className="flex flex-col w-full">
      {/* ========================================================================= */}
      {/* TOP HEADER: ALL PLAYERS THAT SIGNED UP                                   */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#0e0e12] border-b border-[#2a292e] px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[11px] uppercase tracking-wider rounded-sm font-bold">
                  PLAYER HUB
                </span>
                <span className="px-2 py-0.5 bg-[#1b1b1f] border border-[#2a292e] text-[#ac8889] font-mono text-[11px] uppercase rounded-sm">
                  {players.length} Athletes Signed Up
                </span>
              </div>
              <h1 className="font-headline text-3xl sm:text-5xl uppercase tracking-tight text-white mt-1">
                Squad
              </h1>
              <p className="text-xs sm:text-sm text-[#ac8889]">
                Complete squad directory of all signed-up club members. View player dossiers, career records, and athlete photo galleries.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {myPlayer && isUserAccepted && (
                <button
                  onClick={() => handleOpenEditProfile(myPlayer)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm shadow-md font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span>Edit My Profile</span>
                </button>
              )}
              {myPlayer && isUserAccepted && (
                <button
                  onClick={() => handleOpenAddPhoto(myPlayer.id)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm border border-[#353439] transition-all font-bold"
                >
                  <span className="material-symbols-outlined text-sm text-rose-400">photo_camera</span>
                  <span>Add Picture</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ACCEPTED USER BANNER: Profile Management Bar                              */}
          {/* ========================================================================= */}
          {currentUser && (
            <div className={`p-4 rounded-sm border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md ${
              isUserAccepted 
                ? 'bg-gradient-to-r from-emerald-950/40 via-[#1b1b1f] to-[#131317] border-emerald-500/40' 
                : 'bg-gradient-to-r from-amber-950/30 via-[#1b1b1f] to-[#131317] border-amber-500/40'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-sm flex items-center justify-center font-bold text-lg ${
                  isUserAccepted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}>
                  <span className="material-symbols-outlined text-xl">
                    {isUserAccepted ? 'verified_user' : 'hourglass_top'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-headline text-sm uppercase text-white font-bold">
                      {currentUser.fullName} ({currentUser.nickname})
                    </span>
                    <span className={`px-2 py-0.2 font-mono text-[10px] uppercase rounded-sm font-bold ${
                      isUserAccepted ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-black'
                    }`}>
                      {isUserAccepted ? 'ACCEPTED SQUAD MEMBER' : 'PENDING APPROVAL'}
                    </span>
                  </div>
                  <span className="text-xs text-[#ac8889]">
                    {isUserAccepted
                      ? 'You are an accepted club member. You can change your profile, biometrics, and add pictures anytime.'
                      : 'Your application is awaiting admin approval. Once approved, you can customize your profile and add pictures.'}
                  </span>
                </div>
              </div>

              {myPlayer && isUserAccepted && (
                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                  <button
                    onClick={() => setActivePage('player-profile')}
                    className="px-3 py-1.5 bg-[#1b1b1f] hover:bg-[#25252b] text-emerald-400 border border-emerald-500/40 text-xs font-headline uppercase tracking-wider rounded-sm font-bold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">badge</span>
                    <span>Go to Player Profile Tab</span>
                  </button>
                  <button
                    onClick={() => handleOpenEditProfile(myPlayer)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-headline uppercase tracking-wider rounded-sm font-bold shadow"
                  >
                    Edit Profile &amp; Bio
                  </button>
                  <button
                    onClick={() => handleOpenAddPhoto(myPlayer.id)}
                    className="px-3 py-1.5 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] text-xs font-headline uppercase tracking-wider rounded-sm font-bold"
                  >
                    + Add Pictures
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                className="px-3 py-1.5 font-headline text-xs uppercase tracking-wider rounded-sm font-bold bg-rose-600 text-white shadow-sm"
              >
                All Players ({players.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#ac8889] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search athlete by name, # or role..."
                className="w-full bg-[#131317] text-white border border-[#2a292e] placeholder-[#ac8889]/60 text-xs pl-9 pr-3 py-2 rounded-sm outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SQUAD ROSTER GRID: ALL PLAYERS THAT SIGNED UP                             */}
      {/* ========================================================================= */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="font-headline text-base uppercase text-white tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>All Signed Up Squad Members ({filteredPlayers.length})</span>
            </span>
            <span className="font-mono text-xs text-[#ac8889]">
              Click on any player to open their official profile &amp; gallery
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlayers.map((player) => {
              const isMe =
                (currentUser && (currentUser.playerId === player.id || currentUser.nickname?.toLowerCase() === player.nickname.toLowerCase())) ?? false;
              const canEditThisPlayer = isAdmin || (isMe && isUserAccepted);
              const isSelected = activeProfilePlayer?.id === player.id;

              return (
                <div
                  key={`hub-player-${player.id}`}
                  className={`bg-[#1b1b1f] border rounded-sm p-4 flex flex-col justify-between gap-3 shadow-md transition-all ${
                    isSelected
                      ? 'border-rose-500 ring-2 ring-rose-500/40 bg-[#1e1a22]'
                      : 'border-[#2a292e] hover:border-rose-500/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      onClick={() => {
                        setProfilePlayerId(player.id);
                        setSelectedPlayerId(player.id);
                      }}
                      className="relative w-16 h-16 rounded-sm bg-[#0e0e12] border border-[#2a292e] shrink-0 overflow-hidden cursor-pointer group flex items-center justify-center"
                    >
                      {player.avatarUrl ? (
                        <img
                          src={player.avatarUrl}
                          alt={player.nickname}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-rose-500">
                          <span className="material-symbols-outlined text-2xl">sports_rugby</span>
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 px-1 bg-black/90 text-rose-500 font-mono text-[10px] font-bold">
                        #{player.jerseyNumber}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          onClick={() => {
                            setProfilePlayerId(player.id);
                            setSelectedPlayerId(player.id);
                          }}
                          className="font-headline text-base text-white uppercase truncate cursor-pointer hover:text-rose-400 transition-colors"
                        >
                          {player.nickname}
                        </span>
                        <span className="px-1.5 py-0.2 bg-[#2a292e] text-rose-400 border border-rose-500/30 text-[10px] font-headline uppercase rounded-sm">
                          {player.position}
                        </span>
                      </div>
                      <span className="text-xs text-[#ac8889] truncate">{player.fullName}</span>
                      <span className="font-mono text-[10px] text-[#ac8889] uppercase mt-0.5 truncate">
                        {player.roleSpecialty || `${player.position} Specialist`}
                      </span>
                    </div>
                  </div>

                  {/* Career Stats Mini Bar */}
                  <div className="grid grid-cols-3 gap-1 bg-[#131317] p-2 rounded-sm text-center border border-[#2a292e]">
                    <div className="flex flex-col">
                      <span className="font-headline text-sm text-white font-bold leading-none">{player.caps}</span>
                      <span className="font-mono text-[9px] text-[#ac8889] uppercase">Caps</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline text-sm text-rose-500 font-bold leading-none">{player.tries}</span>
                      <span className="font-mono text-[9px] text-[#ac8889] uppercase">Tries</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline text-sm text-white font-bold leading-none">{player.chuckersWon}</span>
                      <span className="font-mono text-[9px] text-[#ac8889] uppercase">Wins</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#2a292e]">
                    <button
                      onClick={() => {
                        setProfilePlayerId(player.id);
                        setSelectedPlayerId(player.id);
                        const el = document.getElementById('player-profile-detail');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex-1 py-1.5 px-2 bg-[#2a292e] hover:bg-rose-600 hover:text-white text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm transition-colors text-center font-bold"
                    >
                      View Profile
                    </button>

                    {canEditThisPlayer && (
                      <button
                        onClick={() => handleOpenEditProfile(player)}
                        className="p-1.5 bg-[#1b1b1f] hover:bg-rose-600 text-rose-400 hover:text-white rounded-sm border border-rose-500/30 transition-colors"
                        title="Change profile and pictures"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    )}
                    {canEditThisPlayer && (
                      <button
                        onClick={() => handleOpenAddPhoto(player.id)}
                        className="p-1.5 bg-[#1b1b1f] hover:bg-zinc-700 text-[#ac8889] hover:text-white rounded-sm border border-[#2a292e] transition-colors"
                        title="Add picture to athlete profile"
                      >
                        <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DETAILED PLAYER PROFILE & ATHLETE DOSSIER                                */}
        {/* ========================================================================= */}
        {activeProfilePlayer && (
          <div id="player-profile-detail" className="bg-[#1b1b1f] border border-[#2a292e] rounded-sm p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-rose-600"></div>

            {/* Profile Header & Biometrics Cockpit */}
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6 pb-6 border-b border-[#2a292e]">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Big Avatar */}
                <div className="relative group shrink-0">
                  <div className="w-36 h-36 rounded-sm bg-[#0e0e12] border-2 border-rose-500/50 shadow-2xl overflow-hidden flex items-center justify-center">
                    {activeProfilePlayer.avatarUrl ? (
                      <img
                        src={activeProfilePlayer.avatarUrl}
                        alt={activeProfilePlayer.nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-rose-500">
                        <span className="material-symbols-outlined text-5xl">sports_rugby</span>
                        <span className="font-headline text-xs uppercase text-white mt-1">
                          #{activeProfilePlayer.jerseyNumber}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="absolute -top-2 -left-2 bg-rose-600 text-white font-headline text-lg px-2.5 py-0.5 rounded-sm font-bold shadow-md">
                    #{activeProfilePlayer.jerseyNumber}
                  </span>

                  {(isAdmin || (currentUser && (currentUser.playerId === activeProfilePlayer.id || currentUser.nickname?.toLowerCase() === activeProfilePlayer.nickname.toLowerCase()))) && (
                    <button
                      onClick={() => handleOpenEditProfile(activeProfilePlayer)}
                      className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white font-mono text-[11px] uppercase cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-rose-500 text-2xl">photo_camera</span>
                      <span>Change Photo</span>
                    </button>
                  )}
                </div>

                {/* Identity & Bio */}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                    <span className="px-2.5 py-0.5 bg-rose-600 text-white font-headline text-xs uppercase font-bold rounded-sm">
                      "{activeProfilePlayer.nickname}"
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#131317] border border-rose-500/30 text-rose-400 font-mono text-xs uppercase rounded-sm font-bold">
                      {activeProfilePlayer.position}
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#131317] border border-[#2a292e] text-[#ac8889] font-mono text-xs uppercase rounded-sm">
                      {activeProfilePlayer.roleSpecialty || 'Squad Member'}
                    </span>
                  </div>

                  <h2 className="font-headline text-3xl sm:text-4xl uppercase text-white mt-1">
                    {activeProfilePlayer.fullName}
                  </h2>
                  <p className="text-sm text-[#ac8889] mt-1 max-w-2xl leading-relaxed">
                    {activeProfilePlayer.tacticalNotes ||
                      'Registered competitive touch rugby player. Known for quick touchline acceleration, offensive link play, and defensive agility.'}
                  </p>

                </div>
              </div>

              {/* Actions Right */}
              <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                {(isAdmin || (currentUser && (currentUser.playerId === activeProfilePlayer.id || currentUser.nickname?.toLowerCase() === activeProfilePlayer.nickname.toLowerCase()))) && (
                  <>
                    <button
                      onClick={() => handleOpenEditProfile(activeProfilePlayer)}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow-md flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                      <span>Change Profile Details</span>
                    </button>
                    <button
                      onClick={() => handleOpenAddPhoto(activeProfilePlayer.id)}
                      className="px-4 py-2 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm border border-[#353439] flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base text-rose-400">add_a_photo</span>
                      <span>Add Pictures to Profile</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Profile Gallery Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-500">photo_library</span>
                  <span className="font-headline text-base uppercase text-white">
                    Athlete Action Gallery ({playerPhotos.length} Pictures)
                  </span>
                </div>
                {(isAdmin || (currentUser && (currentUser.playerId === activeProfilePlayer.id || currentUser.nickname?.toLowerCase() === activeProfilePlayer.nickname.toLowerCase()))) && (
                  <button
                    onClick={() => handleOpenAddPhoto(activeProfilePlayer.id)}
                    className="text-xs font-mono uppercase text-rose-400 hover:text-white flex items-center gap-1 hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                    <span>Upload New Photo</span>
                  </button>
                )}
              </div>

              {playerPhotos.length === 0 ? (
                <div className="bg-[#141418] border border-[#2a292e] p-8 rounded-sm text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1b1b1f] flex items-center justify-center text-[#ac8889]">
                    <span className="material-symbols-outlined text-2xl">no_photography</span>
                  </div>
                  <div className="flex flex-col gap-1 max-w-sm">
                    <span className="font-headline text-sm uppercase text-white">No Pictures Uploaded Yet</span>
                    <span className="text-xs text-[#ac8889]">
                      Accepted users can add matchday photos, try moments, and team celebration pictures directly to their profile.
                    </span>
                  </div>
                  {(isAdmin || (currentUser && (currentUser.playerId === activeProfilePlayer.id || currentUser.nickname?.toLowerCase() === activeProfilePlayer.nickname.toLowerCase()))) && (
                    <button
                      onClick={() => handleOpenAddPhoto(activeProfilePlayer.id)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow"
                    >
                      + Add First Picture
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {playerPhotos.map((photo) => (
                    <div
                      key={`photo-${photo.id}`}
                      className="bg-[#141418] border border-[#2a292e] rounded-sm overflow-hidden flex flex-col shadow-sm group"
                    >
                      <div className="relative h-48 bg-[#0a0a0e] overflow-hidden">
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
      </main>

      {/* ========================================================================= */}
      {/* MODAL: EDIT PLAYER PROFILE                                               */}
      {/* ========================================================================= */}
      {isEditProfileOpen && editingTargetPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1b1b1f] border border-rose-500/50 rounded-sm p-6 w-full max-w-xl shadow-2xl flex flex-col gap-5 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2a292e] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">manage_accounts</span>
                <h3 className="font-headline text-lg uppercase text-white">
                  Edit Athlete Profile: {editingTargetPlayer.nickname}
                </h3>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-[#ac8889] hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Picture Upload / Avatar Preview */}
              <div className="bg-[#141418] p-4 rounded-sm border border-[#2a292e] flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-sm bg-[#0a0a0e] border border-rose-500/40 overflow-hidden flex items-center justify-center shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-rose-500">account_circle</span>
                  )}
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label className="block text-xs font-mono uppercase text-white font-bold">
                    Profile Picture / Avatar
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="block w-full text-xs text-[#ac8889] file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-headline file:uppercase file:bg-rose-600 file:text-white hover:file:bg-rose-500 cursor-pointer"
                  />
                  <div className="text-[11px] font-mono text-[#ac8889] flex items-center gap-2">
                    <span>Or image URL:</span>
                    <input
                      type="text"
                      value={editAvatarUrl}
                      onChange={(e) => {
                        setEditAvatarUrl(e.target.value);
                        setAvatarPreview(e.target.value);
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 bg-[#1b1b1f] border border-[#2a292e] px-2 py-1 text-xs text-white rounded-sm outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1 font-bold">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1 font-bold">
                    Squad Nickname
                  </label>
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    required
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Position & Jersey */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1 font-bold">
                    Primary Position
                  </label>
                  <select
                    value={editPosition}
                    onChange={(e) => setEditPosition(e.target.value as Position)}
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  >
                    <option value="MIDDLE">MIDDLE</option>
                    <option value="LINK">LINK</option>
                    <option value="WING">WING</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1 font-bold">
                    Jersey Number
                  </label>
                  <input
                    type="text"
                    value={editJersey}
                    onChange={(e) => setEditJersey(e.target.value)}
                    required
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1 font-bold">
                    Role Specialty
                  </label>
                  <input
                    type="text"
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value)}
                    placeholder="e.g. Playmaker / Stepper"
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Biometrics */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={editHeight}
                    onChange={(e) => setEditHeight(Number(e.target.value))}
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={editWeight}
                    onChange={(e) => setEditWeight(Number(e.target.value))}
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1">
                    Speed Index (/10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={editSpeed}
                    onChange={(e) => setEditSpeed(Number(e.target.value))}
                    className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Tactical Notes / Bio */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1 font-bold">
                  Tactical Notes &amp; Playing Bio
                </label>
                <textarea
                  rows={3}
                  value={editTacticalNotes}
                  onChange={(e) => setEditTacticalNotes(e.target.value)}
                  placeholder="Key strengths, tactical vision, preferred combinations..."
                  className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2a292e]">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow-md"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PICTURE TO ATHLETE PROFILE                                     */}
      {/* ========================================================================= */}
      {isAddPhotoOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1b1b1f] border border-rose-500/50 rounded-sm p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4 my-auto">
            <div className="flex items-center justify-between border-b border-[#2a292e] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">add_a_photo</span>
                <h3 className="font-headline text-lg uppercase text-white">Add Picture to Profile</h3>
              </div>
              <button
                onClick={() => setIsAddPhotoOpen(false)}
                className="text-[#ac8889] hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              {/* Picture Upload / Preview */}
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-mono uppercase text-[#ac8889] font-bold">
                  Choose Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="block w-full text-xs text-[#ac8889] file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-headline file:uppercase file:bg-rose-600 file:text-white hover:file:bg-rose-500 cursor-pointer"
                />

                {photoImagePreview && (
                  <div className="w-full h-44 rounded-sm overflow-hidden border border-[#2a292e] mt-2 bg-[#0e0e12]">
                    <img src={photoImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1 font-bold">
                    Picture Title
                  </label>
                  <input
                    type="text"
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    required
                    placeholder="e.g. Try-line Dive"
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

              {/* Caption */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#ac8889] mb-1 font-bold">
                  Caption / Description
                </label>
                <textarea
                  rows={2}
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Describe the action play or matchday moment..."
                  className="w-full bg-[#131317] border border-[#2a292e] text-white px-3 py-2 text-xs rounded-sm outline-none focus:border-rose-500"
                />
              </div>

              {/* Match tag */}
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

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2a292e]">
                <button
                  type="button"
                  onClick={() => setIsAddPhotoOpen(false)}
                  className="px-4 py-2 bg-[#2a292e] hover:bg-[#353439] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm font-bold shadow-md"
                >
                  Publish to Athlete Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
