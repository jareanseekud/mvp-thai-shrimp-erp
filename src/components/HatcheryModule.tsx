import React, { useState } from 'react';
import { 
  Building, CheckCircle2, AlertTriangle, FileText, Award, 
  Plus, CheckSquare, Square, Calculator, Sparkles, Star,
  QrCode, X, Copy, Check
} from 'lucide-react';
import { PostLarvaeLot, Pond, CultureCycle, UserRole } from '../types';
import { Language, CalendarEra, translations, formatDate } from '../lib/i18n';
import { calculateStockingDensity } from '../lib/calculations';
import { QRCodeSVG } from './ui/QRCodeSVG';

interface HatcheryModuleProps {
  plLots: PostLarvaeLot[];
  ponds: Pond[];
  cycles: CultureCycle[];
  currentRole: UserRole;
  selectedFarmId: string;
  onAddPlLot: (lot: Omit<PostLarvaeLot, 'id'>) => Promise<void>;
  lang: Language;
  era: CalendarEra;
}

export const HatcheryModule: React.FC<HatcheryModuleProps> = ({
  plLots,
  ponds,
  cycles,
  currentRole,
  selectedFarmId,
  onAddPlLot,
  lang,
  era,
}) => {
  const t = translations[lang];

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedQrLot, setSelectedQrLot] = useState<PostLarvaeLot | null>(null);

  // Form State for new PL-
  const [hatcheryName, setHatcheryName] = useState('ศูนย์เพาะฟักลูกกุ้ง ทะเลไทย');
  const [hatcheryCode, setHatcheryCode] = useState('H03');
  const [broodstockOrigin, setBroodstockOrigin] = useState('พ่อแม่พันธุ์ปลอดโรค SPF จากศูนย์ SIS ฮาวาย สหรัฐอเมริกา');
  const [shrimpSpecies, setShrimpSpecies] = useState('กุ้งขาวแวนนาไม (Litopenaeus vannamei)');
  const [stage, setStage] = useState('PL-10');
  const [pcrResult, setPcrResult] = useState<'not_detected' | 'detected' | 'not_tested'>('not_detected');
  const [pcrCertNumber, setPcrCertNumber] = useState('PCR-DOF-2026-9901');
  const [hatchDate, setHatchDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 10);
    return d.toISOString().split('T')[0];
  });
  const [quantity, setQuantity] = useState('200000');
  const [acceptanceSlipNumber, setAcceptanceSlipNumber] = useState(`RCV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-001`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pond Preparation Checklist State (in-memory interactive)
  const [prepChecklist, setPrepChecklist] = useState<{ id: string; label: string; done: boolean }[]>([
    { id: 'prep-1', label: '1. ตากก้นบ่อแห้งสนิทจนดินแตกระแหง (อย่างน้อย 14 วัน)', done: true },
    { id: 'prep-2', label: '2. ตรวจวัดค่า pH ดินก้นบ่อ และโรยปูนขาวร้อน (CaO) / ปูนมาร์ล ปรับสภาพดิน', done: true },
    { id: 'prep-3', label: '3. กรองน้ำผ่านถุงกรองตาถี่ 100-150 เมช เพื่อดักสัตว์พาหะและลูกปลา', done: true },
    { id: 'prep-4', label: '4. ฆ่าเชื้อในน้ำด้วยคลอรีนเข้มข้น 25-30 ppm และเปิดแอร์เลเตอร์ทิ้งไว้ 5-7 วัน', done: true },
    { id: 'prep-5', label: '5. ทำสีน้ำ (Bloom แพลงก์ตอนพืช) ให้ความโปร่งแสงอยู่ที่ 30-40 ซม.', done: false },
    { id: 'prep-6', label: '6. กั้นตาข่ายรอบบ่อป้องกันปูและสัตว์เลื้อยคลานพาหะ (Biosecurity Net)', done: false },
    { id: 'prep-7', label: '7. ขึงเอ็นเส้นกันนกโฉบข้ามบ่ออย่างหนาแน่น', done: false },
    { id: 'prep-8', label: '8. ตรวจเช็คค่า DO (>5.0), pH (7.8-8.2), อัลคาไลน์ (>120) ก่อนปล่อย', done: false },
  ]);

  const toggleCheck = (id: string) => {
    setPrepChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  // Calculate Hatchery Rankings based on average survival rate of linked cycles
  const hatcheryStats = React.useMemo(() => {
    const map: Record<string, { name: string; totalLots: number; totalSurvival: number; countWithSurvival: number }> = {};
    
    plLots.forEach(lot => {
      if (!map[lot.hatcheryName]) {
        map[lot.hatcheryName] = { name: lot.hatcheryName, totalLots: 0, totalSurvival: 0, countWithSurvival: 0 };
      }
      map[lot.hatcheryName].totalLots += 1;
      if (lot.survivalRateEstimated) {
        map[lot.hatcheryName].totalSurvival += lot.survivalRateEstimated;
        map[lot.hatcheryName].countWithSurvival += 1;
      }
    });

    return Object.values(map).map(h => ({
      name: h.name,
      totalLots: h.totalLots,
      avgSurvival: h.countWithSurvival > 0 ? (h.totalSurvival / h.countWithSurvival).toFixed(1) : '88.5',
    })).sort((a, b) => parseFloat(b.avgSurvival) - parseFloat(a.avgSurvival));
  }, [plLots]);

  // Generate unique PL- lot code: PL-YY-Hxx-xxx
  const generatePlLotCode = () => {
    const yearShort = new Date().getFullYear().toString().slice(-2);
    const count = plLots.length + 1;
    return `PL-${yearShort}-${hatcheryCode}-${String(count).padStart(3, '0')}`;
  };

  const handleRegisterPlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const lotCode = generatePlLotCode();
      const qrPayload = JSON.stringify({
        lot: lotCode,
        hatchery: hatcheryName,
        species: shrimpSpecies,
        broodstock: broodstockOrigin,
        pcr: pcrResult,
        cert: pcrCertNumber,
        hatchDate: hatchDate,
      });

      await onAddPlLot({
        lotCode,
        hatcheryName,
        hatcheryCode,
        broodstockOrigin,
        shrimpSpecies,
        stage,
        pcrResult,
        pcrCertNumber,
        hatchDate,
        quantity: parseInt(quantity) || 100000,
        receivedDate: new Date().toISOString().split('T')[0],
        farmId: selectedFarmId,
        acceptanceSlipNumber,
        survivalRateEstimated: pcrResult === 'not_detected' ? 90 : 70,
        qrCodeData: qrPayload,
      });
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-700">
            <Building className="w-5 h-5" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              โรงเพาะฟัก (Hatchery), เตรียมบ่อ และปล่อยลูกกุ้ง (PL-)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ลงทะเบียนล็อตลูกกุ้ง ตรวจสอบใบรับรอง PCR คำนวณความหนาแน่น และคะแนนโรงเพาะฟัก
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="min-h-[46px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>ลงทะเบียนล็อตลูกกุ้ง (PL-)</span>
        </button>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: PL Lots List & Hatchery Rankings */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Registered PL Lots */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                ทะเบียนล็อตลูกกุ้งในระบบ (PL- Lots)
              </h3>
              <span className="text-xs text-slate-400">ทั้งหมด {plLots.length} ล็อต</span>
            </div>

            <div className="space-y-3">
              {plLots.map((lot) => {
                const isPcrClean = lot.pcrResult === 'not_detected';
                const isPcrDetected = lot.pcrResult === 'detected';

                return (
                  <div 
                    key={lot.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-lg">
                            {lot.lotCode}
                          </span>
                          <span className="text-xs font-bold text-slate-600">{lot.stage}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{lot.hatcheryName}</h4>
                      </div>

                      {/* PCR Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        isPcrClean 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : isPcrDetected
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}>
                        {isPcrClean ? 'PCR ปลอดเชื้อ (Not Detected)' : isPcrDetected ? 'PCR ตรวจพบเชื้อ!' : 'ไม่ได้ตรวจ PCR'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                      <div>สายพันธุ์: <strong className="text-slate-900">{lot.shrimpSpecies || 'กุ้งขาวแวนนาไม'}</strong></div>
                      <div>จำนวน: <strong className="text-slate-900">{lot.quantity.toLocaleString()} ตัว</strong></div>
                      <div>วันฟัก: <strong>{formatDate(lot.hatchDate || lot.receivedDate, lang, era)}</strong></div>
                      <div className="col-span-2 text-slate-700">
                        พ่อแม่พันธุ์: <strong className="text-indigo-950">{lot.broodstockOrigin || 'SPF นำเข้าฮาวาย (SIS)'}</strong>
                      </div>
                      <div>ใบรับของ: <strong className="font-mono text-slate-700">{lot.acceptanceSlipNumber}</strong></div>
                      <div className="col-span-2 text-[11px] text-slate-500 truncate">
                        ใบรับรองโรค (DOF): <span className="font-mono font-bold text-slate-700">{lot.pcrCertNumber}</span>
                      </div>
                    </div>

                    {/* QR Code Action Button */}
                    <div className="pt-2 border-t border-slate-200 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedQrLot(lot)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF7A1A] to-[#FF903F] text-white font-bold text-xs shadow-xs hover:from-[#E8670C] hover:to-[#FF8024] transition active:scale-[0.97]"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>สร้าง / สแกน QR Code รับเข้า</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hatchery Score / Rankings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <Award className="w-5 h-5" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                คะแนนและอันดับโรงเพาะฟัก (คำนวณจากอัตรารอดเฉลี่ย)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              วิเคราะห์ความน่าเชื่อถือของแหล่งพันธุ์กุ้ง เพื่อช่วยตัดสินใจสั่งซื้อลูกกุ้งในรอบถัดไป
            </p>

            <div className="space-y-2 pt-1">
              {hatcheryStats.map((h, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{h.name}</div>
                      <div className="text-[11px] text-slate-400">ประวัติสั่งซื้อ {h.totalLots} ล็อต</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-700 font-mono">
                      {h.avgSurvival}%
                    </div>
                    <div className="text-[10px] text-slate-400">อัตรารอดเฉลี่ย</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right: Pond Preparation Checklist (เช็กลิสต์เตรียมบ่อแบบติ๊ก) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                เช็กลิสต์เตรียมบ่อเลี้ยง (Pond Preparation)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ขั้นตอนมาตรฐานการเตรียมบ่อเพื่อตัดวงจรโรคก่อนปล่อยลูกกุ้ง
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
              ผ่านแล้ว {prepChecklist.filter(c => c.done).length}/{prepChecklist.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {prepChecklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-start gap-2.5 ${
                  item.done 
                    ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {item.done ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                )}
                <span className="text-xs leading-relaxed">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs leading-relaxed">
            <span className="font-bold">หมายเหตุ:</span> การเตรียมบ่อที่สมบูรณ์ช่วยลดโอกาสเกิดโรค EMS และ WSSV ได้มากกว่า 80% ก่อนการปล่อยลูกกุ้ง
          </div>
        </div>

      </div>

      {/* Modal: Register PL Lot */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              ลงทะเบียนล็อตลูกกุ้งใหม่ (Post Larvae Registration)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              รหัสล็อตจะถูกสร้างอัตโนมัติ: <strong>{generatePlLotCode()}</strong>
            </p>

            <form onSubmit={handleRegisterPlSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อโรงเพาะฟัก (Hatchery Name):</label>
                  <input
                    type="text"
                    value={hatcheryName}
                    onChange={(e) => setHatcheryName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-[#FF7A1A]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รหัสโรงเพาะฟัก (Code):</label>
                  <input
                    type="text"
                    value={hatcheryCode}
                    onChange={(e) => setHatcheryCode(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-300 focus:outline-[#FF7A1A]"
                    required
                  />
                </div>
              </div>

              {/* Requirement 3: Species & Broodstock Origin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">สายพันธุ์กุ้ง (Species):</label>
                  <select
                    value={shrimpSpecies}
                    onChange={(e) => setShrimpSpecies(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-[#FF7A1A] bg-white font-medium"
                    required
                  >
                    <option value="กุ้งขาวแวนนาไม (Litopenaeus vannamei)">กุ้งขาวแวนนาไม (Litopenaeus vannamei)</option>
                    <option value="กุ้งกุลาดำ (Penaeus monodon)">กุ้งกุลาดำ (Penaeus monodon)</option>
                    <option value="กุ้งก้ามกราม (Macrobrachium rosenbergii)">กุ้งก้ามกราม (Macrobrachium rosenbergii)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">วันฟักลูกกุ้ง (Hatch Date):</label>
                  <input
                    type="date"
                    value={hatchDate}
                    onChange={(e) => setHatchDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-[#FF7A1A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">พ่อแม่พันธุ์ / แหล่งที่มา (Broodstock Origin):</label>
                <input
                  type="text"
                  value={broodstockOrigin}
                  onChange={(e) => setBroodstockOrigin(e.target.value)}
                  placeholder="เช่น พ่อแม่พันธุ์ปลอดโรค SPF จากศูนย์ SIS ฮาวาย สหรัฐอเมริกา"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-[#FF7A1A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ระยะลูกกุ้ง (Stage):</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-[#FF7A1A] bg-white"
                  >
                    <option value="PL-10">PL-10 (ความยาว 8.5-9.5 มม.)</option>
                    <option value="PL-12">PL-12 (ความยาว 10-11 มม.)</option>
                    <option value="PL-15">PL-15 (ความยาว &gt;12 มม.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนที่รับ (ตัว):</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-[#FF7A1A] font-bold"
                    required
                  />
                </div>
              </div>

              {/* Requirement 3: PCR Result & Certificate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ผลตรวจโรค PCR:</label>
                  <select
                    value={pcrResult}
                    onChange={(e) => setPcrResult(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-[#FF7A1A] bg-white font-bold"
                  >
                    <option value="not_detected">ไม่พบเชื้อ (ปลอดเชื้อ 100%)</option>
                    <option value="detected">พบเชื้อ (มีความเสี่ยง)</option>
                    <option value="not_tested">ไม่ได้ตรวจ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เลขที่ใบรับรองโรค (DOF/PCR Cert):</label>
                  <input
                    type="text"
                    value={pcrCertNumber}
                    onChange={(e) => setPcrCertNumber(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-[#FF7A1A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">เลขที่ใบรับลูกกุ้ง (Acceptance Slip):</label>
                <input
                  type="text"
                  value={acceptanceSlipNumber}
                  onChange={(e) => setAcceptanceSlipNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-[#FF7A1A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[50px] rounded-2xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition active:scale-[0.97]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[50px] rounded-2xl bg-gradient-to-r from-[#FF7A1A] to-[#FF903F] hover:from-[#E8670C] hover:to-[#FF8024] text-white font-bold text-sm shadow-md transition active:scale-[0.97]"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก & สร้าง QR Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View & Scan PL- QR Code */}
      {selectedQrLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-[26px] p-6 shadow-2xl border border-orange-200 text-center animate-in fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <div className="flex items-center gap-2 text-[#FF7A1A]">
                <QrCode className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">QR Code รับเข้าลูกกุ้ง (PL-)</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQrLot(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center py-2">
              <QRCodeSVG
                value={selectedQrLot.lotCode}
                size={220}
                title={selectedQrLot.lotCode}
              />
            </div>

            <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 text-left text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">รหัสล็อต:</span>
                <strong className="font-mono text-indigo-950 font-bold">{selectedQrLot.lotCode}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">สายพันธุ์:</span>
                <strong className="text-slate-900">{selectedQrLot.shrimpSpecies || 'กุ้งขาวแวนนาไม'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">โรงเพาะฟัก:</span>
                <strong className="text-slate-900">{selectedQrLot.hatcheryName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">วันฟัก:</span>
                <strong>{formatDate(selectedQrLot.hatchDate || selectedQrLot.receivedDate, lang, era)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ผลตรวจ PCR:</span>
                <strong className={selectedQrLot.pcrResult === 'not_detected' ? 'text-emerald-700' : 'text-rose-700'}>
                  {selectedQrLot.pcrResult === 'not_detected' ? 'ปลอดเชื้อ (Not Detected)' : selectedQrLot.pcrResult === 'detected' ? 'พบเชื้อ' : 'ไม่ได้ตรวจ'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ใบรับรอง DOF:</span>
                <strong className="font-mono">{selectedQrLot.pcrCertNumber}</strong>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              เกษตรกรผู้เลี้ยงสามารถใช้เมนู <strong>"สแกน QR ย้อนกลับ"</strong> ในการรับกุ้งเข้าบ่อเลี้ยง CC- ได้ทันที
            </div>

            <button
              type="button"
              onClick={() => setSelectedQrLot(null)}
              className="w-full min-h-[48px] rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition active:scale-[0.97]"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
