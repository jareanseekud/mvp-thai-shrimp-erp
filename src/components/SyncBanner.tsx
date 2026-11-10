import React from 'react';
import { Wifi, WifiOff, RefreshCw, CloudCheck } from 'lucide-react';
import { SyncState } from '../types';
import { Language, translations } from '../lib/i18n';

interface SyncBannerProps {
  syncState: SyncState;
  isOnline: boolean;
  lang: Language;
}

export const SyncBanner: React.FC<SyncBannerProps> = ({ syncState, isOnline, lang }) => {
  const t = translations[lang];

  return (
    <div className="flex items-center gap-2">
      {/* Sync Badge */}
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition shadow-xs ${
          !isOnline || syncState === 'offline'
            ? 'bg-amber-100 text-amber-800 border-amber-300'
            : syncState === 'syncing'
            ? 'bg-blue-100 text-blue-800 border-blue-300'
            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
        }`}
      >
        {!isOnline || syncState === 'offline' ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>{lang === 'th' ? 'ออฟไลน์ (เปิดใช้งานแคช)' : 'Offline (Local Cache)'}</span>
          </>
        ) : syncState === 'syncing' ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>{lang === 'th' ? 'กำลังซิงก์...' : 'Syncing...'}</span>
          </>
        ) : (
          <>
            <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'th' ? 'ซิงก์แล้ว' : 'Synced'}</span>
          </>
        )}
      </div>
    </div>
  );
};
