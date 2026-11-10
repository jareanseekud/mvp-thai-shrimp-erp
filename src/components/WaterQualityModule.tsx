import React, { useState, useMemo } from 'react';
import { 
  Droplets, AlertOctagon, AlertTriangle, CheckCircle2, History, 
  Check, Info, ShieldAlert, ArrowUpDown
} from 'lucide-react';
import { Pond, CultureCycle, WaterLog, WaterStandards, WaterPeriod, FeedingLog } from '../types';
import { Language, CalendarEra, translations, formatDate } from '../lib/i18n';
import { DEFAULT_WATER_STANDARDS } from '../lib/constants';
import { SelectPopover, SelectOption } from './ui/SelectPopover';

interface WaterQualityModuleProps {
  ponds: Pond[];
  cycles: CultureCycle[];
  waterLogs: WaterLog[];
  feedingLogs: FeedingLog[];
  standards: WaterStandards;
  selectedPondId?: string;
  onSaveWaterLog: (log: Omit<WaterLog, 'id'>) => Promise<void>;
  lang: Language;
  era: CalendarEra;
}

export const WaterQualityModule: React.FC<WaterQualityModuleProps> = ({
  ponds,
  cycles,
  waterLogs,
  feedingLogs,
  standards = DEFAULT_WATER_STANDARDS,
  selectedPondId,
  onSaveWaterLog,
  lang,
  era,
}) => {
  const t = translations[lang];

  // Active pond selection
  const [activePondId, setActivePondId] = useState<string>(
    selectedPondId || (ponds[0]?.id ?? '')
  );

  const activePond = ponds.find(p => p.id === activePondId);
  const activeCycle = cycles.find(c => c.pondId === activePondId && c.status === 'active');

  const pondOptions: SelectOption<string>[] = ponds.map(p => ({
    value: p.id,
    label: `${p.code} - ${p.name}`,
    sublabel: `${p.areaSqm} ตร.ม.`,
  }));

  // Form State
  const [period, setPeriod] = useState<WaterPeriod>('morning');
  const [doVal, setDoVal] = useState<string>('6.2');
  const [phVal, setPhVal] = useState<string>('7.8');
  const [salinityVal, setSalinityVal] = useState<string>('18');
  const [ammoniaVal, setAmmoniaVal] = useState<string>('0.2');
  const [nitriteVal, setNitriteVal] = useState<string>('0.1');
  const [alkalinityVal, setAlkalinityVal] = useState<string>('150');
  const [tempVal, setTempVal] = useState<string>('29.5');
  const [notes, setNotes] = useState<string>('');

  // Confirmation modal state for out-of-range parameters
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter logs for this pond
  const pondLogs = useMemo(() => {
    return waterLogs
      .filter(l => l.pondId === activePondId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }, [waterLogs, activePondId]);

  const previousLog = pondLogs[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = pondLogs.filter(l => l.dateStr === todayStr);

  const latestFeed = feedingLogs.find(f => f.pondId === activePondId);
  const hasHighLeftoverFeed = (latestFeed?.checkTrayLeftoverPercent ?? 0) >= 20;

  // Real-time evaluation of current form values
  const currentDo = parseFloat(doVal) || 0;
  const currentPh = parseFloat(phVal) || 0;
  const currentSalinity = parseFloat(salinityVal) || 0;
  const currentAmmonia = parseFloat(ammoniaVal) || 0;
  const currentNitrite = parseFloat(nitriteVal) || 0;
  const currentAlkalinity = parseFloat(alkalinityVal) || 0;
  const currentTemp = parseFloat(tempVal) || 0;

  // Special alert flags
  const isDoCriticallyLow = currentDo < standards.doAlertRed;
  const isAmmoniaToxic = currentAmmonia > standards.ammoniaAlertRed && currentPh > 8.5;
  const isRiskOfMortality = isDoCriticallyLow && hasHighLeftoverFeed;

  const otherPeriodPh = todayLogs.find(l => l.period !== period)?.ph;
  const phSwing = otherPeriodPh !== undefined ? Math.abs(currentPh - otherPeriodPh) : 0;
  const isPhSwingHigh = phSwing > 0.8;

  const salinityDiff = previousLog ? Math.abs(currentSalinity - previousLog.salinity) : 0;
  const isSalinityDrift = salinityDiff > standards.salinityMaxDailyChange;

  // Compute all out-of-range warnings
  const outOfRangeWarnings = useMemo(() => {
    const list: string[] = [];

    if (currentDo < standards.doAlertRed) {
      list.push(`DO ต่ำกว่าเกณฑ์วิกฤต (< ${standards.doAlertRed} mg/L)`);
    } else if (currentDo < standards.doOptimalMin || currentDo > standards.doOptimalMax) {
      list.push(`DO อยู่นอกเกณฑ์เหมาะสม (${standards.doOptimalMin}-${standards.doOptimalMax} mg/L)`);
    }

    if (currentPh < standards.phAlertLow || currentPh > standards.phAlertHigh) {
      list.push(`pH วิกฤต (< ${standards.phAlertLow} หรือ > ${standards.phAlertHigh})`);
    } else if (currentPh < standards.phOptimalMin || currentPh > standards.phOptimalMax) {
      list.push(`pH อยู่นอกเกณฑ์เหมาะสม (${standards.phOptimalMin}-${standards.phOptimalMax})`);
    }

    if (currentSalinity < standards.salinityOptimalMin || currentSalinity > standards.salinityOptimalMax) {
      list.push(`ความเค็มอยู่นอกเกณฑ์เหมาะสม (${standards.salinityOptimalMin}-${standards.salinityOptimalMax} ppt)`);
    }

    if (isSalinityDrift) {
      list.push(`ความเค็มเปลี่ยนไปเกิน ${standards.salinityMaxDailyChange} ppt/วัน (เปลี่ยนไป ${salinityDiff.toFixed(1)} ppt)`);
    }

    if (currentAmmonia > standards.ammoniaAlertRed) {
      list.push(`แอมโมเนียเกินเกณฑ์ปลอดภัย (> ${standards.ammoniaAlertRed} mg/L)`);
    }

    if (currentNitrite > standards.nitriteAlert) {
      list.push(`ไนไตรท์เกินเกณฑ์ (> ${standards.nitriteAlert} mg/L)`);
    }

    if (currentAlkalinity < standards.alkalinityAlertRed) {
      list.push(`อัลคาไลน์ต่ำวิกฤต (< ${standards.alkalinityAlertRed} mg/L)`);
    } else if (currentAlkalinity < standards.alkalinityOptimalMin || currentAlkalinity > standards.alkalinityOptimalMax) {
      list.push(`อัลคาไลน์อยู่นอกเกณฑ์เหมาะสม (${standards.alkalinityOptimalMin}-${standards.alkalinityOptimalMax} mg/L)`);
    }

    if (currentTemp < standards.tempAlertLow || currentTemp > standards.tempAlertHigh) {
      list.push(`อุณหภูมิผิดปกติ (< ${standards.tempAlertLow}°C หรือ > ${standards.tempAlertHigh}°C)`);
    }

    if (isRiskOfMortality) {
      list.push('เสี่ยงตายยกบ่อ! DO วิกฤต + อาหารเหลือมาก');
    }
    if (isPhSwingHigh) {
      list.push(`pH สวิง อัลคาไลน์ต่ำ (ต่างกัน ${phSwing.toFixed(2)} ในรอบวัน)`);
    }
    if (isAmmoniaToxic) {
      list.push('พิษแอมโมเนียรุนแรง (NH₃ สูงจาก pH ด่างจัด)');
    }

    return list;
  }, [
    currentDo, currentPh, currentSalinity, currentAmmonia, currentNitrite, 
    currentAlkalinity, currentTemp, standards, isSalinityDrift, salinityDiff, 
    isRiskOfMortality, isPhSwingHigh, phSwing, isAmmoniaToxic
  ]);

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (outOfRangeWarnings.length > 0) {
      setShowConfirmModal(true);
    } else {
      executeSave(false);
    }
  };

  const executeSave = async (confirmedOutOfRange: boolean) => {
    if (!activePond || !activeCycle) return;
    setIsSubmitting(true);
    try {
      await onSaveWaterLog({
        farmId: activePond.farmId,
        pondId: activePond.id,
        pondCode: activePond.code,
        cycleId: activeCycle.id,
        cycleCode: activeCycle.cycleCode,
        recordedAt: new Date().toISOString(),
        dateStr: todayStr,
        period,
        dissolvedOxygen: currentDo,
        ph: currentPh,
        salinity: currentSalinity,
        ammonia: currentAmmonia,
        nitrite: currentNitrite,
        alkalinity: currentAlkalinity,
        temperature: currentTemp,
        warnings: outOfRangeWarnings,
        confirmedOutOfRange,
        notes,
        recordedBy: 'ช่างเทคนิคประจำฟาร์ม',
      });
      setShowConfirmModal(false);
      setSuccessToast('บันทึกค่าน้ำเรียบร้อยแล้ว');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Pond Popover Switcher - 1 Screen = 1 Job */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 rounded-[22px]">
        <div>
          <div className="flex items-center gap-2 text-[#FF7A1A] mb-1">
            <Droplets className="w-5 h-5 text-[#FF7A1A]" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{t.waterTitle}</h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            บันทึกค่าน้ำ 7 พารามิเตอร์ 1 หน้าจอจบ พร้อมระบบตรวจจับความเสี่ยงวิกฤตอัตโนมัติ
          </p>
        </div>

        {/* Floating SelectPopover for Pond */}
        <div className="flex items-center gap-2.5">
          <span className="text-sm sm:text-base font-bold text-slate-700 shrink-0">เลือกบ่อ:</span>
          <SelectPopover
            value={activePondId}
            onChange={setActivePondId}
            options={pondOptions}
            buttonClassName="py-2.5 px-4 text-sm sm:text-base font-bold min-h-[48px]"
            aria-label="เลือกบ่อเลี้ยง"
          />
        </div>
      </div>

      {/* Cycle warning if no active cycle */}
      {!activeCycle && (
        <div className="bg-amber-50 border border-amber-300 rounded-[20px] p-4 text-amber-900 text-base font-semibold flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <span>บ่อนี้ยังไม่มีรอบเลี้ยง (CC-) ที่เปิดอยู่ กรุณาเปิดรอบเลี้ยงก่อนบันทึกค่าน้ำ</span>
        </div>
      )}

      {/* CRITICAL SPECIAL ALERTS (Actionable explanation: ต้องแก้ตรงไหน) */}
      {isRiskOfMortality && (
        <div className="bg-rose-50 border-2 border-rose-400 text-rose-950 p-5 rounded-[22px] flex items-start gap-3.5 shadow-sm">
          <ShieldAlert className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-rose-950">
              วิกฤตระดับสูงสุด: เสี่ยงกุ้งตายยกบ่อ!
            </h3>
            <p className="text-base text-rose-900 font-medium leading-relaxed">
              ออกซิเจนละลายในน้ำต่ำวิกฤต ({currentDo} mg/L) และมีเศษอาหารเหลือในบ่อมาก <br/>
              <strong className="text-rose-950 underline">วิธีแก้ด่วน:</strong> เปิดเครื่องตีน้ำทุกตัวทันที และงดอาหารมื้อถัดไป 100%
            </p>
          </div>
        </div>
      )}

      {isPhSwingHigh && (
        <div className="bg-amber-50 border-2 border-amber-300 text-amber-950 p-5 rounded-[22px] flex items-start gap-3.5 shadow-sm">
          <AlertOctagon className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-amber-950">
              เตือน: น้ำเสีย / pH สวิง อัลคาไลน์ต่ำ!
            </h3>
            <p className="text-base text-amber-900 font-medium leading-relaxed">
              ค่า pH ในรอบวันแกว่งต่างกัน {phSwing.toFixed(2)} หน่วย <br/>
              <strong className="text-amber-950 underline">วิธีแก้:</strong> เติมปูนโซเดียมไบคาร์บอเนต 10-15 กก./ไร่ ตอนค่ำ เพื่อเพิ่มบัฟเฟอร์น้ำ
            </p>
          </div>
        </div>
      )}

      {isAmmoniaToxic && (
        <div className="bg-rose-50 border-2 border-rose-400 text-rose-950 p-5 rounded-[22px] flex items-start gap-3.5 shadow-sm">
          <AlertTriangle className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-rose-950">
              วิกฤต: พิษแอมโมเนียอิสระรุนแรง (Toxic NH₃)!
            </h3>
            <p className="text-base text-rose-900 font-medium leading-relaxed">
              แอมโมเนียรวม {currentAmmonia} mg/L ร่วมกับ pH {currentPh} (ด่างจัด) ทำให้เกิดก๊าซพิษ <br/>
              <strong className="text-rose-950 underline">วิธีแก้:</strong> หว่านกากน้ำตาลหรือจุลินทรีย์ และลด pH ไม่ให้เกิน 8.0
            </p>
          </div>
        </div>
      )}

      {/* Main 1-Screen Form */}
      <form onSubmit={handleSubmitAttempt} className="glass-card rounded-[22px] p-5 sm:p-7 space-y-6">
        
        {/* Period Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-orange-100">
          <div>
            <span className="text-base font-bold text-slate-800 block mb-2">ช่วงเวลาบันทึก:</span>
            <div className="flex flex-wrap gap-2.5">
              {(['morning', 'afternoon', 'evening', 'night'] as WaterPeriod[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`min-h-[48px] px-4 py-2 rounded-xl text-sm sm:text-base font-bold transition cursor-pointer active:scale-[0.97] ${
                    period === p
                      ? 'bg-gradient-to-r from-[#FF7A1A] to-[#FF903F] text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-orange-50/50'
                  }`}
                >
                  {p === 'morning' ? t.periodMorning : p === 'afternoon' ? t.periodAfternoon : p === 'evening' ? t.periodEvening : t.periodNight}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-500 bg-orange-50/60 border border-orange-200/60 px-3.5 py-2.5 rounded-xl font-medium">
            {t.wetHandNotice}
          </div>
        </div>

        {/* 7 Core Parameters Grid - Clean inputs, keeping >=56px input numbers for wet farm hands */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. DO */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between text-caption font-semibold text-slate-700 mb-1">
              <span>{t.do}</span>
              <span className="text-slate-400">Optimal: 5-8</span>
            </div>
            <div className="relative mt-1">
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={doVal}
                onChange={(e) => setDoVal(e.target.value)}
                className="w-full min-h-[56px] text-xl font-bold text-slate-900 saas-input px-3"
                aria-label="ออกซิเจนละลายในน้ำ"
              />
              <span className="absolute right-3 top-4 text-caption text-slate-400">mg/L</span>
            </div>
          </div>

          {/* 2. pH */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between text-caption font-semibold text-slate-700 mb-1">
              <span>{t.ph}</span>
              <span className="text-slate-400">Optimal: 7.5-8.5</span>
            </div>
            <div className="relative mt-1">
              <input
                type="number"
                step="0.05"
                min="0"
                max="14"
                value={phVal}
                onChange={(e) => setPhVal(e.target.value)}
                className="w-full min-h-[56px] text-xl font-bold text-slate-900 saas-input px-3"
                aria-label="ความเป็นกรด-ด่าง"
              />
            </div>
          </div>

          {/* 3. Salinity */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between text-caption font-semibold text-slate-700 mb-1">
              <span>{t.salinity}</span>
              <span className="text-slate-400">Optimal: 10-25</span>
            </div>
            <div className="relative mt-1">
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={salinityVal}
                onChange={(e) => setSalinityVal(e.target.value)}
                className="w-full min-h-[56px] text-xl font-bold text-slate-900 saas-input px-3"
                aria-label="ความเค็ม"
              />
              <span className="absolute right-3 top-4 text-caption text-slate-400">ppt</span>
            </div>
          </div>

          {/* 4. Temperature */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between text-caption font-semibold text-slate-700 mb-1">
              <span>{t.temperature}</span>
              <span className="text-slate-400">Optimal: 28-32°C</span>
            </div>
            <div className="relative mt-1">
              <input
                type="number"
                step="0.1"
                min="10"
                max="45"
                value={tempVal}
                onChange={(e) => setTempVal(e.target.value)}
                className="w-full min-h-[56px] text-xl font-bold text-slate-900 saas-input px-3"
                aria-label="อุณหภูมิน้ำ"
              />
              <span className="absolute right-3 top-4 text-caption text-slate-400">°C</span>
            </div>
          </div>

          {/* 5. Ammonia TAN */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between text-caption font-semibold text-slate-700 mb-1">
              <span>{t.ammonia}</span>
              <span className="text-rose-600 font-medium">เตือนแดง: &gt;1.0</span>
            </div>
            <div className="relative mt-1">
              <input
                type="number"
                step="0.05"
                min="0"
                max="10"
                value={ammoniaVal}
                onChange={(e) => setAmmoniaVal(e.target.value)}
                className="w-full min-h-[56px] text-xl font-bold text-slate-900 saas-input px-3"
                aria-label="แอมโมเนียรวม"
              />
              <span className="absolute right-3 top-4 text-caption text-slate-400">mg/L</span>
            </div>
          </div>

          {/* 6. Nitrite */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between text-caption font-semibold text-slate-700 mb-1">
              <span>{t.nitrite}</span>
              <span className="text-amber-600 font-medium">เตือน: &gt;1.0</span>
            </div>
            <div className="relative mt-1">
              <input
                type="number"
                step="0.05"
                min="0"
                max="10"
                value={nitriteVal}
                onChange={(e) => setNitriteVal(e.target.value)}
                className="w-full min-h-[56px] text-xl font-bold text-slate-900 saas-input px-3"
                aria-label="ไนไตรท์"
              />
              <span className="absolute right-3 top-4 text-caption text-slate-400">mg/L</span>
            </div>
          </div>

          {/* 7. Alkalinity */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white col-span-1 sm:col-span-2">
            <div className="flex items-center justify-between text-caption font-semibold text-slate-700 mb-1">
              <span>{t.alkalinity}</span>
              <span className="text-slate-400">Optimal: 120-200 | เตือนแดง: &lt;80</span>
            </div>
            <div className="relative mt-1">
              <input
                type="number"
                step="1"
                min="0"
                max="500"
                value={alkalinityVal}
                onChange={(e) => setAlkalinityVal(e.target.value)}
                className="w-full min-h-[56px] text-xl font-bold text-slate-900 saas-input px-3"
                aria-label="อัลคาไลน์"
              />
              <span className="absolute right-3 top-4 text-caption text-slate-400">mg/L CaCO₃</span>
            </div>
          </div>

        </div>

        {/* Notes */}
        <div>
          <label className="block text-label mb-1">บันทึกเพิ่มเติม:</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="เช่น สีน้ำโปร่งใสขึ้น แดดจัด เปิดใบพัด 6 ตัว..."
            className="saas-input w-full text-body"
          />
        </div>

        {/* Submit Button (≥60px touch target friendly for wet hands) */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting || !activeCycle}
            className={`w-full min-h-[60px] rounded-2xl text-lg font-bold text-white shadow-md flex items-center justify-center gap-3 transition cursor-pointer active:scale-[0.97] ${
              outOfRangeWarnings.length > 0
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600'
                : 'bg-gradient-to-r from-[#FF7A1A] to-[#FF903F] hover:from-[#E8670C] hover:to-[#FF8024]'
            } disabled:opacity-50`}
          >
            {isSubmitting ? (
              <span>กำลังบันทึก...</span>
            ) : (
              <>
                <Check className="w-6 h-6 text-white" />
                <span>{outOfRangeWarnings.length > 0 ? 'ตรวจสอบ & ยืนยันบันทึกค่าน้ำ' : 'บันทึกค่าน้ำทันที'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[24px] bg-white p-6 sm:p-7 shadow-2xl border border-orange-200 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-amber-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-xl font-bold text-slate-900">
                {t.waterConfirmWarningTitle}
              </h3>
            </div>
            
            <p className="text-base text-slate-600 mb-4 leading-relaxed font-medium">
              {t.waterConfirmWarningMsg}
            </p>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-6 space-y-2 text-sm sm:text-base text-amber-900 font-semibold">
              {outOfRangeWarnings.map((w, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="min-h-[56px] rounded-2xl border-2 border-slate-300 text-slate-700 font-bold text-base hover:bg-slate-100 transition active:scale-[0.97]"
              >
                กลับไปแก้ไข
              </button>
              <button
                type="button"
                onClick={() => executeSave(true)}
                disabled={isSubmitting}
                className="min-h-[56px] rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-base shadow-md transition active:scale-[0.97]"
              >
                ยืนยันบันทึกค่านี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-caption font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-sky-600" />
            <h3 className="text-title text-slate-900 font-semibold">
              ประวัติค่าน้ำย้อนหลัง ({activePond?.code})
            </h3>
          </div>
          <span className="text-caption text-slate-400">
            {pondLogs.length} รายการ
          </span>
        </div>

        {pondLogs.length === 0 ? (
          <div className="text-center py-6 text-caption text-slate-400">
            {t.noData}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-caption">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">วันที่ / ช่วง</th>
                  <th className="py-2.5 px-3">DO</th>
                  <th className="py-2.5 px-3">pH</th>
                  <th className="py-2.5 px-3">ความเค็ม</th>
                  <th className="py-2.5 px-3">แอมโมเนีย</th>
                  <th className="py-2.5 px-3">ไนไตรท์</th>
                  <th className="py-2.5 px-3">อัลคาไลน์</th>
                  <th className="py-2.5 px-3">อุณหภูมิ</th>
                  <th className="py-2.5 px-3">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {pondLogs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800">{formatDate(log.recordedAt, lang, era)}</span>
                      <span className="text-slate-400 ml-1">
                        ({log.period === 'morning' ? 'เช้า' : log.period === 'afternoon' ? 'บ่าย' : log.period === 'evening' ? 'เย็น' : 'ดึก'})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium">{log.dissolvedOxygen.toFixed(1)}</td>
                    <td className="py-2.5 px-3 font-mono font-medium">{log.ph.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-mono">{log.salinity}</td>
                    <td className="py-2.5 px-3 font-mono">{log.ammonia.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-mono">{log.nitrite.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-mono">{log.alkalinity}</td>
                    <td className="py-2.5 px-3 font-mono">{log.temperature.toFixed(1)}</td>
                    <td className="py-2.5 px-3">
                      {log.warnings && log.warnings.length > 0 ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
                          {log.warnings.length} เตือน
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                          ปกติ
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
