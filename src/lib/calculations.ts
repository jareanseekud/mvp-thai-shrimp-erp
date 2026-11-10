import { FeedingRateConfig, DiseaseCriteria, Treatment } from '../types';
import { DEFAULT_FEEDING_RATES } from './constants';

/**
 * Biomass (kg) = Remaining shrimp count x ABW (g) / 1000
 */
export function calculateBiomass(remainingShrimpCount: number, abwGrams: number): number {
  if (remainingShrimpCount <= 0 || abwGrams <= 0) return 0;
  return Number(((remainingShrimpCount * abwGrams) / 1000).toFixed(2));
}

/**
 * Find %FeedingRate and suggested meals per day according to ABW
 */
export function getFeedingRateConfig(abwGrams: number, customTable: FeedingRateConfig[] = DEFAULT_FEEDING_RATES): FeedingRateConfig {
  const match = customTable.find(cfg => abwGrams >= cfg.abwMin && abwGrams < cfg.abwMax);
  if (match) return match;
  // If > max configured, use highest bracket
  return customTable[customTable.length - 1];
}

/**
 * Feed per day (kg) = Biomass x %FeedingRate
 * Feed per meal (kg) = Feed per day / Number of meals
 */
export function calculateDailyFeed(biomassKg: number, ratePercent: number): number {
  if (biomassKg <= 0 || ratePercent <= 0) return 0;
  return Number(((biomassKg * ratePercent) / 100).toFixed(2));
}

export function calculateMealFeed(dailyFeedKg: number, mealsCount: number): number {
  if (dailyFeedKg <= 0 || mealsCount <= 0) return 0;
  return Number((dailyFeedKg / mealsCount).toFixed(2));
}

/**
 * Check tray logic:
 * - Leftover 0% in < 1 hr: recommend +5-10% next meal
 * - Leftover 10-20%: keep unchanged
 * - Leftover > 25%: recommend -20% + warn to check water quality & disease
 */
export interface CheckTrayAdvice {
  adjustmentPercent: number; // e.g. +7.5, 0, -20
  adviceTh: string;
  adviceEn: string;
  isWarning: boolean;
}

export function evaluateCheckTray(leftoverPercent: number, inspectionMinutes: number = 60): CheckTrayAdvice {
  if (leftoverPercent === 0 && inspectionMinutes <= 60) {
    return {
      adjustmentPercent: 7.5,
      adviceTh: 'อาหารหมดเกลี้ยงในเวลาน้อยกว่า 1 ชม. แนะนำเพิ่มอาหาร 5-10% ในมื้อถัดไป',
      adviceEn: 'Tray empty in < 1 hr. Recommend increasing feed by 5-10% next meal.',
      isWarning: false,
    };
  }
  if (leftoverPercent >= 10 && leftoverPercent <= 20) {
    return {
      adjustmentPercent: 0,
      adviceTh: 'อาหารเหลือ 10-20% อยู่ในเกณฑ์เหมาะสม คงปริมาณอาหารเดิม',
      adviceEn: '10-20% leftover. Optimal intake, keep standard feed quantity.',
      isWarning: false,
    };
  }
  if (leftoverPercent > 25) {
    return {
      adjustmentPercent: -20,
      adviceTh: 'อาหารเหลือเกิน 25%! แนะนำลดอาหารลง 20% ทันที พร้อมตรวจวัดค่าน้ำและสังเกตอาการผิดปกติ',
      adviceEn: 'Leftover exceeds 25%! Recommend reducing feed by 20% immediately and checking water & health.',
      isWarning: true,
    };
  }
  return {
    adjustmentPercent: 0,
    adviceTh: `อาหารเหลือ ${leftoverPercent}% คงปริมาณตามปกติ`,
    adviceEn: `Leftover is ${leftoverPercent}%, maintain standard portion.`,
    isWarning: false,
  };
}

/**
 * Automated Environmental Feed Reduction / Withholding Logic
 */
export interface AutoFeedRuleEvaluation {
  action: 'normal' | 'reduce' | 'withhold';
  reductionPercent: number; // 0, 30, 50, 100
  reasonTh: string;
  reasonEn: string;
}

export function evaluateEnvironmentalFeedRules(params: {
  doLevel?: number;
  isMassMolting?: boolean;
  isHeavyRainOrTempDrop?: boolean;
  isOneDayBeforeHarvest?: boolean;
}): AutoFeedRuleEvaluation {
  if (params.isOneDayBeforeHarvest) {
    return {
      action: 'withhold',
      reductionPercent: 100,
      reasonTh: 'งดอาหาร 1 วันก่อนจับกุ้ง เพื่อสุขอนามัยและเคลียร์ทางเดินอาหาร',
      reasonEn: 'Withhold all feed 1 day prior to harvest for gut clearance.',
    };
  }
  if (params.doLevel !== undefined && params.doLevel < 3.0) {
    return {
      action: 'withhold',
      reductionPercent: 100,
      reasonTh: `งดอาหาร 1 มื้อ: เนื่องจากออกซิเจนในน้ำ (DO) วิกฤตต่ำกว่า 3.0 mg/L (${params.doLevel} mg/L)`,
      reasonEn: `Skip 1 meal: Critical DO lower than 3.0 mg/L (${params.doLevel} mg/L).`,
    };
  }
  if (params.isMassMolting) {
    return {
      action: 'reduce',
      reductionPercent: 50,
      reasonTh: 'ลดอาหาร 50%: ตรวจพบการลอกคราบหมู่ กุ้งเปลือกนิ่มยังไม่กินอาหาร ป้องกันน้ำเสีย',
      reasonEn: 'Reduce feed by 50%: Mass molting observed, prevent water degradation.',
    };
  }
  if (params.isHeavyRainOrTempDrop) {
    return {
      action: 'reduce',
      reductionPercent: 30,
      reasonTh: 'ลดอาหาร 30%: สภาพอากาศฝนตกหนักหรืออุณหภูมิน้ำลดฮวบเกิน 3°C การย่อยอาหารทำงานช้าลง',
      reasonEn: 'Reduce feed by 30%: Heavy rain or sudden temp drop >3°C, shrimp metabolism slows.',
    };
  }
  return {
    action: 'normal',
    reductionPercent: 0,
    reasonTh: 'สภาวะแวดล้อมปกติ ให้อาหารตามคำนวณ',
    reasonEn: 'Normal environmental conditions, feed as calculated.',
  };
}

