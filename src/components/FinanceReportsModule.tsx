import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, Printer, Download, FileSpreadsheet, 
  Scale, PieChart, Activity, Award
} from 'lucide-react';
import { Farm, Pond, CultureCycle, FeedingLog, HarvestLot, UserRole } from '../types';
import { Language, CalendarEra, translations, formatDate } from '../lib/i18n';
import { calculateFCR, calculateSurvivalRate, calculateADG } from '../lib/calculations';

interface FinanceReportsModuleProps {
  ponds: Pond[];
  cycles: CultureCycle[];
  feedingLogs: FeedingLog[];
  harvestLots: HarvestLot[];
  currentRole: UserRole;
  selectedFarmId: string;
  lang: Language;
  era: CalendarEra;
}

export const FinanceReportsModule: React.FC<FinanceReportsModuleProps> = ({
  ponds,
  cycles,
  feedingLogs,
  harvestLots,
  currentRole,
  selectedFarmId,
  lang,
  era,
}) => {
  const t = translations[lang];

  const [activeCycleId, setActiveCycleId] = useState<string>(cycles[0]?.id || '');
  const activeCycle = cycles.find(c => c.id === activeCycleId) || cycles[0];
  const linkedPond = ponds.find(p => p.id === activeCycle?.pondId);

  // Financial Estimates
  const [feedCostPerKg, setFeedCostPerKg] = useState('42'); // 42 THB / kg
  const [plCostPer1000, setPlCostPer1000] = useState('180'); // 180 THB / 1,000 PL
  const [energyAndLaborCost, setEnergyAndLaborCost] = useState('25000'); // electricity + fuel
  const [sellingPricePerKg, setSellingPricePerKg] = useState('175'); // 175 THB / kg

  // Sum total feed logged
  const cycleFeedLogs = feedingLogs.filter(f => f.cycleId === activeCycle?.id);
  const totalFeedKg = cycleFeedLogs.reduce((acc, curr) => acc + curr.actualAmountKg, activeCycle?.cumulativeFeedKg || 2450);

  // Production Metrics
  const initialStock = activeCycle?.stockingCount || 120000;
  const currentAbw = activeCycle?.currentAbw || 16.5;
  const daysOfCulture = activeCycle 
    ? Math.max(1, Math.floor((Date.now() - new Date(activeCycle.stockingDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 85;

  const estimatedCurrentBiomassKg = activeCycle?.currentBiomassKg || 1683;
  const estimatedSurvival = activeCycle?.estimatedSurvivalRate || 85;

  // KPIs
  const fcr = calculateFCR(totalFeedKg, estimatedCurrentBiomassKg);
  const adg = calculateADG(0.02, currentAbw, daysOfCulture);
  const survivalRate = calculateSurvivalRate(
    Math.round(initialStock * (estimatedSurvival / 100)),
    initialStock
  );

  // Financial Breakdown
  const totalFeedExpense = totalFeedKg * (parseFloat(feedCostPerKg) || 42);
  const totalPlExpense = (initialStock / 1000) * (parseFloat(plCostPer1000) || 180);
  const totalOtherExpense = parseFloat(energyAndLaborCost) || 25000;
  const totalCost = totalFeedExpense + totalPlExpense + totalOtherExpense;

  const costPerKg = estimatedCurrentBiomassKg > 0 ? (totalCost / estimatedCurrentBiomassKg).toFixed(1) : '0';
  const totalRevenue = estimatedCurrentBiomassKg * (parseFloat(sellingPricePerKg) || 175);
  const netProfit = totalRevenue - totalCost;

  // Native In-Browser Export CSV with UTF-8 BOM for Thai Excel
  const handleExportCsv = () => {
    const headers = [
      'รอบการเลี้ยง (CycleCode)',
      'บ่อ (Pond)',
      'อายุเลี้ยง (DOC วัน)',
      'ขนาดเฉลี่ย (ABW กรัม)',
      'จำนวนปล่อย (ตัว)',
      'อัตรารอด (%)',
      'อาหารรวม (กก.)',
      'ชีวมวลรวม (กก.)',
      'FCR (อัตราแลกเนื้อ)',
      'ADG (การโตเฉลี่ย กรัม/วัน)',
      'ต้นทุนค่าอาหาร (บาท)',
      'ต้นทุนลูกกุ้ง (บาท)',
      'ต้นทุนอื่นๆ (บาท)',
      'ต้นทุนรวม (บาท)',
      'ต้นทุนต่อ กก. (บาท)',
      'รายรับประเมิน (บาท)',
      'กำไรสุทธิ (บาท)'
    ];

    const row = [
      `"${activeCycle?.cycleCode || '-'}"`,
      `"${linkedPond?.code || '-'}"`,
      daysOfCulture,
      currentAbw,
      initialStock,
      `${survivalRate}%`,
      totalFeedKg,
      estimatedCurrentBiomassKg,
      fcr,
      adg,
      totalFeedExpense.toFixed(2),
      totalPlExpense.toFixed(2),
      totalOtherExpense.toFixed(2),
      totalCost.toFixed(2),
      costPerKg,
      totalRevenue.toFixed(2),
      netProfit.toFixed(2)
    ];

    const csvContent = '\uFEFF' + [headers.join(','), row.join(',')].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `รายงานต้นทุนกำไร_${activeCycle?.cycleCode || 'CC'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Print/Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2 text-emerald-700">
            <DollarSign className="w-5 h-5" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              การเงิน ต้นทุน กำไร และรายงานทางวิชาการ (KPIs)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            คำนวณ FCR, Survival Rate, ADG และต้นทุนต่อ กก. พร้อมพิมพ์รายงานและ Export CSV ภาษาไทย
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Cycle Selector */}
          <select
            value={activeCycleId}
            onChange={(e) => setActiveCycleId(e.target.value)}
            className="bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-500 cursor-pointer"
          >
            {cycles.map(c => (
              <option key={c.id} value={c.id}>{c.cycleCode} ({c.pondCode})</option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="min-h-[42px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 transition"
            title="Export CSV UTF-8 BOM สำหรับเปิดใน Thai Excel ไม่เป็นภาษาต่างดาว"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="min-h-[42px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">{t.printReport}</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE REPORT CARD CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* Printable Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-slate-800">
              <Award className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-black tracking-tight">
                รายงานสรุปผลการเลี้ยงและประสิทธิภาพเชิงเศรษฐศาสตร์
              </h3>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              รอบเลี้ยง: <strong className="font-mono text-emerald-800">{activeCycle?.cycleCode}</strong> | {linkedPond?.name} ({linkedPond?.areaSqm} ตร.ม.)
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500">
            <div>วันที่ออกรายงาน: <strong>{formatDate(new Date().toISOString(), lang, era)}</strong></div>
            <div>อายุการเลี้ยง (DOC): <strong>{daysOfCulture} วัน</strong></div>
          </div>
        </div>

        {/* 4 Core Academic KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* FCR */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-500 block">
              {t.fcr}
            </span>
            <div className="text-2xl font-black text-sky-700 font-mono mt-1">
              {fcr}
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              อาหาร {totalFeedKg.toLocaleString()} กก. / เนื้อ {estimatedCurrentBiomassKg.toLocaleString()} กก.
            </span>
          </div>

          {/* Survival Rate */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-500 block">
              {t.survivalRate}
            </span>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
              {survivalRate}%
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              คงเหลือ ~{Math.round(initialStock * (estimatedSurvival / 100)).toLocaleString()} / {initialStock.toLocaleString()} ตัว
            </span>
          </div>

          {/* ADG */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-500 block">
              {t.adg}
            </span>
            <div className="text-2xl font-black text-indigo-700 font-mono mt-1">
              {adg} <span className="text-sm font-normal text-slate-500">g/day</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              อัตราการโตเฉลี่ยต่อตัวต่อวัน
            </span>
          </div>

          {/* Cost per kg */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-500 block">
              {t.costPerKg}
            </span>
            <div className="text-2xl font-black text-amber-700 font-mono mt-1">
              {costPerKg} <span className="text-sm font-normal text-slate-500">บาท</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              ต้นทุนการผลิตจริงต่อกิโลกรัม
            </span>
          </div>

        </div>

        {/* Cost & Profit Calculations (Configurable) */}
        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
            โครงสร้างต้นทุนและผลตอบแทนทางการเงิน
          </h4>

          {/* Cost input parameters (print:hidden so inputs don't look weird on paper) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 print:hidden">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">ราคาอาหาร (บาท/กก.):</label>
              <input
                type="number"
                value={feedCostPerKg}
                onChange={(e) => setFeedCostPerKg(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">ราคาพันธุ์กุ้ง (บาท/พันตัว):</label>
              <input
                type="number"
                value={plCostPer1000}
                onChange={(e) => setPlCostPer1000(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">ค่าไฟ พลังงาน แรงงาน (บาท):</label>
              <input
                type="number"
                value={energyAndLaborCost}
                onChange={(e) => setEnergyAndLaborCost(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">ราคาขายปากบ่อ (บาท/กก.):</label>
              <input
                type="number"
                value={sellingPricePerKg}
                onChange={(e) => setSellingPricePerKg(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">รายการต้นทุน / รายรับ</th>
                  <th className="py-3 px-4">ปริมาณ / ฐานคำนวณ</th>
                  <th className="py-3 px-4">ราคาต่อหน่วย</th>
                  <th className="py-3 px-4 text-right">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-3 px-4">1. ต้นทุนค่าอาหารกุ้งสำเร็จรูป</td>
                  <td className="py-3 px-4">{totalFeedKg.toLocaleString()} กก.</td>
                  <td className="py-3 px-4">{feedCostPerKg} บาท/กก.</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {totalFeedExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4">2. ต้นทุนพันธุ์ลูกกุ้ง (PL-)</td>
                  <td className="py-3 px-4">{initialStock.toLocaleString()} ตัว</td>
                  <td className="py-3 px-4">{plCostPer1000} บาท/1,000 ตัว</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {totalPlExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4">3. ค่าไฟฟ้า ค่าแอร์เลเตอร์ สารปรับสภาพน้ำ และแรงงาน</td>
                  <td className="py-3 px-4">เหมาจ่ายตลอดรอบ ({daysOfCulture} วัน)</td>
                  <td className="py-3 px-4">-</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {totalOtherExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr className="bg-slate-50/80 font-bold text-slate-900">
                  <td colSpan={3} className="py-3.5 px-4 text-right uppercase">
                    รวมต้นทุนการผลิตทั้งหมด (Total Cost):
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-sm text-rose-700">
                    {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr className="bg-emerald-50/50 font-bold text-emerald-950">
                  <td colSpan={3} className="py-3.5 px-4 text-right uppercase">
                    รายรับประเมินจากการขายกุ้ง (Total Revenue @ {sellingPricePerKg} ฿/kg):
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-sm text-emerald-700">
                    {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr className="bg-emerald-100/70 font-black text-emerald-950 text-sm">
                  <td colSpan={3} className="py-4 px-4 text-right uppercase tracking-wider">
                    กำไรสุทธิโดยประมาณ (Net Profit):
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-base text-emerald-800">
                    {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
