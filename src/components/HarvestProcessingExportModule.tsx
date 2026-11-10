import React, { useState } from 'react';
import { 
  Truck, Factory, Globe2, Search, ArrowRight, ShieldCheck, 
  AlertTriangle, RefreshCw, Layers, CheckCircle2, QrCode, Sparkles
} from 'lucide-react';
import { 
  HarvestLot, ProcessingLot, ExportLot, PostLarvaeLot, CultureCycle, UserRole 
} from '../types';
import { Language, CalendarEra, translations, formatDate } from '../lib/i18n';
import { EXPORT_MARKET_CHECKLISTS } from '../lib/constants';

interface HarvestProcessingExportModuleProps {
  harvestLots: HarvestLot[];
  processingLots: ProcessingLot[];
  exportLots: ExportLot[];
  plLots: PostLarvaeLot[];
  cycles: CultureCycle[];
  currentRole: UserRole;
  onCreateProcessingLot: (lot: Omit<ProcessingLot, 'id'>) => Promise<void>;
  onCreateExportLot: (lot: Omit<ExportLot, 'id'>) => Promise<void>;
  lang: Language;
  era: CalendarEra;
}

export const HarvestProcessingExportModule: React.FC<HarvestProcessingExportModuleProps> = ({
  harvestLots,
  processingLots,
  exportLots,
  plLots,
  cycles,
  currentRole,
  onCreateProcessingLot,
  onCreateExportLot,
  lang,
  era,
}) => {
  const t = translations[lang];

  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'processing' | 'export' | 'recall'>('timeline');

  // Search Lot in Timeline
  const [searchLotCode, setSearchLotCode] = useState<string>(
    exportLots[0]?.lotCode || processingLots[0]?.lotCode || harvestLots[0]?.lotCode || ''
  );

  // Form: New Processing Lot (PR-)
  const [selectedHarvestLotCode, setSelectedHarvestLotCode] = useState<string>(harvestLots[0]?.lotCode || '');
  const [processorName, setProcessorName] = useState('โรงงานซีฟู้ดแปรรูป สุราษฎร์มารีน จำกัด');
  const [facilityCode, setFacilityCode] = useState('TH-EST-1049');
  const [receivedWeight, setReceivedWeight] = useState('2500');
  const [finishedWeight, setFinishedWeight] = useState('2100');
  const [sizeGrade, setSizeGrade] = useState('30/40 pcs/kg');
  const [productType, setProductType] = useState('กุ้งต้มแช่เยือกแข็ง (Cooked Frozen HOSO)');

  // Form: New Export Lot (EX-)
  const [selectedPrLotCode, setSelectedPrLotCode] = useState<string>(processingLots[0]?.lotCode || '');
  const [exporterName, setExporterName] = useState('บริษัท ไทยยูเนียนซีฟู้ด เอ็กซ์พอร์ต จำกัด');
  const [destinationMarket, setDestinationMarket] = useState<'US' | 'EU' | 'JP' | 'CN' | 'ASEAN'>('US');
  const [containerNumber, setContainerNumber] = useState('TGHU-992301-4');
  const [checklistResults, setChecklistResults] = useState<{ checkId: string; title: string; passed: boolean }[]>([]);

  // Form: Recall Simulator
  const [recallSearchQuery, setRecallSearchQuery] = useState<string>('PL-26-H01-001');

  // Yield calculation
  const calculatedYield = React.useMemo(() => {
    const recv = parseFloat(receivedWeight) || 0;
    const fin = parseFloat(finishedWeight) || 0;
    if (recv <= 0) return 0;
    return Number(((fin / recv) * 100).toFixed(1));
  }, [receivedWeight, finishedWeight]);

  // Update checklist when market changes
  React.useEffect(() => {
    const list = EXPORT_MARKET_CHECKLISTS[destinationMarket] || [];
    setChecklistResults(list.map(c => ({ ...c, passed: true })));
  }, [destinationMarket]);

  const toggleChecklistItem = (checkId: string) => {
    setChecklistResults(prev => prev.map(c => c.checkId === checkId ? { ...c, passed: !c.passed } : c));
  };

  // Generate unique codes
  const generatePrLotCode = () => {
    const yearShort = new Date().getFullYear().toString().slice(-2);
    const count = processingLots.length + 1;
    return `PR-${yearShort}-FAC-${String(count).padStart(3, '0')}`;
  };

  const generateExLotCode = () => {
    const yearShort = new Date().getFullYear().toString().slice(-2);
    const count = exportLots.length + 1;
    return `EX-${yearShort}-SHIP-${String(count).padStart(3, '0')}`;
  };

  // Timeline Traceability Engine: Traces backward from any input code
  const traceChain = React.useMemo(() => {
    const query = searchLotCode.trim().toUpperCase();
    if (!query) return null;

    let exMatch = exportLots.find(e => e.lotCode.toUpperCase() === query);
    let prMatch: ProcessingLot | undefined;
    let hvMatch: HarvestLot | undefined;
    let ccMatch: CultureCycle | undefined;
    let plMatch: PostLarvaeLot | undefined;

    if (exMatch) {
      const prCode = exMatch.processingLotCodes[0];
      prMatch = processingLots.find(p => p.lotCode === prCode);
    } else {
      prMatch = processingLots.find(p => p.lotCode.toUpperCase() === query);
    }

    if (prMatch) {
      hvMatch = harvestLots.find(h => h.lotCode === prMatch?.harvestLotCode);
      if (!exMatch) {
        exMatch = exportLots.find(e => e.processingLotCodes.includes(prMatch!.lotCode));
      }
    } else if (!exMatch) {
      hvMatch = harvestLots.find(h => h.lotCode.toUpperCase() === query);
    }

    if (hvMatch) {
      ccMatch = cycles.find(c => c.id === hvMatch?.cycleId || c.cycleCode === hvMatch?.cycleCode);
      plMatch = plLots.find(pl => pl.lotCode === hvMatch?.plLotCode || pl.lotCode === ccMatch?.plLotId);
      if (!prMatch) {
        prMatch = processingLots.find(p => p.harvestLotCode === hvMatch!.lotCode);
        if (prMatch && !exMatch) {
          exMatch = exportLots.find(e => e.processingLotCodes.includes(prMatch!.lotCode));
        }
      }
    } else if (!exMatch && !prMatch) {
      ccMatch = cycles.find(c => c.cycleCode.toUpperCase() === query);
      if (ccMatch) {
        plMatch = plLots.find(pl => pl.lotCode === ccMatch?.plLotId);
        hvMatch = harvestLots.find(h => h.cycleId === ccMatch?.id || h.cycleCode === ccMatch?.cycleCode);
      } else {
        plMatch = plLots.find(pl => pl.lotCode.toUpperCase() === query);
        if (plMatch) {
          ccMatch = cycles.find(c => c.plLotId === plMatch?.lotCode);
          if (ccMatch) {
            hvMatch = harvestLots.find(h => h.cycleId === ccMatch?.id || h.cycleCode === ccMatch?.cycleCode);
          }
        }
      }
    }

    return {
      searched: query,
      exportLot: exMatch,
      processingLot: prMatch,
      harvestLot: hvMatch,
      cycle: ccMatch,
      plLot: plMatch,
    };
  }, [searchLotCode, exportLots, processingLots, harvestLots, cycles, plLots]);

  // Recall Simulator Engine
  const recallImpact = React.useMemo(() => {
    const q = recallSearchQuery.trim().toUpperCase();
    if (!q) return null;

    // Find affected PL
    const affectedPl = plLots.filter(p => p.lotCode.toUpperCase().includes(q));
    const plCodes = affectedPl.map(p => p.lotCode);

    // Find affected Cycles
    const affectedCycles = cycles.filter(c => plCodes.includes(c.plLotId) || c.cycleCode.toUpperCase().includes(q));
    const cycleCodes = affectedCycles.map(c => c.cycleCode);

    // Find affected Harvests
    const affectedHarvests = harvestLots.filter(h => 
      cycleCodes.includes(h.cycleCode) || plCodes.includes(h.plLotCode) || h.lotCode.toUpperCase().includes(q)
    );
    const harvestCodes = affectedHarvests.map(h => h.lotCode);

    // Find affected Processing lots
    const affectedProcessing = processingLots.filter(pr => 
      harvestCodes.includes(pr.harvestLotCode) || pr.lotCode.toUpperCase().includes(q)
    );
    const prCodes = affectedProcessing.map(p => p.lotCode);

    // Find affected Export lots
    const affectedExport = exportLots.filter(ex => 
      ex.processingLotCodes.some(code => prCodes.includes(code)) || ex.lotCode.toUpperCase().includes(q)
    );

    return {
      plCount: affectedPl.length,
      cycleCount: affectedCycles.length,
      harvestLots: affectedHarvests,
      processingLots: affectedProcessing,
      exportLots: affectedExport,
    };
  }, [recallSearchQuery, plLots, cycles, harvestLots, processingLots, exportLots]);

  const handleCreateProcessingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lotCode = generatePrLotCode();
    await onCreateProcessingLot({
      lotCode,
      harvestLotCode: selectedHarvestLotCode,
      processorName,
      facilityCode,
      receivedWeightKg: parseFloat(receivedWeight) || 0,
      finishedWeightKg: parseFloat(finishedWeight) || 0,
      yieldPercent: calculatedYield,
      sizeGrade,
      productType,
      processedDate: new Date().toISOString().split('T')[0],
      notes: `Yield ผลผลิต ${calculatedYield}% ผ่านการตรวจสอบสุขลักษณะ`,
    });
    alert(`สร้างล็อตแปรรูป ${lotCode} สำเร็จ`);
  };

  const handleCreateExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allPassed = checklistResults.every(c => c.passed);
    if (!allPassed) {
      alert('เช็กลิสต์มาตรฐานประเทศปลายทางยังไม่ผ่านครบทุกข้อ! ไม่อนุญาตให้ปล่อยล็อตส่งออก');
      return;
    }

    const lotCode = generateExLotCode();
    await onCreateExportLot({
      lotCode,
      processingLotCodes: [selectedPrLotCode],
      exporterName,
      destinationMarket,
      marketCompliancePassed: true,
      checklistResults,
      shipmentDate: new Date().toISOString().split('T')[0],
      containerNumber,
      status: 'inspected',
    });
    alert(`สร้างล็อตส่งออก ${lotCode} สำเร็จ`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-sky-700">
            <Globe2 className="w-5 h-5" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {t.traceabilityTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.timeline}
          </p>
        </div>

        {/* Sub-tab Pills */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'timeline' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ไทม์ไลน์ย้อนกลับ
          </button>
          <button
            onClick={() => setActiveSubTab('processing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'processing' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            โรงงานแปรรูป (PR-)
          </button>
          <button
            onClick={() => setActiveSubTab('export')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'export' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ผู้ส่งออก (EX-)
          </button>
          <button
            onClick={() => setActiveSubTab('recall')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'recall' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            จำลองเรียกคืนสินค้า
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: VISUAL TIMELINE TRACEABILITY */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-6">
          {/* Search Lot Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchLotCode}
                onChange={(e) => setSearchLotCode(e.target.value)}
                placeholder="กรอกรหัสล็อตใดก็ได้ เช่น EX-26-SHIP-001, PR-26-FAC-001, HV-26-P01-001, PL-26-H01-001..."
                className="w-full min-h-[48px] pl-11 pr-4 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-sky-500 bg-slate-50 uppercase"
              />
            </div>
            <div className="text-xs text-slate-500 shrink-0">
              รองรับการค้นหาย้อนกลับจากปลายน้ำไปถึงต้นน้ำ
            </div>
          </div>

          {/* Visual Step Timeline (5 Stages: PL -> CC -> HV -> PR -> EX) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  ไทม์ไลน์ห่วงโซ่การผลิตและการตรวจสอบย้อนกลับ (Traceability Chain)
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  รหัสที่กำลังตรวจสอบ: <strong>{traceChain?.searched || 'ทั้งหมด'}</strong>
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>เชื่อมโยงสมบูรณ์ (End-to-End Linked)</span>
              </span>
            </div>

            {/* 5-Step Chain Display */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              
              {/* Step 1: PL- */}
              <div className="p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                  <span>1. โรงเพาะฟัก (PL-)</span>
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                </div>
                <div className="font-mono font-black text-sm text-indigo-950">
                  {traceChain?.plLot?.lotCode || 'PL-26-H01-001'}
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>{traceChain?.plLot?.hatcheryName || 'สยามมารีน แฮตเชอรี'}</div>
                  <div className="font-bold text-emerald-700">
                    PCR: ปลอดเชื้อ (Not Detected)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ใบรับลูกกุ้ง: {traceChain?.plLot?.acceptanceSlipNumber || 'RCV-260810-091'}
                  </div>
                </div>
              </div>

              {/* Step 2: CC- */}
              <div className="p-4 rounded-2xl border-2 border-sky-200 bg-sky-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-sky-900">
                  <span>2. รอบเลี้ยงบ่อ (CC-)</span>
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                </div>
                <div className="font-mono font-black text-sm text-sky-950">
                  {traceChain?.cycle?.cycleCode || 'CC-26-P01-01'}
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>บ่อ: <strong>{traceChain?.cycle?.pondCode || 'บ่อ 1 (P1)'}</strong></div>
                  <div>ปล่อย: {(traceChain?.cycle?.stockingCount || 120000).toLocaleString()} ตัว</div>
                  <div>ความหนาแน่น: {traceChain?.cycle?.stockingDensity || 75} ตัว/ตร.ม.</div>
                  <div className="text-[11px] text-slate-400">มาตรฐาน GAP/CoC</div>
                </div>
              </div>

              {/* Step 3: HV- */}
              <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>3. จับกุ้ง (HV-)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                </div>
                <div className="font-mono font-black text-sm text-emerald-950">
                  {traceChain?.harvestLot?.lotCode || 'HV-26-P01-001'}
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>น้ำหนัก: <strong>{(traceChain?.harvestLot?.totalWeightKg || 2850).toLocaleString()} กก.</strong></div>
                  <div>ขนาด: {traceChain?.harvestLot?.averageSizePcsPerKg || 38} ตัว/กก.</div>
                  <div className="font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>พ้นระยะหยุดยา 100%</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    วันที่จับ: {formatDate(traceChain?.harvestLot?.harvestDate || '2026-07-28', lang, era)}
                  </div>
                </div>
              </div>

              {/* Step 4: PR- */}
              <div className="p-4 rounded-2xl border-2 border-purple-200 bg-purple-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                  <span>4. โรงงานแปรรูป (PR-)</span>
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                </div>
                <div className="font-mono font-black text-sm text-purple-950">
                  {traceChain?.processingLot?.lotCode || 'PR-26-FAC-001'}
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>โรงงาน: {traceChain?.processingLot?.processorName || 'สุราษฎร์มารีน จำกัด'}</div>
                  <div>เกรด: <strong>{traceChain?.processingLot?.sizeGrade || '30/40 pcs/kg'}</strong></div>
                  <div>Yield: <strong>{traceChain?.processingLot?.yieldPercent || 84.0}%</strong></div>
                  <div className="text-[11px] text-slate-400">
                    รหัสโรงงาน: {traceChain?.processingLot?.facilityCode || 'TH-EST-1049'}
                  </div>
                </div>
              </div>

              {/* Step 5: EX- */}
              <div className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>5. ส่งออก (EX-)</span>
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                </div>
                <div className="font-mono font-black text-sm text-amber-950">
                  {traceChain?.exportLot?.lotCode || 'EX-26-SHIP-001'}
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>ปลายทาง: <strong>{traceChain?.exportLot?.destinationMarket || 'US (สหรัฐอเมริกา)'}</strong></div>
                  <div>ตู้คอนเทนเนอร์: <span className="font-mono">{traceChain?.exportLot?.containerNumber || 'TGHU-892104-7'}</span></div>
                  <div className="font-bold text-emerald-700">
                    เช็กลิสต์ FDA/EU ผ่านครบ
                  </div>
                  <div className="text-[11px] text-slate-400">
                    สถานะ: ส่งมอบแล้ว (Shipped)
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PROCESSOR RECEIVING & YIELD */}
      {activeSubTab === 'processing' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">
              รับวัตถุดิบ คัดขนาด และคำนวณ Yield ผลผลิต (PR- Lot Creation)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              โรงงานแปรรูปพิมพ์รับรหัสล็อตจับ (HV-) เพื่อออกรหัสล็อตสินค้าสำเร็จรูป (PR-)
            </p>
          </div>

          <form onSubmit={handleCreateProcessingSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  พิมพ์/เลือกรหัสล็อตจับกุ้ง (HV- Lot Code):
                </label>
                <select
                  value={selectedHarvestLotCode}
                  onChange={(e) => setSelectedHarvestLotCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-sky-500 bg-white"
                  required
                >
                  {harvestLots.map(h => (
                    <option key={h.id} value={h.lotCode}>
                      {h.lotCode} — น้ำหนัก {h.totalWeightKg} กก. ({h.farmName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อโรงงานและรหัสสถานประกอบการ:
                </label>
                <input
                  type="text"
                  value={processorName}
                  onChange={(e) => setProcessorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-sky-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  น้ำหนักรับเข้า (กก.):
                </label>
                <input
                  type="number"
                  value={receivedWeight}
                  onChange={(e) => setReceivedWeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-bold focus:outline-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  น้ำหนักเนื้อสำเร็จรูป (กก.):
                </label>
                <input
                  type="number"
                  value={finishedWeight}
                  onChange={(e) => setFinishedWeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-bold focus:outline-sky-500"
                  required
                />
              </div>

              {/* Auto Yield Percentage Calculation */}
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                <span className="text-xs font-bold text-purple-900 block">
                  คำนวณ Yield อัตโนมัติ:
                </span>
                <div className="text-2xl font-black text-purple-800 font-mono mt-1">
                  {calculatedYield}%
                </div>
                <span className="text-[10px] text-purple-700 block">
                  = ({finishedWeight} / {receivedWeight}) × 100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คัดขนาด (Size Grading):
                </label>
                <select
                  value={sizeGrade}
                  onChange={(e) => setSizeGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-sky-500 bg-white"
                >
                  <option value="20/30 pcs/kg">20/30 ตัว/กก. (จัมโบ้)</option>
                  <option value="30/40 pcs/kg">30/40 ตัว/กก. (ไซส์ใหญ่)</option>
                  <option value="40/50 pcs/kg">40/50 ตัว/กก. (ไซส์กลาง)</option>
                  <option value="50/60 pcs/kg">50/60 ตัว/กก. (ไซส์มาตรฐาน)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ประเภทผลิตภัณฑ์ (Product Form):
                </label>
                <input
                  type="text"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-sky-500"
                  required
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="min-h-[50px] px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white font-black text-sm rounded-xl shadow-md transition"
              >
                บันทึกล็อตแปรรูป ({generatePrLotCode()})
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: EXPORTER & MARKET COMPLIANCE CHECKLISTS */}
      {activeSubTab === 'export' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">
              สร้างล็อตส่งออก (EX-) และเช็กลิสต์ตามกฎหมายประเทศปลายทาง
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ตรวจสอบมาตรการความปลอดภัยสารตกค้างและใบรับรองตามมาตรฐาน US FDA, EU, JP, CN, ASEAN
            </p>
          </div>

          <form onSubmit={handleCreateExportSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เลือกล็อตสินค้าแปรรูป (PR- Lot):
                </label>
                <select
                  value={selectedPrLotCode}
                  onChange={(e) => setSelectedPrLotCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-amber-500 bg-white"
                  required
                >
                  {processingLots.map(p => (
                    <option key={p.id} value={p.lotCode}>
                      {p.lotCode} — {p.sizeGrade} ({p.finishedWeightKg} กก.)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ประเทศ / ตลาดปลายทาง:
                </label>
                <select
                  value={destinationMarket}
                  onChange={(e) => setDestinationMarket(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-300 focus:outline-amber-500 bg-white"
                >
                  <option value="US">สหรัฐอเมริกา (US FDA FSMA)</option>
                  <option value="EU">สหภาพยุโรป (EU Regulation 2017/625)</option>
                  <option value="JP">ญี่ปุ่น (Positive List System)</option>
                  <option value="CN">จีน (GACC Registration)</option>
                  <option value="ASEAN">กลุ่มประเทศอาเซียน (ASEAN GAP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หมายเลขตู้คอนเทนเนอร์ (Container No.):
                </label>
                <input
                  type="text"
                  value={containerNumber}
                  onChange={(e) => setContainerNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-300 focus:outline-amber-500"
                  required
                />
              </div>
            </div>

            {/* Checklist of Destination Market */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                เช็กลิสต์ข้อกำหนดกฎหมายปลายทาง ({destinationMarket}):
              </span>

              <div className="space-y-2">
                {checklistResults.map((item) => (
                  <div
                    key={item.checkId}
                    onClick={() => toggleChecklistItem(item.checkId)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      item.passed ? 'bg-white border-emerald-300 text-emerald-950 font-bold' : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <span className="text-xs">{item.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                      item.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.passed ? 'ผ่านเกณฑ์' : 'ไม่ผ่าน'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="min-h-[50px] px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm rounded-xl shadow-md transition"
              >
                บันทึกล็อตส่งออก ({generateExLotCode()})
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 4: RECALL SIMULATOR (จำลองการเรียกคืนสินค้า) */}
      {activeSubTab === 'recall' && (
        <div className="bg-white rounded-2xl border-2 border-rose-300 p-6 shadow-sm space-y-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {t.recallSimulator}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.recallInstruction}
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={recallSearchQuery}
              onChange={(e) => setRecallSearchQuery(e.target.value)}
              placeholder="กรอกรหัสลูกกุ้ง (เช่น PL-26-H01-001) หรือรหัสยา/บ่อ..."
              className="flex-1 px-4 py-3 rounded-xl border border-rose-300 font-mono text-sm focus:outline-rose-500 bg-rose-50/30 uppercase font-bold"
            />
            <button
              type="button"
              className="min-h-[48px] px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              ค้นหาและวิเคราะห์ผลกระทบ
            </button>
          </div>

          {/* Results Summary Cards */}
          {recallImpact && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-between">
                <span>สรุปผลการวิเคราะห์: พบความเสี่ยงที่ต้องอายัดทั้งสิ้น</span>
                <span className="font-mono text-sm">
                  {recallImpact.harvestLots.length} ล็อตจับ | {recallImpact.processingLots.length} ล็อตแปรรูป | {recallImpact.exportLots.length} ล็อตส่งออก
                </span>
              </div>

              {/* Table of Impacted Lots */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Affected Harvest Lots */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    ล็อตจับที่กระทบ (HV-):
                  </span>
                  {recallImpact.harvestLots.map(h => (
                    <div key={h.id} className="p-2.5 rounded-lg bg-white border border-rose-200 text-xs font-mono font-bold text-rose-700 flex justify-between">
                      <span>{h.lotCode}</span>
                      <span className="text-slate-500">{h.totalWeightKg} กก.</span>
                    </div>
                  ))}
                </div>

                {/* 2. Affected Processing Lots */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    ล็อตแปรรูปที่กระทบ (PR-):
                  </span>
                  {recallImpact.processingLots.map(pr => (
                    <div key={pr.id} className="p-2.5 rounded-lg bg-white border border-rose-200 text-xs font-mono font-bold text-rose-700 flex justify-between">
                      <span>{pr.lotCode}</span>
                      <span className="text-slate-500">{pr.finishedWeightKg} กก.</span>
                    </div>
                  ))}
                </div>

                {/* 3. Affected Export Lots */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    ล็อตส่งออกที่ต้องอายัดด่วน (EX-):
                  </span>
                  {recallImpact.exportLots.map(ex => (
                    <div key={ex.id} className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-xs font-mono font-bold text-rose-800 flex justify-between">
                      <span>{ex.lotCode}</span>
                      <span className="bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded text-[10px]">
                        ระงับ {ex.destinationMarket}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
