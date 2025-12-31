/**
 * Offline Indicator Component
 */

import React, { useState, useEffect } from 'react';
import { isOnline, onOnlineStatusChange } from '../services/storageService';

interface OfflineIndicatorProps {
  pendingSyncCount?: number;
  cachedProjectsCount?: number;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  pendingSyncCount = 0,
  cachedProjectsCount = 0
}) => {
  const [online, setOnline] = useState(isOnline());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const unsubscribe = onOnlineStatusChange((status) => {
      setOnline(status);
      if (status && pendingSyncCount > 0) {
        // Show sync notification when coming back online
        setShowDetails(true);
        setTimeout(() => setShowDetails(false), 3000);
      }
    });
    return unsubscribe;
  }, [pendingSyncCount]);

  if (online && pendingSyncCount === 0) return null;

  return (
    <>
      {/* Fixed indicator in header */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${
          online
            ? 'bg-emerald-500/20 text-emerald-500'
            : 'bg-amber-500/20 text-amber-500'
        }`}
      >
        {online ? (
          <>
            <i className="fa-solid fa-cloud-arrow-up animate-pulse"></i>
            <span>SYNCING {pendingSyncCount}</span>
          </>
        ) : (
          <>
            <i className="fa-solid fa-wifi-slash"></i>
            <span>OFFLINE</span>
          </>
        )}
      </button>

      {/* Details dropdown */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-4 space-y-4 z-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              online ? 'bg-emerald-500/20' : 'bg-amber-500/20'
            }`}>
              <i className={`fa-solid ${online ? 'fa-cloud-arrow-up' : 'fa-wifi-slash'} ${
                online ? 'text-emerald-500' : 'text-amber-500'
              }`}></i>
            </div>
            <div>
              <p className="text-sm font-bold">{online ? 'Back Online' : 'Working Offline'}</p>
              <p className="text-[10px] text-zinc-500">
                {cachedProjectsCount} projects available offline
              </p>
            </div>
          </div>

          {pendingSyncCount > 0 && (
            <div className="p-3 bg-black/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-zinc-500">PENDING SYNC</p>
                <p className="text-[10px] text-amber-500">{pendingSyncCount} items</p>
              </div>
              <p className="text-[10px] text-zinc-600">
                {online
                  ? 'Uploading changes now...'
                  : 'Will sync when connection is restored.'}
              </p>
              {online && (
                <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 animate-pulse" style={{ width: '60%' }}></div>
                </div>
              )}
            </div>
          )}

          {!online && (
            <p className="text-[10px] text-zinc-600">
              You can still view cached projects and create new renders. They'll sync when you're back online.
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default OfflineIndicator;
