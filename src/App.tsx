/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, addDoc 
} from 'firebase/firestore';
import { 
  Waves, Droplets, Utensils, Activity, Building2, 
  Pill, Globe2, DollarSign, Settings, Clock, Sparkles, 
  QrCode, CheckCircle2
} from 'lucide-react';

import { 
  UserRole, UserProfile, Farm, Pond, CultureCycle, WaterLog, 
  FeedingLog, Treatment, PostLarvaeLot, HarvestLot, 
  ProcessingLot, ExportLot, AuditLog, WaterStandards, 
  FeedingRateConfig, DiseaseEvent, SyncState,
  BiosecurityLog
} from './types';
import { db, testConnection, subscribeSyncState, notifySyncState } from './lib/firebase';
import { Language, CalendarEra, translations } from './lib/i18n';
import { 
  DEFAULT_WATER_STANDARDS, DEFAULT_FEEDING_RATES 
} from './lib/constants';

import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { TodayDashboard } from './components/TodayDashboard';
import { WaterQualityModule } from './components/WaterQualityModule';
import { FeedingModule } from './components/FeedingModule';
import { DiseaseCheckerModule } from './components/DiseaseCheckerModule';
import { FarmPondsModule } from './components/FarmPondsModule';
import { HatcheryModule } from './components/HatcheryModule';
import { MedicineWithdrawalModule } from './components/MedicineWithdrawalModule';
import { HarvestProcessingExportModule } from './components/HarvestProcessingExportModule';
import { PublicTraceabilityModule } from './components/PublicTraceabilityModule';
import { FinanceReportsModule } from './components/FinanceReportsModule';
import { AdminSettingsModule } from './components/AdminSettingsModule';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { FarmerTutorialModal } from './components/FarmerTutorialModal';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
// Role-based allowed navigation tabs mapping (Strict isolation - non-permitted menus are completely hidden)
const ROLE_ALLOWED_TABS: Record<UserRole, string[]> = {
  owner: ['finance', 'today', 'water', 'feeding', 'disease', 'farm', 'hatchery', 'medicine', 'traceability'],
  technician: ['today', 'water', 'feeding', 'disease'],
  hatchery: ['hatchery', 'public_trace'],
  processor: ['traceability', 'public_trace'],
  exporter: ['traceability', 'public_trace'],
  auditor: ['traceability', 'public_trace'],
  admin: ['admin', 'farm', 'today'],
  public: ['public_trace'],
};

const getHomeTabForRole = (role: UserRole): string => {
  switch (role) {
    case 'owner': return 'finance'; // owner: ภาพรวมกำไร/FCR
    case 'technician': return 'today'; // technician: หน้า "วันนี้" อย่างเดียว
    case 'hatchery': return 'hatchery'; // hatchery: สร้างล็อต PL- + QR
    case 'processor': return 'traceability'; // processor: คิวรับกุ้ง + คัดขนาด + Yield
    case 'exporter': return 'traceability'; // exporter: เช็กลิสต์ส่งออก + สร้าง EX-
    case 'auditor': return 'traceability'; // auditor: ไทม์ไลน์ย้อนกลับแบบอ่านอย่างเดียว
    case 'admin': return 'admin'; // admin: ตั้งค่าระบบ
    case 'public': return 'public_trace';
    default: return 'today';
  }
};

