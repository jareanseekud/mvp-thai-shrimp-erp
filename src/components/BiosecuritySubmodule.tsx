import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, 
  Droplets, UserCheck, Bug, Sparkles, Filter, Calendar, Clock, 
  RotateCcw, ClipboardCheck, AlertOctagon, CheckSquare, Search, ChevronRight
} from 'lucide-react';
import { Pond, CultureCycle, BiosecurityLog, BiosecurityChecklistItem } from '../types';
import { Language, CalendarEra, translations, formatDate } from '../lib/i18n';
import { BIOSECURITY_CHECKLIST_TEMPLATE, SANITIZER_OPTIONS } from '../lib/constants';

interface BiosecuritySubmoduleProps {
  ponds: Pond[];
  cycles: CultureCycle[];
  biosecurityLogs: BiosecurityLog[];
  selectedPondId?: string;
  onSaveBiosecurityLog: (log: Omit<BiosecurityLog, 'id'>) => Promise<void>;
  lang: Language;
  era: CalendarEra;
  emergencyPondCode?: string;
  isEmergencyMode?: boolean;
  onExitEmergencyMode?: () => void;
}

export const BiosecuritySubmodule: React.FC<BiosecuritySubmoduleProps> = ({
  ponds,
  cycles,
  biosecurityLogs,
  selectedPondId,
  onSaveBiosecurityLog,
  lang,
  era,
  emergencyPondCode,
  isEmergencyMode = false,
  onExitEmergencyMode,
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [activePondId, setActivePondId] = useState<string>(
    selectedPondId || (ponds[0]?.id ?? 'farm-wide')
  );

  const activePond = ponds.find(p => p.id === activePondId);
  const activeCycle = cycles.find(c => c.pondId === activePondId && c.status === 'active');

  // Form State
  const [shift, setShift] = useState<'morning' | 'afternoon' | 'routine'>('morning');
  const [inspectorName, setInspectorName] = useState<string>('ช่างเทคนิคประจำฟาร์ม');
  const [inspectorRole, setInspectorRole] = useState<string>('technician');
  const [footbathRefreshed, setFootbathRefreshed] = useState<boolean>(true);
  const [sanitizerUsed, setSanitizerUsed] = useState<BiosecurityLog['sanitizerUsed']>('chlorine');
  const [sanitizerPpm, setSanitizerPpm] = useState<number>(100);

  // Initialize checklist status with 'pass' as default standard
  const [checklistStatus, setChecklistStatus] = useState<Record<string, 'pass' | 'fail' | 'na'>>(() => {
    const initial: Record<string, 'pass' | 'fail' | 'na'> = {};
    BIOSECURITY_CHECKLIST_TEMPLATE.forEach(item => {
      initial[item.id] = 'pass';
    });
    return initial;
  });

  // Carrier vectors surveillance
  const [crabObserved, setCrabObserved] = useState<boolean>(false);
  const [birdsObserved, setBirdsObserved] = useState<boolean>(false);
  const [foreignFishObserved, setForeignFishObserved] = useState<boolean>(false);
  const [deadShrimpFound, setDeadShrimpFound] = useState<boolean>(false);
  const [deadShrimpCount, setDeadShrimpCount] = useState<number>(0);
  const [disposalMethod, setDisposalMethod] = useState<'burial_lime' | 'incineration' | 'none'>('burial_lime');

  const [correctiveActions, setCorrectiveActions] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Filter history
  const [historyFilterPond, setHistoryFilterPond] = useState<string>('all');

  // Calculate live compliance score
  const { passedCount, totalCount, scorePercent } = useMemo(() => {
    let passed = 0;
    let applicable = 0;
    BIOSECURITY_CHECKLIST_TEMPLATE.forEach(item => {
      const status = checklistStatus[item.id];
      if (status !== 'na') {
        applicable++;
        if (status === 'pass') {
          passed++;
        }
      }
    });
    const percent = applicable > 0 ? Math.round((passed / applicable) * 100) : 100;
    return { passedCount: passed, totalCount: applicable, scorePercent: percent };
  }, [checklistStatus]);

  const setItemStatus = (itemId: string, status: 'pass' | 'fail' | 'na') => {
    setChecklistStatus(prev => ({
      ...prev,
      [itemId]: status,
    }));
  };

  const handleSanitizerChange = (val: BiosecurityLog['sanitizerUsed']) => {
    setSanitizerUsed(val);
    const found = SANITIZER_OPTIONS.find(s => s.value === val);
    if (found) {
      setSanitizerPpm(found.defaultPpm);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSaveBiosecurityLog({
        farmId: activePond?.farmId || 'farm-001',
        pondId: activePondId === 'farm-wide' ? undefined : activePondId,
        pondCode: activePondId === 'farm-wide' ? 'ทั้งฟาร์ม (Farm-Wide)' : activePond?.code,
        cycleId: activeCycle?.id,
        cycleCode: activeCycle?.cycleCode,
        inspectedAt: new Date().toISOString(),
        dateStr: new Date().toISOString().split('T')[0],
        shift,
        inspectorName,
        inspectorRole,
        footbathRefreshed,
        sanitizerUsed,
        sanitizerPpm,
        checklistStatus,
        passedCount,
        totalChecked: totalCount,
        complianceScorePercent: scorePercent,
        carrierVectorsObserved: {
          crabObserved,
          birdsObserved,
          foreignFishObserved,
          deadShrimpFound,
          deadShrimpCount: deadShrimpFound ? Number(deadShrimpCount) : 0,
          disposalMethod: deadShrimpFound ? disposalMethod : 'none',
        },
        correctiveActions: correctiveActions || (scorePercent < 100 ? 'กำกับดูแลและแก้ไขจุดบกพร่องตามรายการที่ระบุ' : 'ปฏิบัติตามมาตรฐานครบถ้วน'),
        notes,
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('history');
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group checklist items by category
  const categorizedItems = useMemo(() => {
    const groups: { [key: string]: BiosecurityChecklistItem[] } = {
      personnel: [],
      equipment: [],
      water_intake: [],
      vector_control: [],
      visitors: [],
      feed_dead_disposal: [],
    };

    BIOSECURITY_CHECKLIST_TEMPLATE.forEach(item => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    });

    return groups;
  }, []);

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'personnel': return lang === 'th' ? '1. บุคลากร & อ่างจุ่มเท้า (Personnel & Footwear)' : '1. Personnel & Footwear';
      case 'equipment': return lang === 'th' ? '2. การแยกอุปกรณ์ & ยอยกอาหาร (Equipment & Tools)' : '2. Equipment & Tools';
      case 'water_intake': return lang === 'th' ? '3. ถุงกรองน้ำเข้าบ่อ (Water Intake & Filtration)' : '3. Water Intake & Filtration';
      case 'vector_control': return lang === 'th' ? '4. แนวกั้นปู & ตาข่ายกันนก (Crab & Bird Barriers)' : '4. Crab & Bird Barriers';
      case 'visitors': return lang === 'th' ? '5. ล้างล้อรถ & ผู้มาเยือน (Vehicle & Visitors)' : '5. Vehicle & Visitors';
      case 'feed_dead_disposal': return lang === 'th' ? '6. คลังอาหาร & การกำจัดซากกุ้ง (Feed & Disposal)' : '6. Feed & Carcass Disposal';
      default: return cat;
    }
  };

  // History stats
  const filteredHistory = useMemo(() => {
    if (historyFilterPond === 'all') return biosecurityLogs;
    return biosecurityLogs.filter(l => l.pondId === historyFilterPond);
  }, [biosecurityLogs, historyFilterPond]);

  const avgCompliance = useMemo(() => {
    if (biosecurityLogs.length === 0) return 100;
    const sum = biosecurityLogs.reduce((acc, curr) => acc + curr.complianceScorePercent, 0);
    return Math.round(sum / biosecurityLogs.length);
  }, [biosecurityLogs]);

  return (
    <div className="space-y-6">
      
      {/* Emergency Mode Alert Banner */}
      {isEmergencyMode && (
        <aside aria-label="แจ้งเตือนฉุกเฉิน" className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-600 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 animate-pulse" />
            <div>
              <div className="text-sm font-black text-rose-900 tracking-tight">
                เปิดโหมดความปลอดภัยทางชีวภาพขั้นสูงสุด: {emergencyPondCode || activePond?.code}
              </div>
              <p className="text-caption text-rose-700 mt-0.5">
                ตรวจพบความเสี่ยงโรคระบาดรุนแรง! ดำเนินการแยกอุปกรณ์ เปลี่ยนน้ำยาฆ่าเชื้อ 200 ppm และปิดแนวกั้นพาหะทันที
              </p>
            </div>
          </div>
          {onExitEmergencyMode && (
            <button
              onClick={onExitEmergencyMode}
              className="px-3 py-1.5 rounded-xl bg-white text-rose-700 border border-rose-300 text-caption font-bold hover:bg-rose-100 transition shrink-0"
            >
              ปิดโหมดฉุกเฉิน
            </button>
          )}
        </aside>
      )}

      {/* Top Protocol Dashboard Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-title font-bold text-slate-900">{t.biosecurityTitle}</h2>
          </div>
          <p className="text-caption text-slate-500 mt-1">
            บันทึกการฆ่าเชื้อ สุขอนามัยบุคคล แนวกั้นพาหะ และการเฝ้าระวังโรคระบาดตามมาตรฐาน GAP/CoC กรมประมง
          </p>
        </div>

        {/* Stats Summary Pills */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-caption text-slate-500 font-medium">คะแนนเฉลี่ย</div>
            <div className={`text-base font-bold font-mono ${
              avgCompliance >= 90 ? 'text-emerald-600' : avgCompliance >= 75 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {avgCompliance}%
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-caption text-slate-500 font-medium">บันทึกสะสม</div>
            <div className="text-base font-bold text-slate-800 font-mono">
              {biosecurityLogs.length} ครั้ง
            </div>
          </div>
        </div>
      </div>

      {/* Submodule Tabs: Form vs History */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-caption font-bold transition ${
            activeTab === 'form'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>{t.subtabBiosecurityChecklist}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-caption font-bold transition ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t.subtabBiosecurityHistory} ({biosecurityLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: FORM & CHECKLIST */}
      {activeTab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Location & Inspection Metadata */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-caption font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>ข้อมูลการตรวจสอบและสารฆ่าเชื้อ</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Pond Selector */}
              <div>
                <label className="block text-caption font-semibold text-slate-700 mb-1.5">
                  ขอบเขตการตรวจ
                </label>
                <select
                  value={activePondId}
                  onChange={(e) => setActivePondId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-emerald-500 cursor-pointer"
                >
                  <option value="farm-wide">ทั้งฟาร์ม (Farm-Wide Perimeter)</option>
                  {ponds.map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Shift Selector */}
              <div>
                <label className="block text-caption font-semibold text-slate-700 mb-1.5">
                  {t.inspectionShift}
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-emerald-500 cursor-pointer"
                >
                  <option value="morning">{t.shiftMorning}</option>
                  <option value="afternoon">{t.shiftAfternoon}</option>
                  <option value="routine">{t.shiftRoutine}</option>
                </select>
              </div>

              {/* Inspector Name */}
              <div>
                <label className="block text-caption font-semibold text-slate-700 mb-1.5">
                  {t.inspector}
                </label>
                <input
                  type="text"
                  required
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-emerald-500"
                />
              </div>

              {/* Footbath Refreshed Toggle */}
              <div>
                <label className="block text-caption font-semibold text-slate-700 mb-1.5">
                  {t.footbathStatus}
                </label>
                <button
                  type="button"
                  onClick={() => setFootbathRefreshed(!footbathRefreshed)}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    footbathRefreshed
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {footbathRefreshed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{t.footbathRefreshed}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>ยังไม่ได้เปลี่ยนน้ำยา</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Sanitizer Chemical Details */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-caption font-semibold text-slate-700 mb-1.5">
                  {t.sanitizerType}
                </label>
                <select
                  value={sanitizerUsed}
                  onChange={(e) => handleSanitizerChange(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
                >
                  {SANITIZER_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>
                      {lang === 'th' ? s.labelTh : s.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-caption font-semibold text-slate-700 mb-1.5">
                  {t.sanitizerConcentration} (มาตรฐาน 50 - 100 ppm)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={sanitizerPpm}
                    onChange={(e) => setSanitizerPpm(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-emerald-500"
                  />
                  <span className="text-caption font-mono text-slate-400">ppm</span>
                </div>
              </div>
            </div>

          </div>

          {/* Section 2: Biosecurity Checklists by Category with Live Score */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
            
            {/* Header with Live Score Meter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-caption font-bold text-slate-900 uppercase tracking-wide">
                  รายการตรวจสุขอนามัยประจำวัน (13 จุดตรวจตามมาตรฐานฟาร์ม)
                </h3>
                <p className="text-caption text-slate-400">
                  คลิก ผ่าน / ไม่ผ่าน / ไม่เกี่ยวข้อง ในแต่ละหัวข้อ
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-caption text-slate-500 font-medium">คะแนนความปลอดภัย</div>
                  <div className={`text-xl font-bold font-mono ${
                    scorePercent >= 90 ? 'text-emerald-600' : scorePercent >= 75 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {scorePercent}% ({passedCount}/{totalCount})
                  </div>
                </div>

                <div className="w-16 bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      scorePercent >= 90 ? 'bg-emerald-500' : scorePercent >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Checklist Categorized Items */}
            <div className="space-y-6">
              {Object.entries(categorizedItems).map(([categoryKey, items]) => (
                <div key={categoryKey} className="space-y-2">
                  <h4 className="text-caption font-bold text-slate-700 pb-1 border-b border-slate-100">
                    {getCategoryTitle(categoryKey)}
                  </h4>

                  <div className="grid grid-cols-1 gap-2.5">
                    {items.map(item => {
                      const currentStatus = checklistStatus[item.id] || 'pass';
                      
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            currentStatus === 'pass'
                              ? 'bg-slate-50/50 border-slate-200'
                              : currentStatus === 'fail'
                              ? 'bg-rose-50/60 border-rose-300'
                              : 'bg-slate-50/20 border-slate-200/60 opacity-60'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-caption font-bold text-slate-900">
                                {lang === 'th' ? item.titleTh : item.titleEn}
                              </span>
                              {item.critical && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  วิกฤต (Critical)
                                </span>
                              )}
                            </div>
                            <p className="text-caption text-slate-500 mt-0.5">
                              {lang === 'th' ? item.descriptionTh : item.descriptionEn}
                            </p>
                          </div>

                          {/* Action Buttons: Pass / Fail / NA */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setItemStatus(item.id, 'pass')}
                              className={`px-3 py-1.5 rounded-lg text-caption font-bold flex items-center gap-1 transition ${
                                currentStatus === 'pass'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ผ่าน</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setItemStatus(item.id, 'fail')}
                              className={`px-3 py-1.5 rounded-lg text-caption font-bold flex items-center gap-1 transition ${
                                currentStatus === 'fail'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ไม่ผ่าน</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setItemStatus(item.id, 'na')}
                              className={`px-2 py-1.5 rounded-lg text-caption font-medium transition ${
                                currentStatus === 'na'
                                  ? 'bg-slate-300 text-slate-800'
                                  : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              N/A
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Section 3: Pathogen Vectors & Dead Shrimp Monitoring */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-caption font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Bug className="w-4 h-4 text-amber-600" />
              <span>{t.vectorMonitoring}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Crab intrusion */}
              <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                crabObserved ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="text-caption">{t.crabObserved}</span>
                <input
                  type="checkbox"
                  checked={crabObserved}
                  onChange={(e) => setCrabObserved(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Bird scavenging */}
              <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                birdsObserved ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="text-caption">{t.birdsObserved}</span>
                <input
                  type="checkbox"
                  checked={birdsObserved}
                  onChange={(e) => setBirdsObserved(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Foreign fish */}
              <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                foreignFishObserved ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="text-caption">{t.foreignFishObserved}</span>
                <input
                  type="checkbox"
                  checked={foreignFishObserved}
                  onChange={(e) => setForeignFishObserved(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Dead shrimp found */}
              <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                deadShrimpFound ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="text-caption">{t.deadShrimpFound}</span>
                <input
                  type="checkbox"
                  checked={deadShrimpFound}
                  onChange={(e) => setDeadShrimpFound(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
              </label>

            </div>

            {/* Extended Dead Shrimp Disposal Form if detected */}
            {deadShrimpFound && (
              <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-300 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-800 text-caption font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>มาตรการฉุกเฉิน: กำจัดซากกุ้งทันที ห้ามทิ้งลงคลองหรือปล่อยให้กุ้งอื่นกัดกิน</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-caption font-medium text-rose-900 mb-1">
                      {t.deadShrimpCount}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={deadShrimpCount}
                      onChange={(e) => setDeadShrimpCount(Number(e.target.value))}
                      className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-950"
                    />
                  </div>

                  <div>
                    <label className="block text-caption font-medium text-rose-900 mb-1">
                      {t.deadDisposalMethod}
                    </label>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-1.5 text-caption font-bold text-rose-900 cursor-pointer">
                        <input
                          type="radio"
                          name="disposalMethod"
                          value="burial_lime"
                          checked={disposalMethod === 'burial_lime'}
                          onChange={() => setDisposalMethod('burial_lime')}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <span>{t.disposalBurialLime}</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-caption font-bold text-rose-900 cursor-pointer">
                        <input
                          type="radio"
                          name="disposalMethod"
                          value="incineration"
                          checked={disposalMethod === 'incineration'}
                          onChange={() => setDisposalMethod('incineration')}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <span>{t.disposalIncineration}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Section 4: Corrective Actions & Notes */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div>
              <label className="block text-caption font-bold text-slate-800 mb-1.5">
                {t.correctiveAction}
              </label>
              <input
                type="text"
                placeholder="เช่น เปลี่ยนน้ำยาคลอรีนในอ่างจุ่มเท้าใหม่, ปักซ่อมแนวกั้นปู, แยกสวิงช้อนประจำบ่อ..."
                value={correctiveActions}
                onChange={(e) => setCorrectiveActions(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="block text-caption font-bold text-slate-800 mb-1.5">
                หมายเหตุเพิ่มเติม / ข้อสังเกตสภาพแวดล้อม
              </label>
              <textarea
                rows={2}
                placeholder="บันทึกสภาพอากาศ หรือข้อแนะนำสำหรับช่างเทคนิคกะถัดไป..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-emerald-500"
              />
            </div>

            {/* Submit Button (>=56px touch target for wet hands) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>กำลังบันทึกข้อมูล...</span>
                ) : submitSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
                    <span>บันทึกข้อมูลสุขอนามัยเรียบร้อยแล้ว</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>{t.recordBiosecurityLog} (คะแนนความปลอดภัย: {scorePercent}%)</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </form>
      )}

      {/* TAB 2: HISTORY & AUDIT LOGS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          
          {/* History Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-700">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span className="text-caption font-bold">กรองประวัติตามบ่อ:</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={historyFilterPond}
                onChange={(e) => setHistoryFilterPond(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
              >
                <option value="all">ทุกบ่อ / ทั้งฟาร์ม</option>
                {ponds.map(p => (
                  <option key={p.id} value={p.id}>{p.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* History List */}
          {filteredHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
              <ShieldAlert className="w-8 h-8 mx-auto text-slate-300" />
              <div className="text-caption font-bold text-slate-600">ยังไม่มีบันทึกสุขอนามัยในหมวดนี้</div>
              <p className="text-caption text-slate-400">กรอกแบบประเมินรายวันเพื่อสร้างประวัติการปฏิบัติตามมาตรฐาน GAP/CoC</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredHistory.map((log) => {
                const isHighCompliance = log.complianceScorePercent >= 90;
                const isMediumCompliance = log.complianceScorePercent >= 75 && log.complianceScorePercent < 90;
                
                const hasVectors = 
                  log.carrierVectorsObserved.crabObserved || 
                  log.carrierVectorsObserved.birdsObserved || 
                  log.carrierVectorsObserved.foreignFishObserved || 
                  log.carrierVectorsObserved.deadShrimpFound;

                return (
                  <div
                    key={log.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isHighCompliance 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : isMediumCompliance 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {log.complianceScorePercent}%
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-caption font-bold text-slate-900">
                              {log.pondCode || 'ทั้งฟาร์ม'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                              {log.shift === 'morning' ? 'รอบเช้า' : log.shift === 'afternoon' ? 'รอบบ่าย' : 'ตรวจสุ่ม'}
                            </span>
                          </div>
                          <div className="text-caption text-slate-400">
                            {formatDate(log.inspectedAt, lang, era)} • ตรวจโดย {log.inspectorName}
                          </div>
                        </div>
                      </div>

                      {/* Sanitizer Badge */}
                      <div className="flex items-center gap-2 text-right">
                        <span className="px-2.5 py-1 rounded-lg text-caption font-medium bg-slate-50 border border-slate-200 text-slate-700">
                          {log.sanitizerUsed} ({log.sanitizerPpm || 0} ppm)
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          log.footbathRefreshed ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                        }`}>
                          {log.footbathRefreshed ? 'อ่างจุ่มเท้า OK' : 'ไม่ได้เปลี่ยนน้ำยา'}
                        </span>
                      </div>
                    </div>

                    {/* Vector Alerts if detected */}
                    {hasVectors && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-caption font-medium flex flex-wrap items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>ตรวจพบพาหะ:</span>
                        {log.carrierVectorsObserved.crabObserved && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">ปูธรรมชาติ</span>
                        )}
                        {log.carrierVectorsObserved.birdsObserved && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">นกลงโฉบ</span>
                        )}
                        {log.carrierVectorsObserved.foreignFishObserved && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">ปลาแปลกปลอม</span>
                        )}
                        {log.carrierVectorsObserved.deadShrimpFound && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                            กุ้งตาย {log.carrierVectorsObserved.deadShrimpCount || 0} ตัว ({log.carrierVectorsObserved.disposalMethod === 'burial_lime' ? 'ฝังโรยปูนขาว' : 'เผา'})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Corrective Action note */}
                    {log.correctiveActions && (
                      <div className="text-caption text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-800">การแก้ไข: </span>
                        <span>{log.correctiveActions}</span>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
