import React, { useState } from 'react';
import { 
  Activity, AlertTriangle, ShieldAlert, Phone, User, 
  Building, BookOpen, CheckSquare, Square, Info, Sparkles, Plus,
  ShieldCheck, AlertOctagon, ArrowRight
} from 'lucide-react';
import { Pond, CultureCycle, DiseaseCriteria, ExpertContact, DiseaseEvent, BiosecurityLog } from '../types';
import { Language, CalendarEra, translations } from '../lib/i18n';
import { SYMPTOM_OPTIONS, DEFAULT_DISEASES, DEFAULT_EXPERTS } from '../lib/constants';
import { scoreDiseaseSymptoms, DiseaseMatchResult } from '../lib/calculations';
import { BiosecuritySubmodule } from './BiosecuritySubmodule';

interface DiseaseCheckerModuleProps {
  ponds: Pond[];
  cycles: CultureCycle[];
  diseases?: DiseaseCriteria[];
  experts?: ExpertContact[];
  biosecurityLogs?: BiosecurityLog[];
  selectedPondId?: string;
  onSaveDiseaseEvent?: (event: Omit<DiseaseEvent, 'id'>) => Promise<void>;
  onSaveBiosecurityLog?: (log: Omit<BiosecurityLog, 'id'>) => Promise<void>;
  lang: Language;
  era?: CalendarEra;
}

