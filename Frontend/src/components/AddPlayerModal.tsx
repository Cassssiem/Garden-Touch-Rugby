import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Position, PlayerStatus } from '../types';

interface AddPlayerModalProps {
  onClose: () => void;
  defaultPosition?: Position;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ onClose, defaultPosition = 'MIDDLE' }) => {
  const { addPlayer, players } = useApp();

  const [nickname, setNickname] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState<Position>(defaultPosition);
  const [status, setStatus] = useState<PlayerStatus>('available');
  const [jerseyNumber, setJerseyNumber] = useState(
    String(players.length + 1).padStart(2, '0')
  );
  const [roleSpecialty, setRoleSpecialty] = useState('');
  const [heightCm, setHeightCm] = useState('180');
  const [weightKg, setWeightKg] = useState('80');
  const [speedIndex, setSpeedIndex] = useState('9.0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    addPlayer({
      nickname: nickname.trim().toUpperCase(),
      fullName: fullName.trim() || nickname.trim(),
      position,
      status,
      jerseyNumber: jerseyNumber.trim() || String(players.length + 1).padStart(2, '0'),
      roleSpecialty: roleSpecialty.trim() || `${position} Specialist`,
      team: 'pool',
      heightCm: Number(heightCm) || 180,
      weightKg: Number(weightKg) || 80,
      speedIndex: Number(speedIndex) || 9.0,
      memberSince: String(new Date().getFullYear()),
      tacticalNotes: 'Registered matchday squad member.',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1b1b1f] border border-[#353439] p-6 rounded-sm shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2a292e]">
          <div className="flex flex-col">
            <h3 className="font-headline text-lg uppercase text-white tracking-wide">
              Quick Add Player to Pool
            </h3>
            <span className="text-xs text-[#ac8889]">
              Register member or guest for Wednesday Matchday
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-sm bg-[#1f1f23] hover:bg-[#2a292e] flex items-center justify-center text-[#e4e1e7] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#ac8889]">
                Nickname / Moniker *
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. ROCKET, TANK, FLASH"
                className="bg-[#131317] text-white border border-[#353439] px-3 py-2 text-sm rounded-sm outline-none focus:border-rose-500 transition-colors uppercase font-headline"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#ac8889]">
                Jersey #
              </label>
              <input
                type="text"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                placeholder="e.g. 07"
                maxLength={4}
                className="bg-[#131317] text-white border border-[#353439] px-3 py-2 text-sm rounded-sm outline-none focus:border-rose-500 transition-colors font-mono text-center font-bold text-rose-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-mono uppercase tracking-widest text-[#ac8889]">
              Full Legal Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Marcus Webb"
              className="bg-[#131317] text-white border border-[#353439] px-3 py-2 text-sm rounded-sm outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#ac8889]">
                Primary Position
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="bg-[#131317] text-white border border-[#353439] px-3 py-2 text-sm rounded-sm outline-none focus:border-rose-500 transition-colors font-headline uppercase"
              >
                <option value="MIDDLE">MIDDLE (Playmaker / Defense)</option>
                <option value="LINK">LINK (Distributor / Step)</option>
                <option value="WING">WING (Speed / Finisher)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#ac8889]">
                Initial Availability
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PlayerStatus)}
                className="bg-[#131317] text-white border border-[#353439] px-3 py-2 text-sm rounded-sm outline-none focus:border-rose-500 transition-colors font-headline uppercase"
              >
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-mono uppercase tracking-widest text-[#ac8889]">
              Tactical Specialty / Role
            </label>
            <input
              type="text"
              value={roleSpecialty}
              onChange={(e) => setRoleSpecialty(e.target.value)}
              placeholder="e.g. Captain • Playmaker, Burst Runner, Corner Specialist"
              className="bg-[#131317] text-white border border-[#353439] px-3 py-2 text-sm rounded-sm outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 bg-[#131317] p-2.5 rounded-sm border border-[#2a292e]">
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-mono uppercase text-[#ac8889]">Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="bg-transparent text-white font-mono text-xs outline-none"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-mono uppercase text-[#ac8889]">Weight (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="bg-transparent text-white font-mono text-xs outline-none"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-mono uppercase text-[#ac8889]">Speed (1-10)</label>
              <input
                type="number"
                step="0.1"
                max="10"
                min="1"
                value={speedIndex}
                onChange={(e) => setSpeedIndex(e.target.value)}
                className="bg-transparent text-rose-500 font-mono text-xs outline-none font-bold"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#2a292e]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1f1f23] hover:bg-[#2a292e] text-[#e4e1e7] font-headline text-xs uppercase tracking-wider rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs uppercase tracking-wider rounded-sm transition-all shadow-md shadow-rose-950/40"
            >
              Save to Squad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
