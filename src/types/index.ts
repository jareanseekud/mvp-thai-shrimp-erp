export type UserRole = 
  | 'owner' 
  | 'technician' 
  | 'hatchery' 
  | 'processor' 
  | 'exporter' 
  | 'auditor' 
  | 'admin' 
  | 'public';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  farmId?: string;
  createdAt?: string;
}

export interface Farm {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  province: string;
  district: string;
  subdistrict: string;
  standardCertifications: string[]; // e.g. GAP, ASC, BAP
  createdAt: string;
}

export interface Pond {
  id: string;
  farmId: string;
  code: string; // e.g. P1, P2
  name: string;
  areaSqm: number; // in square meters
  depthMeters: number;
  currentCycleId?: string | null;
  status: 'idle' | 'preparing' | 'active' | 'harvested';
  notes?: string;
}

export interface CultureCycle {
  id: string;
  cycleCode: string; // CC-26-P01-01
  farmId: string;
  pondId: string;
  pondCode: string;
  plLotId: string; // PL- lot code
  stockingDate: string; // ISO string
  stockingCount: number;
  stockingDensity: number; // PL / sq.m.
  currentAbw: number; // Average Body Weight in grams
  lastAbwDate?: string;
  estimatedSurvivalRate: number; // percentage e.g. 85
  currentBiomassKg: number;
  cumulativeFeedKg: number;
  status: 'preparing' | 'active' | 'closed';
  closedAt?: string;
  closeReason?: string;
  closedBy?: string;
}

export type WaterPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface WaterLog {
  id: string;
  farmId: string;
  pondId: string;
  pondCode: string;
  cycleId: string;
  cycleCode: string;
  recordedAt: string; // ISO
  dateStr: string; // YYYY-MM-DD
  period: WaterPeriod;
  dissolvedOxygen: number; // mg/L (ppm)
  ph: number;
  salinity: number; // ppt
  ammonia: number; // TAN mg/L
  nitrite: number; // NO2- mg/L
  alkalinity: number; // mg/L CaCO3
  temperature: number; // °C
  warnings: string[];
  confirmedOutOfRange: boolean;
  notes?: string;
  recordedBy: string;
}

export interface WaterStandards {
  doOptimalMin: number; // 5.0
  doOptimalMax: number; // 8.0
  doAlertRed: number; // 3.5
  phOptimalMin: number; // 7.5
  phOptimalMax: number; // 8.5
  phAlertLow: number; // 7.0
  phAlertHigh: number; // 9.0
  salinityOptimalMin: number; // 10
  salinityOptimalMax: number; // 25
  salinityMaxDailyChange: number; // 3
  tempOptimalMin: number; // 28
  tempOptimalMax: number; // 32
  tempAlertLow: number; // 25
  tempAlertHigh: number; // 34
  ammoniaAlertRed: number; // 1.0
  nitriteAlert: number; // 1.0
  alkalinityOptimalMin: number; // 120
  alkalinityOptimalMax: number; // 200
  alkalinityAlertRed: number; // 80
}

export interface FeedingRateConfig {
  abwMin: number;
  abwMax: number;
  rateMinPercent: number;
  rateMaxPercent: number;
  defaultMeals: number;
}

export interface FeedingLog {
  id: string;
  farmId: string;
  pondId: string;
  pondCode: string;
  cycleId: string;
  cycleCode: string;
  fedAt: string; // ISO
  dateStr: string; // YYYY-MM-DD
  mealIndex: number; // 1..6
  totalMealsToday: number;
  currentAbw: number;
  biomassKg: number;
  recommendedAmountKg: number;
  actualAmountKg: number;
  checkTrayLeftoverPercent?: number; // 0..100
  checkTrayInspectionMinutes?: number; // e.g. 60
  adjustmentReason?: string;
  manualOverrideReason?: string;
  autoReductionNotice?: string;
  fedBy: string;
}

export interface DiseaseCriteria {
  id: string;
  nameTh: string;
  nameEn: string;
  code: 'EMS' | 'EHP' | 'WSSV' | 'YHV' | 'SOFT_SHELL';
  descriptionTh: string;
  descriptionEn: string;
  symptoms: string[];
  isolationStepsTh: string[];
  isolationStepsEn: string[];
}

export interface DiseaseEvent {
  id: string;
  farmId: string;
  pondId: string;
  pondCode: string;
  cycleId: string;
  cycleCode: string;
  checkedAt: string;
  selectedSymptoms: string[];
  matchedDiseases: {
    diseaseCode: string;
    diseaseName: string;
    score: number;
    matchPercentage: number;
  }[];
  isolationActionsTaken: string;
  recordedBy: string;
}