export default function App() {
  // Global App States
  const [lang, setLang] = useState<Language>('th');
  const [era, setEra] = useState<CalendarEra>('buddhist');
  
  // Requirement 1: First screen of the app is Login / Register screen
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [activeTab, setActiveTab] = useState<string>('finance');
  const [selectedPondId, setSelectedPondId] = useState<string>('');

  // Farmer usability states
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
  const [globalSuccessBanner, setGlobalSuccessBanner] = useState<string | null>(null);
  const [navHistory, setNavHistory] = useState<string[]>(['today']);

  const showSuccess = (msg: string) => {
    setGlobalSuccessBanner(msg);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(15);
      } catch (e) {}
    }
    setTimeout(() => setGlobalSuccessBanner(null), 3500);
  };

  const navigateToTab = (tabId: string) => {
    if (tabId !== activeTab) {
      setNavHistory(prev => [...prev, activeTab]);
      setActiveTab(tabId);
    }
  };

  const handleNavigateHome = () => {
    if (activeTab !== 'today') {
      setNavHistory(prev => [...prev, activeTab]);
      setActiveTab('today');
    }
  };

  const handleNavigateBack = () => {
    if (navHistory.length > 0) {
      const prevTab = navHistory[navHistory.length - 1];
      setNavHistory(prev => prev.slice(0, -1));
      setActiveTab(prevTab);
    } else {
      setActiveTab('today');
    }
  };

  // Keyboard Shortcuts State
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);

  // Global Keyboard Shortcut Listener (Ctrl+F1..F3 etc.)
  useGlobalKeyboardShortcuts({
    onNavigateTab: (tabId, label) => {
      navigateToTab(tabId);
      setShortcutToast(label);
      setTimeout(() => setShortcutToast(null), 2500);
    },
    onToggleShortcutsModal: () => {
      setShowShortcutsModal(prev => !prev);
    },
  });

  // Network & Sync state
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Firestore & Application Data Collections (Clean Initial State - No Demo Data)
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [cycles, setCycles] = useState<CultureCycle[]>([]);
  const [plLots, setPlLots] = useState<PostLarvaeLot[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [harvestLots, setHarvestLots] = useState<HarvestLot[]>([]);
  const [processingLots, setProcessingLots] = useState<ProcessingLot[]>([]);
  const [exportLots, setExportLots] = useState<ExportLot[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [biosecurityLogs, setBiosecurityLogs] = useState<BiosecurityLog[]>([]);
  const [standards, setStandards] = useState<WaterStandards>(DEFAULT_WATER_STANDARDS);
  const [feedingRates, setFeedingRates] = useState<FeedingRateConfig[]>(DEFAULT_FEEDING_RATES);

  const t = translations[lang];

  // Subscribe to sync state and network status
  useEffect(() => {
    const unsub = subscribeSyncState((state, online) => {
      setSyncState(state);
      setIsOnline(online);
    });

    testConnection().then(connected => {
      if (connected) {
        notifySyncState('synced');
      }
    });

    return () => unsub();
  }, []);

  // Ensure active tab is always in the allowed whitelist for current role
  useEffect(() => {
    const allowed = ROLE_ALLOWED_TABS[currentRole] || ['today'];
    if (!allowed.includes(activeTab)) {
      setActiveTab(getHomeTabForRole(currentRole));
    }
  }, [currentRole, activeTab]);

  // Sync role and landing tab when user authenticates
  const handleAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setActiveTab(getHomeTabForRole(user.role));
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    setActiveTab(getHomeTabForRole(newRole));
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Helper to add audit logs
  const logAuditAction = useCallback(async (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      action,
      details,
      userId: currentUser?.uid || currentRole,
      userName: currentUser?.displayName || `ผู้ใช้ (${currentRole.toUpperCase()})`,
      userRole: currentRole,
      farmId: selectedFarmId,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);

    try {
      await addDoc(collection(db, 'audit_logs'), newLog);
    } catch (e) {
      // Offline fallback
    }
  }, [currentUser, currentRole, selectedFarmId]);

  // CRUD Handlers
  const handleSaveWaterLog = async (logData: Omit<WaterLog, 'id'>) => {
    notifySyncState('syncing');
    const newLog: WaterLog = { ...logData, id: `wlog-${Date.now()}` };
    setWaterLogs(prev => [newLog, ...prev]);
    try { await addDoc(collection(db, 'water_logs'), newLog); } catch (e) {}
    await logAuditAction('RECORD_WATER_LOG', `บันทึกค่าน้ำ ${logData.pondCode}: DO=${logData.dissolvedOxygen}, pH=${logData.ph}`);
    notifySyncState(isOnline ? 'synced' : 'offline');
    showSuccess(`บันทึกค่าน้ำ ${logData.pondCode} เรียบร้อย ข้อมูลปลอดภัยแล้ว`);
  };

  const handleSaveFeedingLog = async (logData: Omit<FeedingLog, 'id'>, auditReason?: string) => {
    notifySyncState('syncing');
    const newLog: FeedingLog = { ...logData, id: `flog-${Date.now()}` };
    setFeedingLogs(prev => [newLog, ...prev]);

    setCycles(prev => prev.map(c => {
      if (c.id === logData.cycleId) {
        return {
          ...c,
          cumulativeFeedKg: (c.cumulativeFeedKg || 0) + logData.actualAmountKg,
          currentAbw: logData.currentAbw,
        };
      }
      return c;
    }));

    try { await addDoc(collection(db, 'feeding_logs'), newLog); } catch (e) {}

    if (auditReason) {
      await logAuditAction('FEED_MANUAL_OVERRIDE', auditReason);
    } else {
      await logAuditAction('RECORD_FEEDING', `บันทึกให้อาหาร ${logData.pondCode} มื้อ ${logData.mealIndex}: ${logData.actualAmountKg} กก.`);
    }
    notifySyncState(isOnline ? 'synced' : 'offline');
    showSuccess(`บันทึกการให้อาหาร ${logData.pondCode} มื้อที่ ${logData.mealIndex} เรียบร้อย`);
  };

  const handleUpdateAbw = async (cycleId: string, newAbw: number) => {
    notifySyncState('syncing');
    setCycles(prev => prev.map(c => {
      if (c.id === cycleId) {
        const remaining = Math.round(c.stockingCount * ((c.estimatedSurvivalRate || 85) / 100));
        return {
          ...c,
          currentAbw: newAbw,
          lastAbwDate: new Date().toISOString().split('T')[0],
          currentBiomassKg: Number(((remaining * newAbw) / 1000).toFixed(1)),
        };
      }
      return c;
    }));
    await logAuditAction('UPDATE_ABW', `อัปเดตน้ำหนักเฉลี่ยกุ้ง (ABW) เป็น ${newAbw} กรัม`);
    notifySyncState(isOnline ? 'synced' : 'offline');
    showSuccess(`อัปเดตน้ำหนักกุ้งเฉลี่ย (ABW) ${newAbw} กรัม สำเร็จ`);
  };

  const handleSaveDiseaseEvent = async (eventData: Omit<DiseaseEvent, 'id'>) => {
    notifySyncState('syncing');
    const newEvent: DiseaseEvent = { ...eventData, id: `dis-${Date.now()}` };
    try { await addDoc(collection(db, 'disease_events'), newEvent); } catch (e) {}
    await logAuditAction('DISEASE_SYMPTOM_CHECK', `ตรวจเช็คอาการ ${eventData.pondCode}`);
    notifySyncState(isOnline ? 'synced' : 'offline');
    showSuccess(`บันทึกตรวจเช็คอาการบ่อ ${eventData.pondCode} เรียบร้อย`);
  };

  const handleSaveBiosecurityLog = async (logData: Omit<BiosecurityLog, 'id'>) => {
    notifySyncState('syncing');
    const newLog: BiosecurityLog = { ...logData, id: `bio-${Date.now()}` };
    setBiosecurityLogs(prev => [newLog, ...prev]);
    try { await addDoc(collection(db, 'biosecurity_logs'), newLog); } catch (e) {}
    await logAuditAction(
      'RECORD_BIOSECURITY_LOG', 
      `บันทึกสุขอนามัย ${logData.pondCode || 'ทั้งฟาร์ม'} คะแนน ${logData.complianceScorePercent}% (ตรวจโดย ${logData.inspectorName})`
    );
    notifySyncState(isOnline ? 'synced' : 'offline');
    showSuccess(`บันทึกเช็คชีวอนามัย (คะแนน ${logData.complianceScorePercent}%) เรียบร้อย`);
  };

  const handleAddPond = async (pondData: Omit<Pond, 'id'>) => {
    notifySyncState('syncing');
    const newPond: Pond = { ...pondData, id: `pond-${Date.now()}` };
    setPonds(prev => [...prev, newPond]);
    try { await addDoc(collection(db, 'ponds'), newPond); } catch (e) {}
    await logAuditAction('ADD_POND', `เพิ่มบ่อใหม่ ${pondData.code}`);
    notifySyncState(isOnline ? 'synced' : 'offline');
    showSuccess(`เพิ่มบ่อ ${pondData.code} สำเร็จ`);
  };

  const handleStartCycle = async (cycleData: Omit<CultureCycle, 'id'>) => {
    notifySyncState('syncing');
    const newCycle: CultureCycle = { ...cycleData, id: `cycle-${Date.now()}` };
    setCycles(prev => [...prev, newCycle]);
    setPonds(prev => prev.map(p => p.id === cycleData.pondId ? { ...p, status: 'active', currentCycleId: newCycle.id } : p));
    try { await addDoc(collection(db, 'cycles'), newCycle); } catch (e) {}
    await logAuditAction('START_CYCLE', `เปิดรอบเลี้ยงใหม่ ${newCycle.cycleCode} ที่บ่อ ${cycleData.pondCode}`);
    notifySyncState(isOnline ? 'synced' : 'offline');
    showSuccess(`เปิดรอบเลี้ยงใหม่ ${newCycle.cycleCode} สำเร็จ`);
  };

  const handleCloseCycle = async (cycleId: string, reason: string) => {
    notifySyncState('syncing');
    const closedAt = new Date().toISOString();
    setCycles(prev => prev.map(c => {
      if (c.id === cycleId) {
        return { ...c, status: 'closed', closedAt, closeReason: reason, closedBy: currentRole };
      }
      return c;
    }));
    const targetCycle = cycles.find(c => c.id === cycleId);
    if (targetCycle) {
      setPonds(prev => prev.map(p => p.id === targetCycle.pondId ? { ...p, status: 'harvested', currentCycleId: null } : p));
    }
    await logAuditAction('CLOSE_CYCLE', `ปิดรอบเลี้ยง ${targetCycle?.cycleCode || cycleId} เหตุผล: ${reason}`);
    notifySyncState(isOnline ? 'synced' : 'offline');
  };

  const handleAddPlLot = async (lotData: Omit<PostLarvaeLot, 'id'>) => {
    notifySyncState('syncing');
    const newLot: PostLarvaeLot = { ...lotData, id: `pl-${Date.now()}` };
    setPlLots(prev => [newLot, ...prev]);
    try { await addDoc(collection(db, 'pl_lots'), newLot); } catch (e) {}
    await logAuditAction('REGISTER_PL_LOT', `ลงทะเบียนล็อตลูกกุ้ง ${newLot.lotCode}`);
    notifySyncState(isOnline ? 'synced' : 'offline');
  };

  const handleAddTreatment = async (treatmentData: Omit<Treatment, 'id'>) => {
    notifySyncState('syncing');
    const newTreatment: Treatment = { ...treatmentData, id: `treat-${Date.now()}` };
    setTreatments(prev => [newTreatment, ...prev]);
    try { await addDoc(collection(db, 'treatments'), newTreatment); } catch (e) {}
    await logAuditAction('RECORD_TREATMENT', `ให้ยา/สาร ${newTreatment.drugName} บ่อ ${treatmentData.pondCode}`);
    notifySyncState(isOnline ? 'synced' : 'offline');
  };

  const handleCreateHarvestLot = async (harvestData: Omit<HarvestLot, 'id'>) => {
    notifySyncState('syncing');
    const newHarvest: HarvestLot = { ...harvestData, id: `hv-${Date.now()}` };
    setHarvestLots(prev => [newHarvest, ...prev]);
    try { await addDoc(collection(db, 'harvest_lots'), newHarvest); } catch (e) {}
    await logAuditAction('CREATE_HARVEST_LOT', `สร้างล็อตจับกุ้ง ${newHarvest.lotCode}`);
    notifySyncState(isOnline ? 'synced' : 'offline');
  };

  const handleCreateProcessingLot = async (prData: Omit<ProcessingLot, 'id'>) => {
    notifySyncState('syncing');
    const newPr: ProcessingLot = { ...prData, id: `pr-${Date.now()}` };
    setProcessingLots(prev => [newPr, ...prev]);
    try { await addDoc(collection(db, 'processing_lots'), newPr); } catch (e) {}
    await logAuditAction('CREATE_PROCESSING_LOT', `โรงงานแปรรูปล็อต ${newPr.lotCode}`);
    notifySyncState(isOnline ? 'synced' : 'offline');
  };

  const handleCreateExportLot = async (exData: Omit<ExportLot, 'id'>) => {
    notifySyncState('syncing');
    const newEx: ExportLot = { ...exData, id: `ex-${Date.now()}` };
    setExportLots(prev => [newEx, ...prev]);
    try { await addDoc(collection(db, 'export_lots'), newEx); } catch (e) {}
    await logAuditAction('CREATE_EXPORT_LOT', `สร้างล็อตส่งออก ${newEx.lotCode}`);
    notifySyncState(isOnline ? 'synced' : 'offline');
  };

  const handleUpdateStandards = async (newStandards: WaterStandards) => {
    setStandards(newStandards);
    await logAuditAction('UPDATE_STANDARDS', 'ปรับปรุงเกณฑ์ค่าน้ำมาตรฐาน');
  };

  const handleUpdateFeedingRates = async (newRates: FeedingRateConfig[]) => {
    setFeedingRates(newRates);
    await logAuditAction('UPDATE_FEEDING_RATES', 'ปรับปรุงตารางอัตราการกินอาหาร');
  };

  // Check for recent biosecurity score < 70% within the last 24 hours (Hook unconditionally at top)
  const recentLowBiosecurityLog = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return biosecurityLogs.find(log => {
      const logTime = new Date(log.inspectedAt).getTime();
      const isWithin24Hours = !isNaN(logTime) && (now - logTime) <= oneDayMs && (now - logTime) >= 0;
      return isWithin24Hours && log.complianceScorePercent < 70;
    });
  }, [biosecurityLogs]);

  const hasBiosecurityAlert = Boolean(recentLowBiosecurityLog);

  // Navigation tabs definition - strictly filtered by role (irrelevant menus are completely hidden)
  const tabs = useMemo(() => {
    const all = [
      { id: 'today', label: t.tabToday, icon: Clock, badge: undefined, alert: false, alertTooltip: undefined },
      { id: 'water', label: t.tabWater, icon: Droplets, badge: 'F5/F9', alert: false, alertTooltip: undefined },
      { id: 'feeding', label: t.tabFeeding, icon: Utensils, badge: 'F6', alert: false, alertTooltip: undefined },
      { 
        id: 'disease', 
        label: t.tabDisease, 
        icon: Activity, 
        badge: hasBiosecurityAlert ? '<70% เตือน' : 'F8',
        alert: hasBiosecurityAlert,
        alertTooltip: recentLowBiosecurityLog
          ? `เตือนชีวอนามัย: ${recentLowBiosecurityLog.pondCode || 'ฟาร์ม'} ได้คะแนน ${recentLowBiosecurityLog.complianceScorePercent}% (ต่ำกว่า 70% ใน 24 ชม.)`
          : undefined
      },
      { id: 'farm', label: t.tabFarmPonds, icon: Building2, badge: 'CC-', alert: false, alertTooltip: undefined },
      { id: 'hatchery', label: t.tabHatchery, icon: Sparkles, badge: 'PL-', alert: false, alertTooltip: undefined },
      { id: 'medicine', label: t.tabMedicine, icon: Pill, badge: 'Gate', alert: false, alertTooltip: undefined },
      { id: 'traceability', label: t.tabTraceability, icon: Globe2, badge: 'EX-', alert: false, alertTooltip: undefined },
      { id: 'public_trace', label: 'Public Trace', icon: QrCode, badge: 'QR', alert: false, alertTooltip: undefined },
      { id: 'finance', label: t.tabFinance, icon: DollarSign, badge: 'KPI', alert: false, alertTooltip: undefined },
      { id: 'admin', label: t.tabAdmin, icon: Settings, badge: undefined, alert: false, alertTooltip: undefined },
    ];
    const allowed = ROLE_ALLOWED_TABS[currentRole] || ['today'];
    return all.filter(tab => allowed.includes(tab.id));
  }, [t, hasBiosecurityAlert, recentLowBiosecurityLog, currentRole]);

  // IF NOT AUTHENTICATED: Requirement 1 mandates AuthScreen as the entry screen (AFTER all hooks)
  if (!currentUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} lang={lang} />;
  }

  return (
    <div className={`min-h-screen bg-[#FFF9F4] text-slate-900 flex flex-col font-sans antialiased ${reduceMotion ? 'reduce-motion' : ''}`}>
      
      {/* Non-blocking Global Top Success Banner */}
      {globalSuccessBanner && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-[#16A34A] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-300 font-bold text-lg animate-in slide-in-from-top-3 duration-200"
        >
          <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
          <span>{globalSuccessBanner}</span>
        </aside>
      )}

      {/* Top Header with Home, Back, Tutorial, Reduce Motion & Role Popover */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        lang={lang}
        onLangChange={setLang}
        era={era}
        onEraChange={setEra}
        syncState={syncState}
        isOnline={isOnline}
        farms={farms}
        selectedFarmId={selectedFarmId}
        onFarmChange={setSelectedFarmId}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        onNavigateHome={handleNavigateHome}
        onNavigateBack={handleNavigateBack}
        onOpenTutorial={() => setShowTutorialModal(true)}
        reduceMotion={reduceMotion}
        onToggleReduceMotion={() => setReduceMotion(prev => !prev)}
      />

      {/* Main Tab Navigation Bar with Orange #FF7A1A Theme & Large Touch Targets */}
      <nav aria-label="เมนูหลัก" className="bg-white/85 backdrop-blur-md border-b border-[#FF7A1A]/20 overflow-x-auto shadow-xs sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center gap-2 py-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isAlert = tab.alert;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => navigateToTab(tab.id)}
                title={tab.alertTooltip}
                className={`relative flex items-center gap-2.5 px-4 py-2.5 min-h-[46px] rounded-2xl text-[15px] font-bold transition-all duration-150 whitespace-nowrap cursor-pointer active:scale-[0.97] ${
                  isActive
                    ? isAlert
                      ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300'
                      : 'bg-gradient-to-r from-[#FF7A1A] to-[#FF903F] text-white shadow-md ring-1 ring-[#FF7A1A]/30'
                    : isAlert
                    ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 shadow-2xs'
                    : 'text-slate-700 hover:text-[#FF7A1A] hover:bg-orange-50/70'
                }`}
              >
                {/* Visual Alert Ping indicator */}
                {isAlert && (
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                  </span>
                )}
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isAlert ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
                    isAlert
                      ? isActive
                        ? 'bg-white text-rose-700 font-extrabold animate-pulse'
                        : 'bg-rose-600 text-white font-extrabold animate-pulse shadow-xs'
                      : isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        
        {/* Tab 1: Today Dashboard */}
        {activeTab === 'today' && (
          <TodayDashboard
            ponds={ponds}
            cycles={cycles}
            waterLogs={waterLogs}
            feedingLogs={feedingLogs}
            treatments={treatments}
            lang={lang}
            era={era}
            onNavigateTab={(tab, pondId) => {
              if (pondId) setSelectedPondId(pondId);
              setActiveTab(tab);
            }}
          />
        )}

        {/* Tab 2: Water Quality (F5 + F9) */}
        {activeTab === 'water' && (
          <WaterQualityModule
            ponds={ponds}
            cycles={cycles}
            waterLogs={waterLogs}
            feedingLogs={feedingLogs}
            standards={standards}
            selectedPondId={selectedPondId}
            onSaveWaterLog={handleSaveWaterLog}
            lang={lang}
            era={era}
          />
        )}

        {/* Tab 3: Feeding Calculation (F6) */}
        {activeTab === 'feeding' && (
          <FeedingModule
            ponds={ponds}
            cycles={cycles}
            feedingLogs={feedingLogs}
            waterLogs={waterLogs}
            customFeedingRates={feedingRates}
            selectedPondId={selectedPondId}
            onSaveFeedingLog={handleSaveFeedingLog}
            onUpdateAbw={handleUpdateAbw}
            lang={lang}
            era={era}
          />
        )}

        {/* Tab 4: Disease Checker (F8) & Biosecurity Protocol */}
        {activeTab === 'disease' && (
          <DiseaseCheckerModule
            ponds={ponds}
            cycles={cycles}
            selectedPondId={selectedPondId}
            onSaveDiseaseEvent={handleSaveDiseaseEvent}
            biosecurityLogs={biosecurityLogs}
            onSaveBiosecurityLog={handleSaveBiosecurityLog}
            lang={lang}
            era={era}
          />
        )}

        {/* Tab 5: Farm, Ponds & Culture Cycles */}
        {activeTab === 'farm' && (
          <FarmPondsModule
            farms={farms}
            ponds={ponds}
            cycles={cycles}
            plLots={plLots}
            currentRole={currentRole}
            selectedFarmId={selectedFarmId}
            onAddPond={handleAddPond}
            onStartCycle={handleStartCycle}
            onCloseCycle={handleCloseCycle}
            lang={lang}
            era={era}
          />
        )}

        {/* Tab 6: Hatchery & Stocking */}
        {activeTab === 'hatchery' && (
          <HatcheryModule
            plLots={plLots}
            ponds={ponds}
            cycles={cycles}
            currentRole={currentRole}
            selectedFarmId={selectedFarmId}
            onAddPlLot={handleAddPlLot}
            lang={lang}
            era={era}
          />
        )}

        {/* Tab 7: Medicine & Pre-Harvest Safety Gate */}
        {activeTab === 'medicine' && (
          <MedicineWithdrawalModule
            ponds={ponds}
            cycles={cycles}
            treatments={treatments}
            currentRole={currentRole}
            selectedFarmId={selectedFarmId}
            onAddTreatment={handleAddTreatment}
            onCreateHarvestLot={handleCreateHarvestLot}
            lang={lang}
            era={era}
          />
        )}

        {/* Tab 8: Processing, Export & Traceability Timeline */}
        {activeTab === 'traceability' && (
          <HarvestProcessingExportModule
            harvestLots={harvestLots}
            processingLots={processingLots}
            exportLots={exportLots}
            plLots={plLots}
            cycles={cycles}
            currentRole={currentRole}
            onCreateProcessingLot={handleCreateProcessingLot}
            onCreateExportLot={handleCreateExportLot}
            lang={lang}
            era={era}
          />
        )}

        {/* Tab 9: Public QR Traceability (No Login Required) */}
        {activeTab === 'public_trace' && (
          <PublicTraceabilityModule
            farms={farms}
            harvestLots={harvestLots}
            processingLots={processingLots}
            exportLots={exportLots}
            plLots={plLots}
            lang={lang}
            era={era}
          />
        )}

        {/* Tab 10: Financial & Reports */}
        {activeTab === 'finance' && (
          <FinanceReportsModule
            ponds={ponds}
            cycles={cycles}
            feedingLogs={feedingLogs}
            harvestLots={harvestLots}
            currentRole={currentRole}
            selectedFarmId={selectedFarmId}
            lang={lang}
            era={era}
          />
        )}

        {/* Tab 11: Admin Settings & Audit Log */}
        {activeTab === 'admin' && (
          <AdminSettingsModule
            standards={standards}
            onUpdateStandards={handleUpdateStandards}
            feedingRates={feedingRates}
            onUpdateFeedingRates={handleUpdateFeedingRates}
            auditLogs={auditLogs}
            currentRole={currentRole}
            selectedFarmId={selectedFarmId}
            lang={lang}
            era={era}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-caption text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <Waves className="w-4 h-4 text-sky-600" />
            <span>กุ้งไทยครบวงจร MVP — ระบบเพาะเลี้ยงและการตรวจสอบย้อนกลับมาตรฐานสากล</span>
          </div>
          <div className="flex items-center gap-3">
            <span>PL- → CC- → HV- → PR- → EX-</span>
            <span>•</span>
            <span>Offline-First (Firestore Persistence)</span>
          </div>
        </div>
      </footer>

      {/* Global Shortcut Notification Toast */}
      {shortcutToast && (
        <div 
          role="status" 
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700/50 backdrop-blur-md flex items-center gap-2.5 text-caption font-medium animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>{shortcutToast}</span>
        </div>
      )}

      {/* Keyboard Shortcuts Guide Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        lang={lang}
      />

      {/* 3-Step Interactive Tutorial for Farmers */}
      <FarmerTutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
      />

    </div>
  );
}