/**
 * Disease Symptom Matcher & Scoring (Non-AI, Deterministic)
 */
export interface DiseaseMatchResult {
  disease: DiseaseCriteria;
  matchedCount: number;
  totalSymptoms: number;
  scorePercentage: number;
}

export function scoreDiseaseSymptoms(
  selectedSymptomIds: string[],
  diseaseList: DiseaseCriteria[]
): DiseaseMatchResult[] {
  if (selectedSymptomIds.length === 0) return [];

  const results: DiseaseMatchResult[] = diseaseList.map(disease => {
    const matched = disease.symptoms.filter(symId => selectedSymptomIds.includes(symId));
    const score = (matched.length / disease.symptoms.length) * 100;
    return {
      disease,
      matchedCount: matched.length,
      totalSymptoms: disease.symptoms.length,
      scorePercentage: Math.round(score),
    };
  });

  // Filter only those with at least 1 match, sorted descending by matchedCount & score
  return results
    .filter(r => r.matchedCount > 0)
    .sort((a, b) => b.matchedCount - a.matchedCount || b.scorePercentage - a.scorePercentage);
}

/**
 * Pre-Harvest Chemical Withdrawal Period Gate
 * Checks whether any treatment given to a pond/cycle is still within its withdrawal window
 */
export interface WithdrawalGateCheck {
  canHarvest: boolean;
  activeTreatments: Treatment[];
  earliestSafeDate: string | null;
  blockedReasonTh: string | null;
  blockedReasonEn: string | null;
  daysRemaining: number;
}

export function checkHarvestWithdrawalGate(
  treatments: Treatment[],
  plannedHarvestDateStr: string = new Date().toISOString().split('T')[0]
): WithdrawalGateCheck {
  const targetDate = new Date(plannedHarvestDateStr);
  targetDate.setHours(0, 0, 0, 0);

  const activeTreatments = treatments.filter(t => {
    const safeDate = new Date(t.safeHarvestDate);
    safeDate.setHours(0, 0, 0, 0);
    return safeDate.getTime() > targetDate.getTime();
  });

  if (activeTreatments.length === 0) {
    return {
      canHarvest: true,
      activeTreatments: [],
      earliestSafeDate: null,
      blockedReasonTh: null,
      blockedReasonEn: null,
      daysRemaining: 0,
    };
  }

  // Find the latest safe date among active treatments
  let latestDate: Date = new Date(activeTreatments[0].safeHarvestDate);
  activeTreatments.forEach(t => {
    const d = new Date(t.safeHarvestDate);
    if (d.getTime() > latestDate.getTime()) {
      latestDate = d;
    }
  });

  const diffMs = latestDate.getTime() - targetDate.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const dateFormatted = latestDate.toISOString().split('T')[0];

  const drugNames = activeTreatments.map(t => t.drugName).join(', ');

  return {
    canHarvest: false,
    activeTreatments,
    earliestSafeDate: dateFormatted,
    blockedReasonTh: `ไม่อนุญาตให้จับกุ้ง! ตรวจพบสาร/ยาที่ยังไม่พ้นระยะหยุดยา (${drugNames}) ต้องรออีกอย่างน้อย ${daysRemaining} วัน จนถึง ${dateFormatted}`,
    blockedReasonEn: `Harvest strictly blocked! Found chemicals with active withdrawal period (${drugNames}). Must wait at least ${daysRemaining} more days until ${dateFormatted}`,
    daysRemaining,
  };
}

/**
 * Standard Aquaculture KPI calculations
 */
export function calculateFCR(totalFeedKg: number, totalBiomassKg: number): number {
  if (totalBiomassKg <= 0 || totalFeedKg <= 0) return 0;
  return Number((totalFeedKg / totalBiomassKg).toFixed(2));
}

export function calculateSurvivalRate(harvestCount: number, stockedCount: number): number {
  if (stockedCount <= 0) return 0;
  return Number(Math.min(100, Math.max(0, (harvestCount / stockedCount) * 100)).toFixed(1));
}

export function calculateADG(initialAbw: number, finalAbw: number, daysOfCulture: number): number {
  if (daysOfCulture <= 0) return 0;
  return Number(((finalAbw - initialAbw) / daysOfCulture).toFixed(3));
}

export function calculateStockingDensity(totalPlCount: number, pondAreaSqm: number): number {
  if (pondAreaSqm <= 0) return 0;
  return Math.round(totalPlCount / pondAreaSqm);
}
