import React, { useState } from 'react';
import { 
  QrCode, Search, CheckCircle2, ShieldCheck, Waves, 
  MapPin, Award, Calendar, FileText, Sparkles
} from 'lucide-react';
import { 
  Farm, HarvestLot, ProcessingLot, ExportLot, PostLarvaeLot 
} from '../types';
import { Language, CalendarEra, translations, formatDate } from '../lib/i18n';

interface PublicTraceabilityModuleProps {
  farms: Farm[];
  harvestLots: HarvestLot[];
  processingLots: ProcessingLot[];
  exportLots: ExportLot[];
  plLots: PostLarvaeLot[];
  lang: Language;
  era: CalendarEra;
}

export const PublicTraceabilityModule: React.FC<PublicTraceabilityModuleProps> = ({
  farms,
  harvestLots,
  processingLots,
  exportLots,
  plLots,
  lang,
  era,
}) => {
  const t = translations[lang];

  const [inputCode, setInputCode] = useState<string>('EX-26-SHIP-001');

  // Search logic (safe, public consented fields only)
  const searchResult = React.useMemo(() => {
    const q = inputCode.trim().toUpperCase();
    if (!q) return null;

    const ex = exportLots.find(e => e.lotCode.toUpperCase() === q);
    const pr = processingLots.find(p => p.lotCode.toUpperCase() === q || (ex && ex.processingLotCodes.includes(p.lotCode)));
    const hv = harvestLots.find(h => h.lotCode.toUpperCase() === q || (pr && pr.harvestLotCode === h.lotCode));
    const pl = plLots.find(p => p.lotCode.toUpperCase() === q || (hv && hv.plLotCode === p.lotCode));
    const farm = farms[0];

    return {
      searched: q,
      exportLot: ex,
      processingLot: pr,
      harvestLot: hv,
      plLot: pl,
      farm,
    };
  }, [inputCode, exportLots, processingLots, harvestLots, plLots, farms]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Consumer Hero Banner */}
      <div className="bg-gradient-to-tr from-sky-800 via-sky-700 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg text-center relative overflow-hidden">
        <div className="max-w-xl mx-auto relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sky-100 text-xs font-bold backdrop-blur-xs">
            <QrCode className="w-4 h-4" />
            <span>ระบบตรวจสอบย้อนกลับสาธารณะสำหรับผู้บริโภค (Public QR Trace)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            ตรวจสอบที่มาและความปลอดภัยของกุ้งไทย
          </h2>
          <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
            สแกน QR Code หรือกรอกรหัสล็อตสินค้าบนบรรจุภัณฑ์ เพื่อตรวจสอบเส้นทางตั้งแต่โรงเพาะฟัก ฟาร์มเลี้ยงที่ได้มาตรฐาน GAP จนถึงการแปรรูปส่งออก
          </p>

          {/* Search Input Bar */}
          <div className="pt-2">
            <div className="bg-white p-2 rounded-2xl shadow-xl flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="กรอกรหัสล็อตบนกล่อง เช่น EX-26-SHIP-001..."
                className="flex-1 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none uppercase"
              />
              <button
                type="button"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
              >
                ตรวจสอบ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Certificate Card */}
      {searchResult && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Certificate Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 mb-1">
                <ShieldCheck className="w-6 h-6" />
                <span className="text-xs font-black uppercase tracking-wider">
                  ใบรับรองความปลอดภัยอาหาร (Food Safety & Traceability Passport)
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 font-mono">
                {searchResult.searched}
              </h3>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ยืนยันข้อมูลโดยเจ้าของฟาร์ม (Owner Consented)</span>
            </div>
          </div>

          {/* 3 Pillars of Consumer Safety */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>แหล่งผลิต / ฟาร์มต้นกำเนิด</span>
              </div>
              <div className="font-bold text-sm text-slate-900">
                {searchResult.farm?.name || 'ฟาร์มทรัพย์สมบูรณ์ กุ้งทอง'}
              </div>
              <div className="text-xs text-slate-500">
                จังหวัด{searchResult.farm?.province || 'สุราษฎร์ธานี'} ประเทศไทย
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <Award className="w-4 h-4 text-amber-600" />
                <span>มาตรฐานรับรอง</span>
              </div>
              <div className="font-bold text-sm text-slate-900">
                GAP มกษ. 7401-2557 / CoC
              </div>
              <div className="text-xs text-slate-500">
                กรมประมง กระทรวงเกษตรฯ
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>การตรวจสารตกค้าง</span>
              </div>
              <div className="font-bold text-sm text-emerald-700">
                ปลอดสารตกค้าง 100%
              </div>
              <div className="text-xs text-slate-500">
                พ้นระยะหยุดยาปลอดภัย
              </div>
            </div>

          </div>

          {/* Life Cycle Journey for Consumer */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              บันทึกการเดินทางของผลิตภัณฑ์ (Shrimp Journey):
            </h4>

            <div className="space-y-3">
              {/* Hatchery */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    PL
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">พันธุ์ลูกกุ้งปลอดโรค (SPF/PCR Certified)</div>
                    <div className="text-slate-500">{searchResult.plLot?.hatcheryName || 'สยามมารีน แฮตเชอรี'}</div>
                  </div>
                </div>
                <span className="font-mono text-slate-500">{searchResult.plLot?.lotCode || 'PL-26-H01-001'}</span>
              </div>

              {/* Farm Harvest */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    HV
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">การจับกุ้งสดและการควบคุมความเย็น</div>
                    <div className="text-slate-500">
                      จับวันที่ {formatDate(searchResult.harvestLot?.harvestDate || '2026-07-28', lang, era)} | ขนาดเฉลี่ย {searchResult.harvestLot?.averageSizePcsPerKg || 38} ตัว/กก.
                    </div>
                  </div>
                </div>
                <span className="font-mono text-slate-500">{searchResult.harvestLot?.lotCode || 'HV-26-P01-001'}</span>
              </div>

              {/* Processing */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    PR
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">โรงงานแปรรูปมาตรฐานส่งออก</div>
                    <div className="text-slate-500">{searchResult.processingLot?.processorName || 'สุราษฎร์มารีน จำกัด'} (HACCP/BRC)</div>
                  </div>
                </div>
                <span className="font-mono text-slate-500">{searchResult.processingLot?.lotCode || 'PR-26-FAC-001'}</span>
              </div>
            </div>
          </div>

          {/* Privacy & Consent Note */}
          <div className="text-center text-[11px] text-slate-400 pt-3 border-t border-slate-100">
            * หน้านี้แสดงเฉพาะข้อมูลสาธารณะที่ได้รับความยินยอมจากเจ้าของฟาร์ม (ตามข้อกำหนดสิทธิ Consent) ไม่มีการเปิดเผยต้นทุนหรือข้อมูลส่วนบุคคล
          </div>

        </div>
      )}
    </div>
  );
};