export const DiseaseCheckerModule: React.FC<DiseaseCheckerModuleProps> = ({
  ponds,
  cycles,
  diseases = DEFAULT_DISEASES,
  experts = DEFAULT_EXPERTS,
  biosecurityLogs = [],
  selectedPondId,
  onSaveDiseaseEvent,
  onSaveBiosecurityLog,
  lang,
  era = 'buddhist',
}) => {
  const t = translations[lang];

  // Submodule navigation tab: 'disease_checker' | 'biosecurity_protocol'
  const [activeSubmodule, setActiveSubmodule] = useState<'disease_checker' | 'biosecurity_protocol'>('disease_checker');

  const [activePondId, setActivePondId] = useState<string>(
    selectedPondId || (ponds[0]?.id ?? '')
  );

  const [isEmergencyBiosecurityMode, setIsEmergencyBiosecurityMode] = useState<boolean>(false);

  const activePond = ponds.find(p => p.id === activePondId);
  const activeCycle = cycles.find(c => c.pondId === activePondId && c.status === 'active');

  // Selected Symptoms checkboxes
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isolationAction, setIsolationAction] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const toggleSymptom = (symId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symId) ? prev.filter(id => id !== symId) : [...prev, symId]
    );
  };

  // Score symptoms strictly according to deterministic aquaculture matrix (NO AI)
  const matchedDiseases: DiseaseMatchResult[] = React.useMemo(() => {
    return scoreDiseaseSymptoms(selectedSymptoms, diseases);
  }, [selectedSymptoms, diseases]);

  const handleSaveObservation = async () => {
    if (!activePond || !activeCycle || !onSaveDiseaseEvent) return;
    await onSaveDiseaseEvent({
      farmId: activePond.farmId,
      pondId: activePond.id,
      pondCode: activePond.code,
      cycleId: activeCycle.id,
      cycleCode: activeCycle.cycleCode,
      checkedAt: new Date().toISOString(),
      selectedSymptoms,
      matchedDiseases: matchedDiseases.map(m => ({
        diseaseCode: m.disease.code,
        diseaseName: m.disease.nameTh,
        score: m.matchedCount,
        matchPercentage: m.scorePercentage,
      })),
      isolationActionsTaken: isolationAction || 'ทำการบันทึกและเฝ้าระวังเบื้องต้น',
      recordedBy: 'ช่างเทคนิคประจำฟาร์ม',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Check for recent biosecurity score < 70% in the last 24 hours
  const recentLowBiosecurityLog = React.useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return biosecurityLogs.find(log => {
      const logTime = new Date(log.inspectedAt).getTime();
      const isWithin24Hours = !isNaN(logTime) && (now - logTime) <= oneDayMs && (now - logTime) >= 0;
      return isWithin24Hours && log.complianceScorePercent < 70;
    });
  }, [biosecurityLogs]);

  const hasBiosecurityAlert = Boolean(recentLowBiosecurityLog);

  const triggerEmergencyBiosecurity = () => {
    setIsEmergencyBiosecurityMode(true);
    setActiveSubmodule('biosecurity_protocol');
  };

  return (
    <div className="space-y-6">
      
      {/* Submodule Navigation Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubmodule('disease_checker')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-caption font-bold transition whitespace-nowrap ${
              activeSubmodule === 'disease_checker'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{t.subtabDiseaseCheck}</span>
          </button>

          <button
            onClick={() => setActiveSubmodule('biosecurity_protocol')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-caption font-bold transition whitespace-nowrap ${
              activeSubmodule === 'biosecurity_protocol'
                ? hasBiosecurityAlert
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-emerald-600 text-white shadow-xs'
                : hasBiosecurityAlert
                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {hasBiosecurityAlert && (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
            )}
            <ShieldCheck className="w-4 h-4" />
            <span>{t.biosecurityTitle}</span>
            {hasBiosecurityAlert ? (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSubmodule === 'biosecurity_protocol' ? 'bg-white text-rose-700 font-extrabold' : 'bg-rose-600 text-white animate-pulse'
              }`}>
                {recentLowBiosecurityLog?.complianceScorePercent}% เตือน
              </span>
            ) : biosecurityLogs.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSubmodule === 'biosecurity_protocol' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {biosecurityLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Emergency Protocol Button if symptoms matched in Disease Checker */}
        {activeSubmodule === 'disease_checker' && matchedDiseases.length > 0 && matchedDiseases[0].scorePercentage >= 50 && (
          <button
            type="button"
            onClick={triggerEmergencyBiosecurity}
            className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-300 hover:bg-rose-100 text-rose-800 text-caption font-bold flex items-center gap-1.5 transition shrink-0 animate-pulse"
          >
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>{t.emergencyBiosecurityBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 24-hour Critical Biosecurity Alert Strip */}
      {hasBiosecurityAlert && (
        <aside aria-label="แจ้งเตือนชีวอนามัยวิกฤต" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-950 shadow-2xs">
          <div className="flex items-center gap-2.5 text-caption">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>แจ้งเตือนชีวอนามัยวิกฤต:</strong> ตรวจพบคะแนนสุขอนามัยต่ำกว่าเกณฑ์ 70% ({recentLowBiosecurityLog?.complianceScorePercent}%) ณ {recentLowBiosecurityLog?.pondCode || 'ฟาร์ม'} ในรอบ 24 ชม. ที่ผ่านมา
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSubmodule('biosecurity_protocol')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-caption font-bold transition shrink-0 self-start sm:self-auto"
          >
            เปิดดูรายละเอียด & การแก้ไข
          </button>
        </aside>
      )}

      {/* SUBMODULE A: SYMPTOM CHECKER */}
      {activeSubmodule === 'disease_checker' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-rose-600">
                <Activity className="w-5 h-5" />
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{t.diseaseTitle}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {t.diseaseNotAiNotice}
              </p>
            </div>

            {/* Pond Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 shrink-0">เลือกบ่อ:</label>
              <select
                value={activePondId}
                onChange={(e) => setActivePondId(e.target.value)}
                className="bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-rose-500 cursor-pointer"
              >
                {ponds.map(p => (
                  <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* MANDATORY RED DISCLAIMER TEXT */}
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-800 shadow-sm flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 animate-bounce" />
            <span className="text-sm font-black tracking-wide leading-relaxed text-rose-700">
              คำเตือนสำคัญ: {t.diseaseDisclaimer}
            </span>
          </div>

          {/* Main Checklist Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: 10 Symptoms Checkboxes */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  {t.selectSymptoms}
                </h3>
                <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                  เลือกแล้ว {selectedSymptoms.length} อาการ
                </span>
              </div>

              <div className="space-y-2">
                {SYMPTOM_OPTIONS.map((sym) => {
                  const isChecked = selectedSymptoms.includes(sym.id);
                  return (
                    <div
                      key={sym.id}
                      onClick={() => toggleSymptom(sym.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold shadow-xs'
                          : 'bg-slate-50/50 hover:bg-slate-100 border-slate-200 text-slate-700 font-medium'
                      }`}
                    >
                      <span className="text-xs sm:text-sm">
                        {lang === 'th' ? sym.labelTh : sym.labelEn}
                      </span>
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-rose-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedSymptoms.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSymptoms([])}
                  className="text-xs text-slate-400 hover:text-rose-600 font-semibold transition"
                >
                  ล้างอาการที่เลือกทั้งหมด
                </button>
              )}
            </div>

            {/* Right Column: Matched Diseases & Biosecurity Protocol */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Matched Diseases Ranked */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    ผลการวิเคราะห์เปรียบเทียบกลุ่มอาการ (เรียงตามคะแนนตรงกัน)
                  </h3>
                  {matchedDiseases.length > 0 && (
                    <button
                      type="button"
                      onClick={triggerEmergencyBiosecurity}
                      className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline"
                    >
                      เปิดเช็คลิสต์ชีวอนามัยบ่อนี้
                    </button>
                  )}
                </div>

                {matchedDiseases.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    {selectedSymptoms.length === 0 
                      ? 'กรุณาติ๊กเลือกอาการผิดปกติที่ตรวจพบริมบ่อด้านซ้ายเพื่อดูผลการจับคู่โรค' 
                      : 'ไม่พบโรคที่ตรงกับกลุ่มอาการที่เลือก'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matchedDiseases.map(({ disease, matchedCount, totalSymptoms, scorePercentage }, index) => {
                      const isTopRank = index === 0;

                      return (
                        <div 
                          key={disease.id}
                          className={`rounded-2xl border-2 p-4 transition ${
                            isTopRank
                              ? 'bg-gradient-to-br from-rose-50/80 to-amber-50/60 border-rose-400 shadow-sm'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white">
                                  อันดับ {index + 1}
                                </span>
                                <h4 className="text-base font-black text-slate-900">
                                  {lang === 'th' ? disease.nameTh : disease.nameEn}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">
                                {lang === 'th' ? disease.descriptionTh : disease.descriptionEn}
                              </p>
                            </div>

                            {/* Match Score Badge */}
                            <div className="text-right shrink-0">
                              <span className="text-lg font-black text-rose-600 font-mono">
                                {scorePercentage}%
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                ({matchedCount}/{totalSymptoms} อาการ)
                              </span>
                            </div>
                          </div>

                          {/* Biosecurity Isolation Steps for this disease */}
                          <div className="mt-3 pt-3 border-t border-slate-200/80">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                              {t.isolationSteps}
                            </span>
                            <ul className="space-y-1 text-xs text-slate-700">
                              {(lang === 'th' ? disease.isolationStepsTh : disease.isolationStepsEn).map((step, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-rose-500 font-bold mt-0.5">•</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}

                    {/* Save Event & Actions Button */}
                    {onSaveDiseaseEvent && (
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="บันทึกการดำเนินการแยกบ่อ / มาตรการที่ทำไปแล้ว..."
                          value={isolationAction}
                          onChange={(e) => setIsolationAction(e.target.value)}
                          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-rose-500 bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={handleSaveObservation}
                          className="min-h-[46px] px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                        >
                          {savedSuccess ? 'บันทึกเรียบร้อย' : 'บันทึกประวัติการตรวจ'}
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Expert Contacts Directory */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <User className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-black uppercase tracking-wide">
                    {t.expertContacts}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {experts.map((exp) => (
                    <div 
                      key={exp.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition space-y-1.5"
                    >
                      <div className="font-bold text-xs text-slate-900">{exp.name}</div>
                      <div className="text-[11px] text-slate-600">{exp.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{exp.organization} ({exp.province})</span>
                      </div>
                      <div className="pt-1.5 flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-sky-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-sky-600" />
                          {exp.phone}
                        </span>
                        <a
                          href={`tel:${exp.phone.replace(/[^0-9]/g, '')}`}
                          className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[10px] font-bold hover:bg-sky-700 transition"
                        >
                          โทรด่วน
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SUBMODULE B: BIOSECURITY & FARM PROTOCOL */}
      {activeSubmodule === 'biosecurity_protocol' && onSaveBiosecurityLog && (
        <BiosecuritySubmodule
          ponds={ponds}
          cycles={cycles}
          biosecurityLogs={biosecurityLogs}
          selectedPondId={activePondId}
          onSaveBiosecurityLog={onSaveBiosecurityLog}
          lang={lang}
          era={era}
          emergencyPondCode={activePond?.code}
          isEmergencyMode={isEmergencyBiosecurityMode}
          onExitEmergencyMode={() => setIsEmergencyBiosecurityMode(false)}
        />
      )}

    </div>
  );
};
