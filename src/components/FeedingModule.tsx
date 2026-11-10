import React, { useState, useMemo } from 'react';
import { 
  Utensils, Calculator, AlertTriangle, ShieldAlert, CheckCircle, 
  History, Scale, Check, Clock, Edit3, ArrowRight, Info
} from 'lucide-react';
import { Pond, CultureCycle, FeedingLog, FeedingRateConfig, WaterLog } from '../types';
import { Language, CalendarEra, translations, formatDate } from '../lib/i18n';
import { 
  calculateBiomass, getFeedingRateConfig, calculateDailyFeed, 
  calculateMealFeed, evaluateCheckTray, evaluateEnvironmentalFeedRules 
} from '../lib/calculations';
import { DEFAULT_FEEDING_RATES } from '../lib/constants';
import { SelectPopover, SelectOption } from './ui/SelectPopover';

interface FeedingModuleProps {
  ponds: Pond[];
  cycles: CultureCycle[];
  feedingLogs: FeedingLog[];
  waterLogs: WaterLog[];
  customFeedingRates?: FeedingRateConfig[];
  selectedPondId?: string;
  onSaveFeedingLog: (log: Omit<FeedingLog, 'id'>, auditReason?: string) => Promise<void>;
  onUpdateAbw: (cycleId: string, newAbw: number) => Promise<void>;
  lang: Language;
  era: CalendarEra;
}

