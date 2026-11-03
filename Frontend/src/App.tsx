/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { AvailabilityPoolView } from './views/AvailabilityPoolView';
import { TeamSelectionView } from './views/TeamSelectionView';
import { MatchHistoryView } from './views/MatchHistoryView';
import { MatchResultsCaptureView } from './views/MatchResultsCaptureView';
import { PlayerCareerStatsView } from './views/PlayerCareerStatsView';
import { PlayerHubView } from './views/PlayerHubView';
import { PlayerProfileView } from './views/PlayerProfileView';
import { AdminApprovalsView } from './views/AdminApprovalsView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AuthModal } from './components/AuthModal';
import { PendingApprovalBanner } from './components/PendingApprovalBanner';

const MainContent: React.FC = () => {
  const { activePage, toastMessage } = useApp();

  const renderActiveView = () => {
    switch (activePage) {
      case 'availability-pool':
        return <AvailabilityPoolView />;
      case 'team-selection':
        return <TeamSelectionView />;
      case 'match-history':
        return <MatchHistoryView />;
      case 'match-results-capture':
        return <MatchResultsCaptureView />;
      case 'player-career-stats':
        return <PlayerCareerStatsView />;
      case 'player-hub':
        return <PlayerHubView />;
      case 'player-profile':
        return <PlayerProfileView />;
      case 'admin-approvals':
      case 'admin-dashboard':
        return <AdminDashboardView />;
      case 'home':
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e12] text-[#e4e1e7] flex flex-col font-sans">
      <Header />
      <PendingApprovalBanner />
      <main className="w-full pt-20 flex-1 flex flex-col">
        {renderActiveView()}
      </main>
      <Footer />
      <AuthModal />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1f1f23] border border-rose-500/50 text-white px-4 py-2.5 rounded-sm shadow-2xl flex items-center gap-2.5 animate-bounce">
          <span className="material-symbols-outlined text-rose-500 text-lg">check_circle</span>
          <span className="font-mono text-xs uppercase tracking-wider">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
