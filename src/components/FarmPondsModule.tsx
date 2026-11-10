import React, { useState } from 'react';
import { 
  Building2, Layers, Plus, CheckCircle, Lock, Unlock, 
  AlertCircle, ShieldAlert, Sparkles, Scale, Calendar, User
} from 'lucide-react';
import { Farm, Pond, CultureCycle, PostLarvaeLot, UserRole } from '../types';
import { Language, CalendarEra, translations, formatDate } from '../lib/i18n';
import { calculateStockingDensity, calculateBiomass } from '../lib/calculations';

interface FarmPondsModuleProps {
  farms: Farm[];
  ponds: Pond[];
  cycles: CultureCycle[];
  plLots: PostLarvaeLot[];
  currentRole: UserRole;
  selectedFarmId: string;
  onAddPond: (pond: Omit<Pond, 'id'>) => Promise<void>;
  onStartCycle: (cycle: Omit<CultureCycle, 'id'>) => Promise<void>;
  onCloseCycle: (cycleId: string, reason: string) => Promise<void>;
  lang: Language;
  era: CalendarEra;
}

export const FarmPondsModule: React.FC<FarmPondsModuleProps> = ({
  farms,
  ponds,
  cycles,
  plLots,
  currentRole,
  selectedFarmId,
  onAddPond,
  onStartCycle,
  onCloseCycle,
  lang,
  era,
}) => {
  const t = translations[lang];

  const farmPonds = ponds.filter(p => p.farmId === selectedFarmId);

  // Modal states
  const [showAddPondModal, setShowAddPondModal] = useState(false);
  const [showNewCycleModal, setShowNewCycleModal] = useState(false);
  const [selectedPondForCycle, setSelectedPondForCycle] = useState<Pond | null>(null);

  // Close cycle modal
  const [cycleToClose, setCycleToClose] = useState<CultureCycle | null>(null);
  const [closeReason, setCloseReason] = useState<string>('');

  // Form State: New Pond
  const [pondCode, setPondCode] = useState(`บ่อ ${farmPonds.length + 1} (P${farmPonds.length + 1})`);
  const [pondName, setPondName] = useState('บ่อเลี้ยงกุ้งดิน');
  const [areaSqm, setAreaSqm] = useState('1600');
  const [depthMeters, setDepthMeters] = useState('1.5');

  // Form State: New Cycle
  const [selectedPlLotCode, setSelectedPlLotCode] = useState(plLots[0]?.lotCode || '');
  const [stockingCount, setStockingCount] = useState('120000');
  const [initialAbw, setInitialAbw] = useState('0.02'); // PL standard
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate CC- code: CC-{Year}-{PondCode}-{Index}
  const generateCycleCode = (pond: Pond) => {
    const yearShort = new Date().getFullYear().toString().slice(-2);
    const pCodeClean = pond.code.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3) || 'P01';
    const cycleCount = cycles.filter(c => c.pondId === pond.id).length + 1;
    return `CC-${yearShort}-${pCodeClean}-${String(cycleCount).padStart(2, '0')}`;
  };

  const handleCreatePondSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAddPond({
        farmId: selectedFarmId,
        code: pondCode,
        name: pondName,
        areaSqm: parseFloat(areaSqm) || 1600,
        depthMeters: parseFloat(depthMeters) || 1.5,
        status: 'idle',
      });
      setShowAddPondModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartCycleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPondForCycle) return;

    // RULE: 1 pond can have ONLY 1 active cycle!
    const existingActive = cycles.find(c => c.pondId === selectedPondForCycle.id && c.status === 'active');
    if (existingActive) {
      alert(`บ่อนี้มีรอบการเลี้ยง ${existingActive.cycleCode} ที่กำลังเลี้ยงอยู่แล้ว! ห้ามเปิดรอบซ้อนเด็ดขาด`);
      return;
    }

    const count = parseInt(stockingCount) || 100000;
    const density = calculateStockingDensity(count, selectedPondForCycle.areaSqm);
    const abw = parseFloat(initialAbw) || 0.05;
    const cycleCode = generateCycleCode(selectedPondForCycle);

    setIsSubmitting(true);
    try {
      await onStartCycle({
        cycleCode,
        farmId: selectedFarmId,
        pondId: selectedPondForCycle.id,
        pondCode: selectedPondForCycle.code,
        plLotId: selectedPlLotCode,
        stockingDate: new Date().toISOString(),
        stockingCount: count,
        stockingDensity: density,
        currentAbw: abw,
        estimatedSurvivalRate: 90,
        currentBiomassKg: calculateBiomass(count * 0.9, abw),
        cumulativeFeedKg: 0,
        status: 'active',
      });
      setShowNewCycleModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCycleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleToClose) return;

    // RULE: Closed cycle cannot be modified except by owner with required reason
    if (currentRole !== 'owner' && currentRole !== 'admin') {
      alert('เฉพาะเจ้าของฟาร์ม (Owner) หรือ Admin เท่านั้นที่มีสิทธิ์ปิดรอบหรือแก้ไขรอบที่ปิดแล้ว!');
      return;
    }

    if (!closeReason.trim()) {
      alert('กรุณาระบุเหตุผลการปิดรอบการเลี้ยงลงใน Audit Log');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCloseCycle(cycleToClose.id, closeReason);
      setCycleToClose(null);
      setCloseReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-700">
            <Building2 className="w-5 h-5" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              การจัดการฟาร์ม บ่อ และรอบการเลี้ยง (CC-)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            หัวใจระบบ: ควบคุม 1 บ่อมีรอบเลี้ยงได้ 1 รอบ และสร้างรหัสล็อตอัตโนมัติเชื่อมโยงทุกขั้นตอน
          </p>
        </div>

        {/* Add Pond Button (Owner/Admin) */}
        {(currentRole === 'owner' || currentRole === 'admin') && (
          <button
            onClick={() => setShowAddPondModal(true)}
            className="min-h-[46px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มบ่อใหม่</span>
          </button>
        )}
      </div>

      {/* Grid of Ponds */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {farmPonds.map(pond => {
          const activeCycle = cycles.find(c => c.pondId === pond.id && c.status === 'active');
          const pastCycles = cycles.filter(c => c.pondId === pond.id && c.status === 'closed');

          return (
            <div 
              key={pond.id}
              className={`rounded-2xl border-2 p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between ${
                activeCycle ? 'bg-white border-sky-300' : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-500 tracking-wider">
                      {pond.code}
                    </span>
                    <h3 className="text-lg font-black text-slate-900">{pond.name}</h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    activeCycle 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {activeCycle ? 'กำลังเลี้ยง (Active)' : 'บ่อว่าง (Idle)'}
                  </span>
                </div>

                <div className="text-xs text-slate-500 mb-4 flex gap-3">
                  <span>พื้นที่: <strong>{pond.areaSqm.toLocaleString()} ตร.ม.</strong> ({(pond.areaSqm / 1600).toFixed(1)} ไร่)</span>
                  <span>ความลึก: <strong>{pond.depthMeters} ม.</strong></span>
                </div>

                {/* Active Cycle Box */}
                {activeCycle ? (
                  <div className="bg-sky-50 rounded-xl p-3.5 border border-sky-200 space-y-2 text-xs mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sky-900">รอบการเลี้ยง:</span>
                      <span className="font-mono font-black text-sky-800 bg-sky-200/70 px-2 py-0.5 rounded">
                        {activeCycle.cycleCode}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>รหัสลูกกุ้ง (PL-):</span>
                      <span className="font-mono font-bold text-slate-900">{activeCycle.plLotId}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>จำนวนปล่อย:</span>
                      <span className="font-bold">{activeCycle.stockingCount.toLocaleString()} ตัว ({activeCycle.stockingDensity} ตัว/ตร.ม.)</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>น้ำหนักเฉลี่ย (ABW):</span>
                      <span className="font-bold text-emerald-700">{activeCycle.currentAbw} กรัม</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>ชีวมวลประเมิน:</span>
                      <span className="font-bold">{activeCycle.currentBiomassKg.toLocaleString()} กก.</span>
                    </div>

                    {/* Close Cycle Trigger (Owner only) */}
                    <div className="pt-2 border-t border-sky-200 flex justify-end">
                      <button
                        onClick={() => setCycleToClose(activeCycle)}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        <span>ปิดรอบการเลี้ยงนี้ (Close Cycle)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-4 border border-dashed border-slate-300 text-center mb-4 space-y-2">
                    <p className="text-xs text-slate-500">
                      ไม่มีรอบการเลี้ยงที่กำลังดำเนินอยู่ สามารถเปิดรอบใหม่ได้
                    </p>
                    <button
                      onClick={() => {
                        setSelectedPondForCycle(pond);
                        setShowNewCycleModal(true);
                      }}
                      className="min-h-[42px] w-full px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      + เปิดรอบเลี้ยงใหม่ (Start CC-)
                    </button>
                  </div>
                )}

                {/* Past Cycles History */}
                {pastCycles.length > 0 && (
                  <div className="text-[11px] text-slate-500">
                    <span className="font-bold">รอบที่ปิดแล้ว ({pastCycles.length} รอบ): </span>
                    <span className="font-mono">
                      {pastCycles.map(c => c.cycleCode).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Pond */}
      {showAddPondModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <h3 className="text-lg font-black text-slate-900 mb-4">เพิ่มบ่อเลี้ยงใหม่</h3>
            <form onSubmit={handleCreatePondSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">รหัสบ่อ (เช่น บ่อ 4 / P4):</label>
                <input
                  type="text"
                  value={pondCode}
                  onChange={(e) => setPondCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อเรียก / คำอธิบายบ่อ:</label>
                <input
                  type="text"
                  value={pondName}
                  onChange={(e) => setPondName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">พื้นที่ (ตร.ม.):</label>
                  <input
                    type="number"
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-indigo-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400">1 ไร่ = 1,600 ตร.ม.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ระดับน้ำลึก (เมตร):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={depthMeters}
                    onChange={(e) => setDepthMeters(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddPondModal(false)}
                  className="min-h-[46px] rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[46px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                >
                  บันทึกบ่อใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Start New Culture Cycle */}
      {showNewCycleModal && selectedPondForCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <h3 className="text-lg font-black text-slate-900 mb-2">
              เปิดรอบการเลี้ยงใหม่สำหรับ {selectedPondForCycle.code}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              รหัสรอบเลี้ยงจะถูกสร้างแบบไม่ซ้ำกันตามมาตรฐาน: <strong>{generateCycleCode(selectedPondForCycle)}</strong>
            </p>

            <form onSubmit={handleStartCycleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เลือกล็อตลูกกุ้ง (PL- Lot):
                </label>
                <select
                  value={selectedPlLotCode}
                  onChange={(e) => setSelectedPlLotCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-emerald-500 bg-white"
                  required
                >
                  {plLots.map(pl => (
                    <option key={pl.id} value={pl.lotCode}>
                      {pl.lotCode} - {pl.hatcheryName} (PCR: {pl.pcrResult === 'not_detected' ? 'ปลอดเชื้อ' : pl.pcrResult})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    จำนวนที่ปล่อย (ตัว):
                  </label>
                  <input
                    type="number"
                    value={stockingCount}
                    onChange={(e) => setStockingCount(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                    ความหนาแน่น: {calculateStockingDensity(parseInt(stockingCount) || 0, selectedPondForCycle.areaSqm)} ตัว/ตร.ม.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ขนาดเริ่มต้น (ABW กรัม):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialAbw}
                    onChange={(e) => setInitialAbw(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">PL10-12 ปกติ ~0.02-0.05g</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewCycleModal(false)}
                  className="min-h-[46px] rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  ยืนยันปล่อยกุ้งและเปิดรอบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Cycle (Owner Protected + Audit Reason) */}
      {cycleToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border-2 border-rose-300 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-600 mb-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-slate-900">
                ยืนยันการปิดรอบเลี้ยง ({cycleToClose.cycleCode})
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              ตามระเบียบระบบ: เมื่อรอบการเลี้ยงถูกปิดแล้ว ข้อมูลค่าน้ำ อาหาร และการจัดการจะไม่สามารถแก้ไขได้อีกยกเว้นโดย Owner พร้อมเหตุผล
            </p>

            <form onSubmit={handleCloseCycleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เหตุผลการปิดรอบ (บันทึก Audit Log):
                </label>
                <textarea
                  rows={3}
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder="เช่น จับกุ้งหมดบ่อแล้ว / เคลียร์บ่อเพื่อเตรียมรอบถัดไป..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-rose-500 bg-slate-50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCycleToClose(null)}
                  className="min-h-[46px] rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
                >
                  ยืนยันปิดรอบเลี้ยง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