export const FeedingModule: React.FC<FeedingModuleProps> = ({
  ponds,
  cycles,
  feedingLogs,
  waterLogs,
  customFeedingRates = DEFAULT_FEEDING_RATES,
  selectedPondId,
  onSaveFeedingLog,
  onUpdateAbw,
  lang,
  era,
}) => {
  const t = translations[lang];

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

  // ABW Management: strictly enforced (NO guessing allowed!)
  const [inputAbw, setInputAbw] = useState<string>(
    activeCycle?.currentAbw ? String(activeCycle.currentAbw) : ''
  );
  const [showAbwPrompt, setShowAbwPrompt] = useState<boolean>(!activeCycle?.currentAbw);

  // Feeding Form State
  const [mealIndex, setMealIndex] = useState<number>(1);
  const [checkTrayLeftover, setCheckTrayLeftover] = useState<string>('15');
  const [trayTimeMinutes, setTrayTimeMinutes] = useState<number>(60);
  const [actualFedKg, setActualFedKg] = useState<string>('');
  const [manualReason, setManualReason] = useState<string>('');

  // Environmental conditions toggles for auto reduction/withholding
  const [isMassMolting, setIsMassMolting] = useState<boolean>(false);
  const [isHeavyRain, setIsHeavyRain] = useState<boolean>(false);
  const [isOneDayBeforeHarvest, setIsOneDayBeforeHarvest] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Latest DO level from water logs
  const latestWater = waterLogs.find(w => w.pondId === activePondId);
  const currentDo = latestWater?.dissolvedOxygen;

  // Filter logs for active pond
  const pondFeedLogs = useMemo(() => {
    return feedingLogs
      .filter(f => f.pondId === activePondId)
      .sort((a, b) => new Date(b.fedAt).getTime() - new Date(a.fedAt).getTime());
  }, [feedingLogs, activePondId]);

  // Check 2 consecutive days feeding drop > 30% alert ("สงสัยป่วย")
  const isFeedingDroppedConsecutive = useMemo(() => {
    if (pondFeedLogs.length < 2) return false;
    const last2 = pondFeedLogs.slice(0, 2);
    return last2.every(log => {
      if (!log.recommendedAmountKg || log.recommendedAmountKg <= 0) return false;
      const dropPct = ((log.recommendedAmountKg - log.actualAmountKg) / log.recommendedAmountKg) * 100;
      return dropPct >= 30;
    });
  }, [pondFeedLogs]);

  const effectiveAbw = activeCycle?.currentAbw || parseFloat(inputAbw) || 0;
  const remainingShrimp = activeCycle 
    ? Math.round(activeCycle.stockingCount * ((activeCycle.estimatedSurvivalRate || 85) / 100))
    : 0;

  // 1. Biomass (kg) = Remaining shrimp count x ABW (g) / 1000
  const calculatedBiomassKg = calculateBiomass(remainingShrimp, effectiveAbw);

  // 2. Feeding Rate & Meals config
  const rateConfig = getFeedingRateConfig(effectiveAbw, customFeedingRates);
  const appliedFeedingRate = (rateConfig.rateMinPercent + rateConfig.rateMaxPercent) / 2;
  const totalMealsPerDay = rateConfig.defaultMeals;

  // 3. Feed per day & meal
  const baseDailyFeedKg = calculateDailyFeed(calculatedBiomassKg, appliedFeedingRate);
  const baseMealFeedKg = calculateMealFeed(baseDailyFeedKg, totalMealsPerDay);

  // Check Tray Advice
  const leftoverNumber = parseFloat(checkTrayLeftover) || 0;
  const checkTrayAdvice = evaluateCheckTray(leftoverNumber, trayTimeMinutes);

  // Environmental reduction evaluation
  const envEvaluation = evaluateEnvironmentalFeedRules({
    doLevel: currentDo,
    isMassMolting,
    isHeavyRainOrTempDrop: isHeavyRain,
    isOneDayBeforeHarvest,
  });

  // Final Recommended meal feed calculation
  const recommendedMealFeedKg = useMemo(() => {
    if (envEvaluation.action === 'withhold') return 0;
    let adjusted = baseMealFeedKg;

    if (checkTrayAdvice.adjustmentPercent !== 0) {
      adjusted = adjusted * (1 + checkTrayAdvice.adjustmentPercent / 100);
    }

    if (envEvaluation.reductionPercent > 0) {
      adjusted = adjusted * (1 - envEvaluation.reductionPercent / 100);
    }

    return Number(Math.max(0, adjusted).toFixed(2));
  }, [baseMealFeedKg, checkTrayAdvice, envEvaluation]);

  React.useEffect(() => {
    setActualFedKg(String(recommendedMealFeedKg));
  }, [recommendedMealFeedKg]);

  const handleUpdateAbwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const abw = parseFloat(inputAbw);
    if (!abw || abw <= 0 || !activeCycle) return;
    await onUpdateAbw(activeCycle.id, abw);
    setShowAbwPrompt(false);
    setToastMsg(`อัปเดต ABW กุ้งเป็น ${abw} กรัม สำเร็จ`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleMarkAsFed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePond || !activeCycle) return;

    if (!effectiveAbw || effectiveAbw <= 0) {
      setShowAbwPrompt(true);
      return;
    }

    const actualKg = parseFloat(actualFedKg) || 0;
    const isManualOverride = Math.abs(actualKg - recommendedMealFeedKg) > 0.01;

    if (isManualOverride && !manualReason.trim()) {
      alert('มีการปรับแก้ปริมาณอาหารจริง กรุณาระบุเหตุผลการแก้ไขลงใน Audit Log');
      return;
    }

    setIsSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await onSaveFeedingLog(
        {
          farmId: activePond.farmId,
          pondId: activePond.id,
          pondCode: activePond.code,
          cycleId: activeCycle.id,
          cycleCode: activeCycle.cycleCode,
          fedAt: new Date().toISOString(),
          dateStr: todayStr,
          mealIndex,
          totalMealsToday: totalMealsPerDay,
          currentAbw: effectiveAbw,
          biomassKg: calculatedBiomassKg,
          recommendedAmountKg: recommendedMealFeedKg,
          actualAmountKg: actualKg,
          checkTrayLeftoverPercent: leftoverNumber,
          checkTrayInspectionMinutes: trayTimeMinutes,
          adjustmentReason: checkTrayAdvice.adviceTh,
          manualOverrideReason: isManualOverride ? manualReason : undefined,
          autoReductionNotice: envEvaluation.action !== 'normal' ? envEvaluation.reasonTh : undefined,
          fedBy: 'ช่างเทคนิคประจำฟาร์ม',
        },
        isManualOverride ? `แก้ไขปริมาณอาหารมื้อที่ ${mealIndex} จาก ${recommendedMealFeedKg} เป็น ${actualKg} กก. เหตุผล: ${manualReason}` : undefined
      );

      setManualReason('');
      setToastMsg(`บันทึกการให้อาหารมื้อที่ ${mealIndex} สำเร็จ (${actualKg} กก.)`);
      setTimeout(() => setToastMsg(null), 3000);
      setMealIndex(prev => (prev < totalMealsPerDay ? prev + 1 : 1));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <Calculator className="w-4 h-4" />
            <h2 className="text-heading text-slate-900 font-bold">{t.feedingTitle}</h2>
          </div>
          <p className="text-caption text-slate-500">
            คำนวณชีวมวลและอาหารตามน้ำหนักตัวเฉลี่ย (ABW) พร้อมปรับจากถาดเช็คและกฎสิ่งแวดล้อม
          </p>
        </div>

        {/* Floating Pond Popover */}
        <div className="flex items-center gap-2">
          <span className="text-label text-slate-600 shrink-0">เลือกบ่อ:</span>
          <SelectPopover
            value={activePondId}
            onChange={(val) => {
              setActivePondId(val);
              const nextCycle = cycles.find(c => c.pondId === val && c.status === 'active');
              if (nextCycle?.currentAbw) {
                setInputAbw(String(nextCycle.currentAbw));
                setShowAbwPrompt(false);
              } else {
                setInputAbw('');
                setShowAbwPrompt(true);
              }
            }}
            options={pondOptions}
            buttonClassName="py-1.5 px-3 text-xs font-semibold"
            aria-label="เลือกบ่อเพื่อให้อาหาร"
          />
        </div>
      </div>

      {/* SICK SHRIMP ALERT */}
      {isFeedingDroppedConsecutive && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-title font-bold text-rose-900">
              {t.checkTraySickAlert}
            </h3>
            <p className="text-body text-rose-800">
              กุ้งกินอาหารลดลงฮวบเกิน 30% ติดต่อกัน 2 วัน เป็นสัญญาณบ่งชี้ความผิดปกติ แนะนำตรวจเช็คสุขภาพกุ้งและตับด่วน
            </p>
          </div>
        </div>
      )}

      {/* STRICT ABW REQUIREMENT: NO GUESSING */}
      {(!effectiveAbw || effectiveAbw <= 0 || showAbwPrompt) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h3 className="text-title font-bold text-amber-900">{t.mustEnterAbw}</h3>
              <p className="text-caption text-amber-800">
                ตามหลักวิชาการเพาะเลี้ยงสัตว์น้ำ ห้ามสุ่มเดาน้ำหนักกุ้งเพื่อคำนวณอาหาร กรุณาระบุน้ำหนักตัวเฉลี่ย (ABW) จากการสุ่มชั่งล่าสุด
              </p>

              <form onSubmit={handleUpdateAbwSubmit} className="flex flex-wrap items-center gap-2 pt-1">
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="100"
                    placeholder="เช่น 12.5"
                    value={inputAbw}
                    onChange={(e) => setInputAbw(e.target.value)}
                    className="saas-input w-36 font-semibold"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-caption text-slate-400">กรัม</span>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-caption shadow-xs transition"
                >
                  บันทึก ABW และเริ่มคำนวณ
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Production Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="glass-card rounded-[22px] p-5">
          <div className="flex items-center justify-between text-sm font-bold text-slate-500 mb-1">
            <span>ชีวมวล (Biomass)</span>
            <span className="text-emerald-700 font-mono font-bold">สูตรวิชาการ</span>
          </div>
          <div className="mt-1">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {calculatedBiomassKg.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-slate-500 ml-1.5">กก.</span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500 font-medium">
            = {remainingShrimp.toLocaleString()} ตัว × {effectiveAbw}g / 1,000
          </div>
        </div>

        <div className="glass-card rounded-[22px] p-5">
          <div className="flex items-center justify-between text-sm font-bold text-slate-500 mb-1">
            <span>อัตราอาหาร (% Feeding Rate)</span>
            <span className="text-[#FF7A1A] font-mono font-bold">ช่วง {rateConfig.abwMin}-{rateConfig.abwMax}g</span>
          </div>
          <div className="mt-1">
            <span className="text-3xl font-extrabold text-[#FF7A1A] font-mono">
              {appliedFeedingRate.toFixed(1)}%
            </span>
            <span className="text-sm font-bold text-slate-500 ml-1.5">ของชีวมวล</span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500 font-medium">
            {rateConfig.rateMinPercent}-{rateConfig.rateMaxPercent}% ({totalMealsPerDay} มื้อ/วัน)
          </div>
        </div>

        <div className="glass-card rounded-[22px] p-5">
          <div className="flex items-center justify-between text-sm font-bold text-slate-500 mb-1">
            <span>อาหารรวมต่อวัน (คำนวณฐาน)</span>
            <span className="text-amber-800 font-mono font-bold">{baseMealFeedKg} กก./มื้อ</span>
          </div>
          <div className="mt-1">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {baseDailyFeedKg.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-slate-500 ml-1.5">กก./วัน</span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500 font-medium">
            = {calculatedBiomassKg} กก. × {appliedFeedingRate}%
          </div>
        </div>

      </div>

      {/* Main Feeding Screen */}
      <div className="glass-card rounded-[22px] p-6 space-y-6">
        
        {/* Top: Meal Selection & Edit ABW trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-orange-100">
          <div>
            <span className="text-base font-bold text-slate-800 block mb-2">เลือกมื้อที่ให้:</span>
            <div className="flex flex-wrap gap-2.5">
              {Array.from({ length: totalMealsPerDay }).map((_, idx) => {
                const mNum = idx + 1;
                return (
                  <button
                    key={mNum}
                    type="button"
                    onClick={() => setMealIndex(mNum)}
                    className={`min-h-[48px] px-4 py-2 rounded-xl text-sm sm:text-base font-bold transition cursor-pointer active:scale-[0.97] ${
                      mealIndex === mNum
                        ? 'bg-gradient-to-r from-[#FF7A1A] to-[#FF903F] text-white shadow-md'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-orange-50/50'
                    }`}
                  >
                    มื้อที่ {mNum}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAbwPrompt(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            <Edit3 className="w-3.5 h-3.5 text-sky-600" />
            <span>แก้ไข ABW ({effectiveAbw}g)</span>
          </button>
        </div>

        {/* Section 1: Check Tray Adjustment */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <span className="text-label font-semibold block">
            {t.checkTrayTitle}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-medium text-slate-600 mb-1">
                % อาหารเหลือในถาด:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={checkTrayLeftover}
                  onChange={(e) => setCheckTrayLeftover(e.target.value)}
                  className="saas-input w-full font-bold"
                  aria-label="เปอร์เซ็นต์อาหารเหลือในถาดเช็ค"
                />
                <span className="absolute right-3.5 top-2.5 text-caption text-slate-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-caption font-medium text-slate-600 mb-1">
                เวลาที่ใช้ตรวจเช็ค (นาที):
              </label>
              <input
                type="number"
                min="30"
                max="180"
                value={trayTimeMinutes}
                onChange={(e) => setTrayTimeMinutes(parseInt(e.target.value) || 60)}
                className="saas-input w-full font-bold"
                aria-label="เวลาที่ตรวจเช็คถาดเช็ค"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-caption text-slate-700 flex items-start gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>{checkTrayAdvice.adviceTh}</span>
          </div>
        </div>

        {/* Section 2: Environmental Feed Rules */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <span className="text-label font-semibold block">
            {t.autoReductionTitle}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <label className="p-3 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center gap-2 text-caption">
              <input
                type="checkbox"
                checked={isMassMolting}
                onChange={(e) => setIsMassMolting(e.target.checked)}
                className="rounded text-amber-600"
              />
              <span>ลอกคราบหมู่ (ลด 50%)</span>
            </label>

            <label className="p-3 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center gap-2 text-caption">
              <input
                type="checkbox"
                checked={isHeavyRain}
                onChange={(e) => setIsHeavyRain(e.target.checked)}
                className="rounded text-amber-600"
              />
              <span>ฝนตกหนัก/อุณหภูมิลด (ลด 30%)</span>
            </label>

            <label className="p-3 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center gap-2 text-caption">
              <input
                type="checkbox"
                checked={isOneDayBeforeHarvest}
                onChange={(e) => setIsOneDayBeforeHarvest(e.target.checked)}
                className="rounded text-rose-600"
              />
              <span>ก่อนจับกุ้ง 1 วัน (งดอาหาร)</span>
            </label>
          </div>

          {envEvaluation.action !== 'normal' && (
            <div className="text-caption font-medium text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              {envEvaluation.reasonTh}
            </div>
          )}
        </div>

        {/* Section 3: Recommended vs Actual Fed (with requirement 9: button >=56px) */}
        <form onSubmit={handleMarkAsFed} className="space-y-4 pt-1">
          
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-caption font-semibold text-emerald-800 uppercase tracking-wider">
                {t.recommendedMealFeed}:
              </span>
              <div className="mt-1">
                <span className="text-3xl font-black text-emerald-950 font-mono">
                  {recommendedMealFeedKg}
                </span>
                <span className="text-caption font-bold text-emerald-700 ml-1.5">กก.</span>
              </div>
            </div>

            <div className="w-full sm:w-60">
              <label className="block text-caption font-semibold text-slate-700 mb-1">
                {t.actualAmountKg}:
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1000"
                  value={actualFedKg}
                  onChange={(e) => setActualFedKg(e.target.value)}
                  className="saas-input w-full min-h-[50px] text-xl font-bold"
                  aria-label="ปริมาณอาหารที่ให้จริง"
                  required
                />
                <span className="absolute right-3.5 top-3 text-caption text-slate-400">กก.</span>
              </div>
            </div>
          </div>

          {parseFloat(actualFedKg) !== recommendedMealFeedKg && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <label className="block text-caption font-semibold text-amber-900">
                ตรวจพบการแก้ไขด้วยมือ: กรุณาระบุเหตุผลเพื่อบันทึก Audit Log:
              </label>
              <input
                type="text"
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                placeholder="เช่น ชดเชยอาหารมื้อที่แล้ว / กุ้งกินดีกว่าคาด..."
                className="saas-input w-full text-caption"
                required
              />
            </div>
          )}

          {/* Large touch button >=60px for wet hands */}
          <button
            type="submit"
            disabled={isSubmitting || !activeCycle}
            className="w-full min-h-[60px] rounded-2xl text-lg font-bold text-white bg-gradient-to-r from-[#FF7A1A] to-[#FF903F] hover:from-[#E8670C] hover:to-[#FF8024] active:scale-[0.97] shadow-md flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-50"
            aria-label="บันทึกการให้อาหาร"
          >
            {isSubmitting ? (
              <span>กำลังบันทึก...</span>
            ) : (
              <>
                <Utensils className="w-6 h-6 text-white" />
                <span>ให้อาหารแล้ว (มื้อที่ {mealIndex}: {actualFedKg || recommendedMealFeedKg} กก.)</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-caption font-semibold animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Feeding History */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h3 className="text-title text-slate-900 font-semibold">
              ประวัติการให้อาหาร ({activePond?.code})
            </h3>
          </div>
          <span className="text-caption text-slate-400">
            {pondFeedLogs.length} รายการ
          </span>
        </div>

        {pondFeedLogs.length === 0 ? (
          <div className="text-center py-6 text-caption text-slate-400">
            {t.noData}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-caption">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">วันที่ / เวลา</th>
                  <th className="py-2.5 px-3">มื้อ</th>
                  <th className="py-2.5 px-3">ABW</th>
                  <th className="py-2.5 px-3">ชีวมวล</th>
                  <th className="py-2.5 px-3">แนะนำ</th>
                  <th className="py-2.5 px-3">ให้จริง</th>
                  <th className="py-2.5 px-3">เหลือถาด</th>
                  <th className="py-2.5 px-3">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {pondFeedLogs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800">{formatDate(log.fedAt, lang, era)}</span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      มื้อ {log.mealIndex}/{log.totalMealsToday}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{log.currentAbw}g</td>
                    <td className="py-2.5 px-3 font-mono">{log.biomassKg.toLocaleString()} กก.</td>
                    <td className="py-2.5 px-3 font-mono">{log.recommendedAmountKg}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-emerald-700">{log.actualAmountKg}</td>
                    <td className="py-2.5 px-3 font-mono">{log.checkTrayLeftoverPercent !== undefined ? `${log.checkTrayLeftoverPercent}%` : '-'}</td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                      {log.manualOverrideReason || log.autoReductionNotice || log.adjustmentReason || '-'}
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
