import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, Pill, Clock, Plus, 
  Calendar, CheckCircle, ArrowRight, Lock, Check
} from 'lucide-react';
import { Pond, CultureCycle, Treatment, DrugConfig, HarvestLot, UserRole } from '../types';
import { Language, CalendarEra, translations, formatDate } from '../lib/i18n';
import { DEFAULT_DRUGS } from '../lib/constants';
import { checkHarvestWithdrawalGate } from '../lib/calculations';
import { SelectPopover, SelectOption } from './ui/SelectPopover';

interface MedicineWithdrawalModuleProps {
  ponds: Pond[];
  cycles: CultureCycle[];
  treatments: Treatment[];
  drugs?: DrugConfig[];
  currentRole: UserRole;
  selectedFarmId: string;
  onAddTreatment: (treatment: Omit<Treatment, 'id'>) => Promise<void>;
  onCreateHarvestLot: (lot: Omit<HarvestLot, 'id'>) => Promise<void>;
  lang: Language;
  era: CalendarEra;
}

export const MedicineWithdrawalModule: React.FC<MedicineWithdrawalModuleProps> = ({
  ponds,
  cycles,
  treatments,
  drugs = DEFAULT_DRUGS,
  currentRole,
  selectedFarmId,
  onAddTreatment,
  onCreateHarvestLot,
  lang,
  era,
}) => {
  const t = translations[lang];

  const [activePondId, setActivePondId] = useState<string>(ponds[0]?.id ?? '');
  const activePond = ponds.find(p => p.id === activePondId);
  const activeCycle = cycles.find(c => c.pondId === activePondId && c.status === 'active');

  const pondOptions: SelectOption<string>[] = ponds.map(p => ({
    value: p.id,
    label: `${p.code} - ${p.name}`,
    sublabel: `${p.areaSqm} ตร.ม.`,
  }));

  // Modals
  const [showAddTreatmentModal, setShowAddTreatmentModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);

  // Form State: Add Treatment
  const [selectedDrugId, setSelectedDrugId] = useState<string>(drugs[0]?.id || '');
  const [dose, setDose] = useState('500 กรัม / ไร่');
  const [treatedDateStr, setTreatedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [treatmentReason, setTreatmentReason] = useState('ควบคุมเชื้อแบคทีเรียและปรับปรุงสิ่งแวดล้อมน้ำ');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State: Create Harvest Lot (HV-)
  const [harvestWeightKg, setHarvestWeightKg] = useState('2500');
  const [averageSizePcs, setAverageSizePcs] = useState('35');
  const [destinationProcessor, setDestinationProcessor] = useState('โรงงานซีฟู้ดแปรรูป สุราษฎร์มารีน จำกัด');

  const selectedDrug = drugs.find(d => d.id === selectedDrugId) || drugs[0];

  const computedSafeDate = useMemo(() => {
    if (!selectedDrug) return treatedDateStr;
    const d = new Date(treatedDateStr);
    d.setDate(d.getDate() + selectedDrug.standardWithdrawalDays);
    return d.toISOString().split('T')[0];
  }, [treatedDateStr, selectedDrug]);

  const pondTreatments = useMemo(() => {
    return treatments
      .filter(t => t.pondId === activePondId)
      .sort((a, b) => new Date(b.treatedAt).getTime() - new Date(a.treatedAt).getTime());
  }, [treatments, activePondId]);

  // CRITICAL PRE-HARVEST GATE EVALUATION
  const gateCheck = useMemo(() => {
    return checkHarvestWithdrawalGate(pondTreatments);
  }, [pondTreatments]);

  const generateHarvestLotCode = () => {
    const yearShort = new Date().getFullYear().toString().slice(-2);
    const pCodeClean = activePond?.code.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3) || 'P01';
    return `HV-${yearShort}-${pCodeClean}-001`;
  };

  const handleAddTreatmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePond || !activeCycle || !selectedDrug) return;

    setIsSubmitting(true);
    try {
      await onAddTreatment({
        farmId: activePond.farmId,
        pondId: activePond.id,
        pondCode: activePond.code,
        cycleId: activeCycle.id,
        cycleCode: activeCycle.cycleCode,
        drugId: selectedDrug.id,
        drugName: selectedDrug.name,
        dose,
        treatedAt: new Date(treatedDateStr).toISOString(),
        withdrawalDays: selectedDrug.standardWithdrawalDays,
        safeHarvestDate: computedSafeDate,
        reason: treatmentReason,
        recordedBy: 'ผู้ควบคุมการใช้ยาฟาร์ม',
      });
      setShowAddTreatmentModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateHarvestLotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePond || !activeCycle) return;

    if (!gateCheck.canHarvest) {
      alert(`ไม่อนุญาตให้สร้างล็อตจับกุ้ง! ${gateCheck.blockedReasonTh}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const lotCode = generateHarvestLotCode();
      await onCreateHarvestLot({
        lotCode,
        farmId: activePond.farmId,
        farmName: 'ฟาร์มทรัพย์สมบูรณ์ กุ้งทอง',
        pondId: activePond.id,
        pondCode: activePond.code,
        cycleId: activeCycle.id,
        cycleCode: activeCycle.cycleCode,
        plLotCode: activeCycle.plLotId,
        harvestDate: new Date().toISOString().split('T')[0],
        totalWeightKg: parseFloat(harvestWeightKg) || 2000,
        averageSizePcsPerKg: parseFloat(averageSizePcs) || 35,
        withdrawalPassed: true,
        withdrawalVerificationNote: 'ผ่านการตรวจสอบระยะหยุดยาเรียบร้อย ปลอดสารเคมีตกค้าง 100%',
        status: 'harvested',
        destinationProcessor,
      });
      setShowHarvestModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <Pill className="w-4 h-4" />
            <h2 className="text-heading text-slate-900 font-bold">
              บันทึกยา/สารเคมี และประตูตรวจก่อนจับ (Pre-Harvest Safety Gate)
            </h2>
          </div>
          <p className="text-caption text-slate-500">
            หัวใจความปลอดภัยอาหารสากล: บล็อกการสร้างรหัสล็อตจับ (HV-) โดยอัตโนมัติหากยังไม่พ้นระยะหยุดยาตกค้าง
          </p>
        </div>

        {/* Floating Pond Popover */}
        <div className="flex items-center gap-2">
          <span className="text-label text-slate-600 shrink-0">เลือกบ่อ:</span>
          <SelectPopover
            value={activePondId}
            onChange={setActivePondId}
            options={pondOptions}
            buttonClassName="py-1.5 px-3 text-xs font-semibold"
            aria-label="เลือกบ่อตรวจสอบระยะหยุดยา"
          />
        </div>
      </div>

      {/* CRITICAL PRE-HARVEST GATE BANNER (MOST IMPORTANT SECTION) */}
      <div className={`p-6 rounded-2xl border shadow-xs transition ${
        gateCheck.canHarvest
          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
          : 'bg-rose-50 border-rose-300 text-rose-950'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-semibold">
              {gateCheck.canHarvest ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">{t.withdrawalPassed}</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span className="text-rose-700">ประตูตรวจบล็อกการจับกุ้ง (Gate Locked)</span>
                </>
              )}
            </div>

            <h3 className="text-heading font-bold text-slate-900">
              {gateCheck.canHarvest 
                ? 'บ่อนี้ปลอดภัยต่อผู้บริโภค: อนุญาตให้จับกุ้งได้' 
                : 'ไม่อนุญาตให้จับกุ้งเด็ดขาด! ยังไม่พ้นระยะหยุดยา'}
            </h3>

            <p className="text-body text-slate-600">
              {gateCheck.canHarvest 
                ? 'ไม่พบประวัติการใช้ยาปฏิชีวนะหรือสารเคมีตกค้างในระยะต้องห้าม พร้อมสร้างรหัสล็อตจับ (HV-)' 
                : gateCheck.blockedReasonTh}
            </p>

            {!gateCheck.canHarvest && (
              <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200 text-caption text-rose-800 font-medium flex flex-wrap gap-4 mt-2">
                <span>วันที่พ้นระยะปลอดภัย: <strong>{formatDate(gateCheck.earliestSafeDate || '', lang, era)}</strong></span>
                <span>ระยะเวลารอคอย: <strong>อีก {gateCheck.daysRemaining} วัน</strong></span>
              </div>
            )}
          </div>

          {/* Harvest Action Button (BLOCKED IF NOT SAFE) */}
          <div className="shrink-0 flex flex-col items-center">
            {gateCheck.canHarvest ? (
              <button
                onClick={() => setShowHarvestModal(true)}
                disabled={!activeCycle}
                className="min-h-[50px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition active:scale-95 flex items-center gap-2"
                aria-label="สร้างรหัสล็อตจับกุ้ง"
              >
                <Check className="w-4 h-4" />
                <span>{t.createHarvestLot}</span>
              </button>
            ) : (
              <div className="text-center space-y-1">
                <button
                  disabled
                  title="ปุ่มถูกบล็อกอัตโนมัติเนื่องจากยังไม่พ้นระยะหยุดยา"
                  className="min-h-[50px] px-6 py-2.5 rounded-xl bg-slate-200 text-slate-400 text-sm font-semibold cursor-not-allowed flex items-center gap-2 border border-slate-300"
                  aria-disabled="true"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>บล็อกปุ่มสร้างรหัสจับ (HV-)</span>
                </button>
                <span className="text-[11px] text-rose-600 font-medium block">
                  ระบบบล็อกตามมาตรฐานกฎหมายความปลอดภัย
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar: Add Treatment */}
      <div className="flex justify-between items-center">
        <h3 className="text-title text-slate-900 font-semibold">
          ประวัติการให้ยา/สารเคมี ({activePond?.code})
        </h3>
        <button
          onClick={() => setShowAddTreatmentModal(true)}
          disabled={!activeCycle}
          className="min-h-[42px] px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium text-caption rounded-xl shadow-xs flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>บันทึกการใช้ยา/สารเคมี</span>
        </button>
      </div>

      {/* Treatments List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        {pondTreatments.length === 0 ? (
          <div className="text-center py-6 text-caption text-slate-400">
            ไม่มีประวัติการใช้ยาหรือสารเคมีในบ่อนี้ (กุ้งปลอดภัย 100%)
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-caption">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">วันที่ให้</th>
                  <th className="py-2.5 px-3">ชื่อยา / สารเคมี</th>
                  <th className="py-2.5 px-3">ขนาดยา</th>
                  <th className="py-2.5 px-3">ระยะหยุดยา</th>
                  <th className="py-2.5 px-3">วันพ้นระยะปลอดภัย</th>
                  <th className="py-2.5 px-3">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {pondTreatments.map((tr) => {
                  const nowStr = new Date().toISOString().split('T')[0];
                  const isStillActive = tr.safeHarvestDate > nowStr;

                  return (
                    <tr key={tr.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {formatDate(tr.treatedAt, lang, era)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {tr.drugName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {tr.dose}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-rose-600">
                        {tr.withdrawalDays} วัน
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                        {formatDate(tr.safeHarvestDate, lang, era)}
                      </td>
                      <td className="py-2.5 px-3">
                        {isStillActive ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700">
                            ยังอยู่ในระยะหยุดยา
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                            พ้นระยะปลอดภัยแล้ว
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Treatment */}
      {showAddTreatmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200 animate-in fade-in">
            <h3 className="text-title font-bold text-slate-900 mb-1">
              บันทึกการใช้ยา / สารเคมี ({activePond?.code})
            </h3>
            <p className="text-caption text-slate-500 mb-4">
              เลือกระบุยาจากฐานข้อมูลมาตรฐาน ระบบจะคำนวณวันพ้นระยะหยุดยาโดยอัตโนมัติ
            </p>

            <form onSubmit={handleAddTreatmentSubmit} className="space-y-4">
              <div>
                <label className="block text-label mb-1">เลือกชนิดยา / สารเคมี:</label>
                <select
                  value={selectedDrugId}
                  onChange={(e) => setSelectedDrugId(e.target.value)}
                  className="saas-input w-full font-semibold"
                  required
                >
                  {drugs.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} — ระยะหยุดยา {d.standardWithdrawalDays} วัน
                    </option>
                  ))}
                </select>
                <span className="text-caption text-slate-400 block mt-1">
                  สรรพคุณ: {selectedDrug.indicationTh}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label mb-1">วันที่ให้ยา:</label>
                  <input
                    type="date"
                    value={treatedDateStr}
                    onChange={(e) => setTreatedDateStr(e.target.value)}
                    className="saas-input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-label mb-1">ขนาดยา (Dose):</label>
                  <input
                    type="text"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    className="saas-input w-full"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-caption text-amber-900 space-y-1">
                <div className="flex justify-between">
                  <span>ระยะหยุดยามาตรฐาน:</span>
                  <strong>{selectedDrug.standardWithdrawalDays} วัน</strong>
                </div>
                <div className="flex justify-between">
                  <span>วันที่พ้นระยะปลอดภัย:</span>
                  <strong className="text-rose-700 font-mono">{formatDate(computedSafeDate, lang, era)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-label mb-1">เหตุผลการใช้ยา:</label>
                <input
                  type="text"
                  value={treatmentReason}
                  onChange={(e) => setTreatmentReason(e.target.value)}
                  className="saas-input w-full text-caption"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTreatmentModal(false)}
                  className="min-h-[44px] rounded-xl border border-slate-300 text-slate-700 font-medium text-caption hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-caption shadow-xs transition"
                >
                  บันทึกการใช้ยา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Harvest Lot (HV-) */}
      {showHarvestModal && activePond && activeCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-title font-bold text-slate-900">
                สร้างรหัสล็อตจับกุ้ง ({generateHarvestLotCode()})
              </h3>
            </div>
            
            <p className="text-caption text-slate-500 mb-4">
              ผ่านการตรวจสอบประตูความปลอดภัยสารตกค้างเรียบร้อย พร้อมออกใบกำกับการจับกุ้ง (HV-)
            </p>

            <form onSubmit={handleCreateHarvestLotSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label mb-1">น้ำหนักรวม (กก.):</label>
                  <input
                    type="number"
                    value={harvestWeightKg}
                    onChange={(e) => setHarvestWeightKg(e.target.value)}
                    className="saas-input w-full font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-label mb-1">ขนาดเฉลี่ย (ตัว/กก.):</label>
                  <input
                    type="number"
                    value={averageSizePcs}
                    onChange={(e) => setAverageSizePcs(e.target.value)}
                    className="saas-input w-full font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-label mb-1">โรงงานแปรรูปปลายทาง:</label>
                <input
                  type="text"
                  value={destinationProcessor}
                  onChange={(e) => setDestinationProcessor(e.target.value)}
                  className="saas-input w-full text-caption"
                  required
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-caption text-emerald-900">
                เชื่อมโยงกับรอบเลี้ยง <strong>{activeCycle.cycleCode}</strong> และลูกกุ้ง <strong>{activeCycle.plLotId}</strong>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHarvestModal(false)}
                  className="min-h-[44px] rounded-xl border border-slate-300 text-slate-700 font-medium text-caption hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-caption shadow-xs transition"
                >
                  ยืนยันสร้างล็อตจับ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
