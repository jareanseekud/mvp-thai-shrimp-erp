import React from 'react';
import { 
  AlertTriangle, CheckCircle, Clock, Droplets, Utensils, 
  Activity, ArrowRight, ShieldAlert, Sparkles, AlertOctagon,
  Calendar, Info
} from 'lucide-react';
import { Pond, CultureCycle, WaterLog, FeedingLog, Treatment } from '../types';
import { Language, CalendarEra, translations, formatDate } from '../lib/i18n';
import { calculateBiomass } from '../lib/calculations';
import { RoleIcon25D } from './ui/RoleIcon25D';

interface TodayDashboardProps {
  ponds: Pond[];
  cycles: CultureCycle[];
  waterLogs: WaterLog[];
  feedingLogs: FeedingLog[];
  treatments: Treatment[];
  lang: Language;
  era: CalendarEra;
  onNavigateTab: (tab: string, pondId?: string) => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  ponds,
  cycles,
  waterLogs,
  feedingLogs,
  treatments,
  lang,
  era,
  onNavigateTab,
}) => {
  const t = translations[lang];

  // Helper to determine risk level for each active pond
  const pondTasks = ponds.map(pond => {
    const cycle = cycles.find(c => c.pondId === pond.id && c.status === 'active');
    
    // Find latest water log
    const pondWaterLogs = waterLogs.filter(w => w.pondId === pond.id);
    const latestWater = pondWaterLogs[0];

    // Find latest feeding log
    const pondFeedingLogs = feedingLogs.filter(f => f.pondId === pond.id);
    const latestFeed = pondFeedingLogs[0];

    // Check active treatments
    const nowStr = new Date().toISOString().split('T')[0];
    const activeTreat = treatments.find(tr => tr.pondId === pond.id && tr.safeHarvestDate > nowStr);

    let risk: 'red' | 'yellow' | 'green' = 'green';
    const alerts: string[] = [];

    if (!cycle) {
      return {
        pond,
        cycle: null,
        risk: 'green' as const,
        alerts: ['บ่อว่าง พร้อมสำหรับการเตรียมบ่อรอบใหม่'],
        urgencyScore: 0,
        latestWater,
        latestFeed,
        doc: 0,
      };
    }

    // Calculate DOC (Days of Culture)
    const stockTime = new Date(cycle.stockingDate).getTime();
    const doc = Math.max(1, Math.floor((Date.now() - stockTime) / (1000 * 60 * 60 * 24)));

    // Risk 1: DO critically low (<3.5)
    if (latestWater && latestWater.dissolvedOxygen < 3.5) {
      risk = 'red';
      alerts.push(`ออกซิเจนต่ำมาก! DO = ${latestWater.dissolvedOxygen} ppm (เสี่ยงกุ้งตายยกบ่อ)`);
    }

    // Risk 2: Ammonia high (>1.0)
    if (latestWater && latestWater.ammonia > 1.0) {
      if (risk !== 'red') risk = 'yellow';
      alerts.push(`แอมโมเนียในน้ำสูงเกิน (${latestWater.ammonia} ppm)`);
      if (latestWater.ph > 8.5) {
        risk = 'red';
        alerts.push(`น้ำเป็นพิษรุนแรง! แอมโมเนีย + pH ${latestWater.ph} กุ้งลอยหัว`);
      }
    }

    // Risk 3: Check tray leftover high (>25%)
    if (latestFeed && (latestFeed.checkTrayLeftoverPercent || 0) > 25) {
      if (risk !== 'red') risk = 'yellow';
      alerts.push(`อาหารเหลือในถาด ${latestFeed.checkTrayLeftoverPercent}% สูงผิดปกติ`);
    }

    // Warning: Water log not done today
    const todayStr = new Date().toISOString().split('T')[0];
    const hasLogToday = pondWaterLogs.some(w => w.dateStr === todayStr);
    if (!hasLogToday) {
      if (risk === 'green') risk = 'yellow';
      alerts.push('ยังไม่ได้บันทึกค่าน้ำวันนี้');
    }

    // Treatment notification
    if (activeTreat) {
      alerts.push(`อยู่ในระยะหยุดยา: ${activeTreat.drugName} (ห้ามจับจนถึง ${formatDate(activeTreat.safeHarvestDate, lang, era)})`);
    }

    let urgencyScore = 1;
    if (risk === 'red') urgencyScore = 3;
    else if (risk === 'yellow') urgencyScore = 2;

    return {
      pond,
      cycle,
      risk,
      alerts,
      urgencyScore,
      latestWater,
      latestFeed,
      doc,
    };
  });

  // Sort ponds: Red (3) > Yellow (2) > Green (1)
  const sortedPonds = [...pondTasks].sort((a, b) => b.urgencyScore - a.urgencyScore);

  const handleAction = (tab: string, pondId?: string) => {
    navigator.vibrate?.(10);
    onNavigateTab(tab, pondId);
  };

  return (
    <div className="space-y-6 page-fade-slide">
      
      {/* Top Banner Overview: Clean Glassmorphic Card with Big Numbers */}
      <div className="glass-card p-6 sm:p-7 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#FF7A1A] mb-1 font-bold">
              <Clock className="w-5 h-5" />
              <span className="text-[16px] uppercase tracking-wider">
                งานประจำวันริมบ่อ (Today's Tasks)
              </span>
            </div>
            <h2 className="text-farmer-title font-extrabold text-slate-900">
              สถานะและงานเร่งด่วนรายบ่อ
            </h2>
            <p className="text-farmer-body text-slate-600 mt-0.5">
              ระบบเรียงบ่อที่มีปัญหาขึ้นก่อนอัตโนมัติ (แดง &gt; เหลือง &gt; เขียว) กดปุ่มใหญ่ด้านล่างเพื่อเริ่มงาน
            </p>
          </div>

          {/* Large Urgency Indicators for 40-50 year olds */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-center">
              <div className="text-[14px] font-bold text-rose-800">บ่อน้ำมีปัญหา</div>
              <div className="text-[26px] font-black text-rose-600 font-mono">
                {sortedPonds.filter(p => p.risk === 'red').length} บ่อ
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-center">
              <div className="text-[14px] font-bold text-amber-800">บ่อเฝ้าระวัง</div>
              <div className="text-[26px] font-black text-amber-600 font-mono">
                {sortedPonds.filter(p => p.risk === 'yellow').length} บ่อ
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center">
              <div className="text-[14px] font-bold text-emerald-800">บ่อปกติ</div>
              <div className="text-[26px] font-black text-emerald-600 font-mono">
                {sortedPonds.filter(p => p.risk === 'green' && p.cycle).length} บ่อ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pond Cards Grid: Designed specifically for farmers with large numbers and large buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPonds.map(({ pond, cycle, risk, alerts, doc, latestWater, latestFeed }) => {
          const statusBadge =
            risk === 'red'
              ? { text: 'น้ำมีปัญหา (วิกฤต)', bg: 'bg-rose-500 text-white border-rose-600', dot: 'bg-white' }
              : risk === 'yellow'
              ? { text: 'ต้องเฝ้าระวัง', bg: 'bg-amber-500 text-white border-amber-600', dot: 'bg-white' }
              : { text: 'น้ำดี ปกติ', bg: 'bg-emerald-600 text-white border-emerald-700', dot: 'bg-white' };

          return (
            <article 
              key={pond.id} 
              className={`glass-card p-6 flex flex-col justify-between transition-all duration-200 ${
                risk === 'red' ? 'border-2 border-rose-400 bg-rose-50/20' : ''
              }`}
            >
              <div>
                {/* Pond Title & High-Contrast Urgency Badge */}
                <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-orange-100">
                  <div className="flex items-center gap-3">
                    <RoleIcon25D role="pond" size={48} />
                    <div>
                      <span className="text-[15px] font-bold text-[#FF7A1A]">
                        {pond.code}
                      </span>
                      <h3 className="text-[22px] font-extrabold text-slate-900 leading-tight">
                        {pond.name}
                      </h3>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[14px] font-extrabold border shadow-xs ${statusBadge.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${statusBadge.dot} animate-ping`} />
                    <span>{statusBadge.text}</span>
                  </span>
                </div>

                {/* Big Culture Numbers: Very large, high contrast */}
                {cycle ? (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    
                    {/* DO Stat Card */}
                    <div className="p-3.5 rounded-2xl bg-white border-2 border-orange-200/80 shadow-2xs">
                      <span className="text-[14px] font-bold text-slate-500 block">
                        ออกซิเจน (DO ล่าสุด)
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className={`text-[32px] font-black font-mono leading-none ${
                          !latestWater 
                            ? 'text-slate-400' 
                            : latestWater.dissolvedOxygen < 3.5 
                            ? 'text-rose-600' 
                            : 'text-[#FF7A1A]'
                        }`}>
                          {latestWater ? latestWater.dissolvedOxygen.toFixed(1) : '-'}
                        </span>
                        <span className="text-[14px] font-bold text-slate-500">ppm</span>
                      </div>
                    </div>

                    {/* DOC Stat Card */}
                    <div className="p-3.5 rounded-2xl bg-white border-2 border-orange-200/80 shadow-2xs">
                      <span className="text-[14px] font-bold text-slate-500 block">
                        อายุเลี้ยง (DOC)
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[32px] font-black font-mono text-slate-900 leading-none">
                          {doc}
                        </span>
                        <span className="text-[14px] font-bold text-slate-500">วัน</span>
                      </div>
                    </div>

                    {/* ABW Stat Card */}
                    <div className="p-3.5 rounded-2xl bg-white border-2 border-orange-200/80 shadow-2xs">
                      <span className="text-[14px] font-bold text-slate-500 block">
                        น้ำหนักกุ้ง (ABW)
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[28px] font-black font-mono text-slate-800 leading-none">
                          {cycle.currentAbw}
                        </span>
                        <span className="text-[14px] font-bold text-slate-500">กรัม</span>
                      </div>
                    </div>

                    {/* Estimated Biomass Stat Card */}
                    <div className="p-3.5 rounded-2xl bg-white border-2 border-orange-200/80 shadow-2xs">
                      <span className="text-[14px] font-bold text-slate-500 block">
                        เนื้อกุ้งในบ่อ
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[24px] font-black font-mono text-slate-800 leading-none truncate">
                          {cycle.currentBiomassKg.toLocaleString()}
                        </span>
                        <span className="text-[14px] font-bold text-slate-500">กก.</span>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-6 text-farmer-body text-slate-500 bg-orange-50/50 rounded-2xl mb-4 border border-orange-100">
                    บ่อว่าง กำลังตากบ่อและเตรียมบ่อรอบใหม่
                  </div>
                )}

                {/* Colloquial Alerts Warning Strip */}
                <div className="space-y-2 mb-5">
                  {alerts.map((al, idx) => (
                    <div 
                      key={idx}
                      className={`text-[15px] px-3.5 py-2.5 rounded-xl font-bold flex items-start gap-2 shadow-2xs ${
                        risk === 'red'
                          ? 'bg-rose-50 text-rose-900 border border-rose-300'
                          : risk === 'yellow'
                          ? 'bg-amber-50 text-amber-950 border border-amber-300'
                          : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                        risk === 'red' ? 'text-rose-600' : 'text-amber-600'
                      }`} />
                      <span>{al}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Large Farmer Touch Buttons (Height >= 56-64px, thumb-friendly, icon + text) */}
              <div className="space-y-2.5 pt-3 border-t border-orange-100">
                <div className="grid grid-cols-2 gap-2.5">
                  
                  {/* Button 1: Water Quality Log */}
                  <button
                    type="button"
                    onClick={() => handleAction('water', pond.id)}
                    className="min-h-[60px] px-4 py-3 text-[17px] font-extrabold rounded-2xl bg-gradient-to-r from-[#FF7A1A] to-[#E25800] hover:from-[#E25800] hover:to-[#B33E00] text-white flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 active:scale-[0.97] transition cursor-pointer"
                    aria-label={`บันทึกค่าน้ำสำหรับ ${pond.code}`}
                  >
                    <Droplets className="w-5 h-5 shrink-0" />
                    <span>ค่าน้ำวันนี้</span>
                  </button>

                  {/* Button 2: Feed Calculation */}
                  <button
                    type="button"
                    onClick={() => handleAction('feeding', pond.id)}
                    className="min-h-[60px] px-4 py-3 text-[17px] font-extrabold rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.97] transition cursor-pointer"
                    aria-label={`ให้อาหารสำหรับ ${pond.code}`}
                  >
                    <Utensils className="w-5 h-5 shrink-0" />
                    <span>ให้อาหารแล้ว</span>
                  </button>

                </div>

                {/* Button 3: Disease & Biosecurity Protocol */}
                <button
                  type="button"
                  onClick={() => handleAction('disease', pond.id)}
                  className="w-full min-h-[56px] px-4 py-3 text-[16px] font-bold rounded-2xl bg-white hover:bg-orange-50/70 border-2 border-orange-200 text-slate-800 flex items-center justify-center gap-2 shadow-2xs active:scale-[0.97] transition cursor-pointer"
                  aria-label={`ตรวจเช็คอาการโรคและสุขอนามัยฟาร์มสำหรับ ${pond.code}`}
                >
                  <Activity className="w-5 h-5 text-[#FF7A1A] shrink-0" />
                  <span>ตรวจโรค & สุขอนามัยฟาร์ม (Biosecurity)</span>
                </button>
              </div>

            </article>
          );
        })}
      </div>
    </div>
  );
};