export interface BiosecurityChecklistItem {
  id: string;
  category: 'personnel' | 'equipment' | 'water_intake' | 'vector_control' | 'visitors' | 'feed_dead_disposal';
  titleTh: string;
  titleEn: string;
  descriptionTh: string;
  descriptionEn: string;
  critical: boolean;
}

export interface BiosecurityLog {
  id: string;
  farmId: string;
  pondId?: string;
  pondCode?: string;
  cycleId?: string;
  cycleCode?: string;
  inspectedAt: string; // ISO
  dateStr: string; // YYYY-MM-DD
  shift: 'morning' | 'afternoon' | 'routine';
  inspectorName: string;
  inspectorRole: string;
  footbathRefreshed: boolean;
  sanitizerUsed: 'chlorine' | 'potassium_permanganate' | 'iodine' | 'bkc' | 'lime' | 'alcohol' | 'other';
  sanitizerPpm?: number;
  checklistStatus: Record<string, 'pass' | 'fail' | 'na'>;
  passedCount: number;
  totalChecked: number;
  complianceScorePercent: number; // 0 - 100
  carrierVectorsObserved: {
    crabObserved: boolean;
    birdsObserved: boolean;
    foreignFishObserved: boolean;
    deadShrimpFound: boolean;
    deadShrimpCount?: number;
    disposalMethod?: 'burial_lime' | 'incineration' | 'none';
  };
  correctiveActions?: string;
  notes?: string;
}

export interface ExpertContact {
  id: string;
  name: string;
  title: string;
  organization: string;
  phone: string;
  province: string;
  notes?: string;
}

export interface DrugConfig {
  id: string;
  name: string;
  genericName: string;
  type: 'antibiotic' | 'disinfectant' | 'probiotic' | 'mineral' | 'other';
  standardWithdrawalDays: number;
  indicationTh: string;
  indicationEn: string;
}

export interface Treatment {
  id: string;
  farmId: string;
  pondId: string;
  pondCode: string;
  cycleId: string;
  cycleCode: string;
  drugId: string;
  drugName: string;
  dose: string;
  treatedAt: string; // ISO
  withdrawalDays: number;
  safeHarvestDate: string; // ISO YYYY-MM-DD
  reason: string;
  recordedBy: string;
}

export interface PostLarvaeLot {
  id: string;
  lotCode: string; // PL-26-H01-001
  hatcheryName: string;
  hatcheryCode: string;
  stage: string; // PL-10, PL-12
  pcrResult: 'not_detected' | 'detected' | 'not_tested';
  pcrCertNumber: string;
  quantity: number;
  receivedDate: string;
  farmId: string;
  acceptanceSlipNumber: string;
  survivalRateEstimated?: number;
  notes?: string;
}

export interface HarvestLot {
  id: string;
  lotCode: string; // HV-26-P01-001
  farmId: string;
  farmName: string;
  pondId: string;
  pondCode: string;
  cycleId: string;
  cycleCode: string;
  plLotCode: string;
  harvestDate: string; // ISO
  totalWeightKg: number;
  averageSizePcsPerKg: number;
  withdrawalPassed: boolean;
  withdrawalVerificationNote: string;
  status: 'harvested' | 'delivered' | 'processed';
  destinationProcessor?: string;
}

export interface ProcessingLot {
  id: string;
  lotCode: string; // PR-26-FAC-001
  harvestLotCode: string;
  processorName: string;
  facilityCode: string;
  receivedWeightKg: number;
  finishedWeightKg: number;
  yieldPercent: number;
  sizeGrade: string; // e.g. 20/30, 30/40, 40/50 pcs/kg
  productType: string; // Head-on Shell-on (HOSO), Headless (HLSO), Peeled Deveined (PD)
  processedDate: string;
  notes?: string;
}

export interface ExportLot {
  id: string;
  lotCode: string; // EX-26-SHIP-001
  processingLotCodes: string[];
  exporterName: string;
  destinationMarket: 'US' | 'EU' | 'JP' | 'CN' | 'ASEAN';
  marketCompliancePassed: boolean;
  checklistResults: {
    checkId: string;
    title: string;
    passed: boolean;
  }[];
  shipmentDate: string;
  containerNumber: string;
  status: 'prepared' | 'inspected' | 'shipped';
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  farmId?: string;
  timestamp: string;
}

export interface FarmInvite {
  id: string;
  farmId: string;
  farmName: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface UserConsent {
  id: string;
  userId: string;
  farmId: string;
  publicTraceabilityGranted: boolean;
  financialMetricsSharedWithAuditor: boolean;
  updatedAt: string;
}

export type SyncState = 'offline' | 'syncing' | 'synced';
