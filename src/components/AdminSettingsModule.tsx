import React, { useState } from 'react';
import { 
  Settings, Shield, Users, FileCheck, History, Sliders, 
  Plus, Check, Trash2, Key, Mail, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { 
  WaterStandards, FeedingRateConfig, DiseaseCriteria, DrugConfig, 
  AuditLog, FarmInvite, UserConsent, UserRole 
} from '../types';
import { Language, CalendarEra, translations, formatDate } from '../lib/i18n';
import { 
  DEFAULT_WATER_STANDARDS, DEFAULT_FEEDING_RATES, 
  DEFAULT_DISEASES, DEFAULT_DRUGS 
} from '../lib/constants';

interface AdminSettingsModuleProps {
  standards: WaterStandards;
  onUpdateStandards: (newStandards: WaterStandards) => Promise<void>;
  feedingRates: FeedingRateConfig[];
  onUpdateFeedingRates: (rates: FeedingRateConfig[]) => Promise<void>;
  auditLogs: AuditLog[];
  currentRole: UserRole;
  selectedFarmId: string;
  lang: Language;
  era: CalendarEra;
}

export const AdminSettingsModule: React.FC<AdminSettingsModuleProps> = ({
  standards,
  onUpdateStandards,
  feedingRates,
  onUpdateFeedingRates,
  auditLogs,
  currentRole,
  selectedFarmId,
  lang,
  era,
}) => {
  const t = translations[lang];

  const [activeSubTab, setActiveSubTab] = useState<'standards' | 'feeding' | 'invites' | 'consent' | 'audit'>('standards');

  // Editable Standards State
  const [editableStandards, setEditableStandards] = useState<WaterStandards>({ ...standards });
  const [isStandardsSaving, setIsStandardsSaving] = useState(false);

  // Farm Invites State
  const [invites, setInvites] = useState<FarmInvite[]>([
    {
      id: 'inv-1',
      farmId: selectedFarmId,
      farmName: 'ฟาร์มทรัพย์สมบูรณ์ กุ้งทอง',
      email: 'tech.somchai@shrimpmail.th',
      role: 'technician',
      invitedBy: 'เจ้าของฟาร์ม (Owner)',
      status: 'accepted',
      createdAt: '2026-08-01',
    },
    {
      id: 'inv-2',
      farmId: selectedFarmId,
      farmName: 'ฟาร์มทรัพย์สมบูรณ์ กุ้งทอง',
      email: 'auditor.gap@dof.go.th',
      role: 'auditor',
      invitedBy: 'เจ้าของฟาร์ม (Owner)',
      status: 'pending',
      createdAt: '2026-11-01',
    }
  ]);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState<UserRole>('technician');

  // Revocable Consent State (Owner Controlled)
  const [consentPublicTrace, setConsentPublicTrace] = useState(true);
  const [consentAuditorFinancial, setConsentAuditorFinancial] = useState(false);

  // Audit Logs Filter
  const [auditSearch, setAuditSearch] = useState('');

  const handleSaveStandards = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStandardsSaving(true);
    try {
      await onUpdateStandards(editableStandards);
      alert('บันทึกค่ามาตรฐานค่าน้ำเรียบร้อยแล้ว');
    } finally {
      setIsStandardsSaving(false);
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteEmail) return;
    const newInv: FarmInvite = {
      id: `inv-${Date.now()}`,
      farmId: selectedFarmId,
      farmName: 'ฟาร์มทรัพย์สมบูรณ์ กุ้งทอง',
      email: newInviteEmail,
      role: newInviteRole,
      invitedBy: 'คุณสมศักดิ์ (Owner)',
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setInvites(prev => [newInv, ...prev]);
    setNewInviteEmail('');
    alert(`ส่งคำเชิญไปยัง ${newInviteEmail} เรียบร้อยแล้ว`);
  };

  const filteredAudit = auditLogs.filter(a => 
    a.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.userName.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-slate-800">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              การตั้งค่าระบบ (Admin & Owner Panel)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ปรับแต่งเกณฑ์ค่าน้ำ ตารางอาหาร สิทธิ์สมาชิกฟาร์ม ความยินยอม Consent และ Audit Log
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('standards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'standards' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            ค่าน้ำมาตรฐาน
          </button>
          <button
            onClick={() => setActiveSubTab('feeding')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'feeding' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            ตารางอาหาร
          </button>
          <button
            onClick={() => setActiveSubTab('invites')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'invites' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            เชิญสมาชิกฟาร์ม
          </button>
          <button
            onClick={() => setActiveSubTab('consent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'consent' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Consent ข้อมูล
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'audit' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Audit Log
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: WATER QUALITY STANDARDS */}
      {activeSubTab === 'standards' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">
              เกณฑ์ค่ามาตรฐานคุณภาพน้ำและการเตือนภัย (Admin Configuration)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              แก้ไขช่วง Optimal และระดับวิกฤตที่ต้องแสดงการ์ดเตือนในโมดูล A
            </p>
          </div>

          <form onSubmit={handleSaveStandards} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* DO */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase block">ออกซิเจน (DO)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Optimal ต่ำสุด:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editableStandards.doOptimalMin}
                      onChange={(e) => setEditableStandards({ ...editableStandards, doOptimalMin: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Optimal สูงสุด:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editableStandards.doOptimalMax}
                      onChange={(e) => setEditableStandards({ ...editableStandards, doOptimalMax: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 font-bold bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-rose-600 font-bold block">เตือนแดงวิกฤต (&lt;):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editableStandards.doAlertRed}
                    onChange={(e) => setEditableStandards({ ...editableStandards, doAlertRed: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1 text-xs rounded border border-rose-300 font-bold bg-white text-rose-700"
                  />
                </div>
              </div>

              {/* pH */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase block">ความเป็นกรด-ด่าง (pH)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Optimal ต่ำสุด:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editableStandards.phOptimalMin}
                      onChange={(e) => setEditableStandards({ ...editableStandards, phOptimalMin: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Optimal สูงสุด:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editableStandards.phOptimalMax}
                      onChange={(e) => setEditableStandards({ ...editableStandards, phOptimalMax: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 font-bold bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-rose-600 font-bold block">เตือนต่ำ (&lt;):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editableStandards.phAlertLow}
                      onChange={(e) => setEditableStandards({ ...editableStandards, phAlertLow: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1 text-xs rounded border border-rose-300 font-bold bg-white text-rose-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-rose-600 font-bold block">เตือนสูง (&gt;):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editableStandards.phAlertHigh}
                      onChange={(e) => setEditableStandards({ ...editableStandards, phAlertHigh: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1 text-xs rounded border border-rose-300 font-bold bg-white text-rose-700"
                    />
                  </div>
                </div>
              </div>

              {/* Salinity */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase block">ความเค็ม (Salinity ppt)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Optimal ต่ำสุด:</label>
                    <input
                      type="number"
                      value={editableStandards.salinityOptimalMin}
                      onChange={(e) => setEditableStandards({ ...editableStandards, salinityOptimalMin: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Optimal สูงสุด:</label>
                    <input
                      type="number"
                      value={editableStandards.salinityOptimalMax}
                      onChange={(e) => setEditableStandards({ ...editableStandards, salinityOptimalMax: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 font-bold bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-amber-700 font-bold block">เตือนเปลี่ยนเกิน (ppt/วัน):</label>
                  <input
                    type="number"
                    value={editableStandards.salinityMaxDailyChange}
                    onChange={(e) => setEditableStandards({ ...editableStandards, salinityMaxDailyChange: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1 text-xs rounded border border-amber-300 font-bold bg-white text-amber-800"
                  />
                </div>
              </div>

              {/* Ammonia TAN */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase block">แอมโมเนีย (Ammonia TAN)</span>
                <div>
                  <label className="text-[10px] text-rose-600 font-bold block">เตือนแดงวิกฤต (&gt; mg/L):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editableStandards.ammoniaAlertRed}
                    onChange={(e) => setEditableStandards({ ...editableStandards, ammoniaAlertRed: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1 text-xs rounded border border-rose-300 font-bold bg-white text-rose-700"
                  />
                </div>
              </div>

              {/* Nitrite */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase block">ไนไตรท์ (Nitrite NO₂⁻)</span>
                <div>
                  <label className="text-[10px] text-amber-700 font-bold block">เตือนเมื่อเกิน (&gt; mg/L):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editableStandards.nitriteAlert}
                    onChange={(e) => setEditableStandards({ ...editableStandards, nitriteAlert: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1 text-xs rounded border border-amber-300 font-bold bg-white text-amber-800"
                  />
                </div>
              </div>

              {/* Alkalinity */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase block">อัลคาไลน์ (Alkalinity)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Optimal ต่ำสุด:</label>
                    <input
                      type="number"
                      value={editableStandards.alkalinityOptimalMin}
                      onChange={(e) => setEditableStandards({ ...editableStandards, alkalinityOptimalMin: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Optimal สูงสุด:</label>
                    <input
                      type="number"
                      value={editableStandards.alkalinityOptimalMax}
                      onChange={(e) => setEditableStandards({ ...editableStandards, alkalinityOptimalMax: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 font-bold bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-rose-600 font-bold block">เตือนแดงกุ้งเปลือกนิ่ม (&lt; mg/L):</label>
                  <input
                    type="number"
                    value={editableStandards.alkalinityAlertRed}
                    onChange={(e) => setEditableStandards({ ...editableStandards, alkalinityAlertRed: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1 text-xs rounded border border-rose-300 font-bold bg-white text-rose-700"
                  />
                </div>
              </div>

            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isStandardsSaving}
                className="min-h-[48px] px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                บันทึกการตั้งค่าค่าน้ำมาตรฐาน
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 2: FEEDING RATES TABLE */}
      {activeSubTab === 'feeding' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">
              ตารางอัตราการกินอาหารมาตรฐาน (%Feeding Rate Table)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ตารางวิชาการอ้างอิงตามช่วงน้ำหนักตัวเฉลี่ย (ABW) และจำนวนมื้อต่อวัน
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">ช่วงน้ำหนักตัว ABW (กรัม)</th>
                  <th className="py-3 px-4">อัตราอาหาร (% Feeding Rate)</th>
                  <th className="py-3 px-4">จำนวนมื้อมาตรฐานต่อวัน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {feedingRates.map((cfg, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      {cfg.abwMin} - {cfg.abwMax > 100 ? '>30' : cfg.abwMax} g
                    </td>
                    <td className="py-3 px-4 font-bold text-sky-700 font-mono">
                      {cfg.rateMinPercent}% - {cfg.rateMaxPercent}%
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {cfg.defaultMeals} มื้อ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: FARM MEMBER INVITATIONS */}
      {activeSubTab === 'invites' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">
              ระบบเชิญสมาชิกเข้าร่วมฟาร์ม (Farm Member Invites)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              เพิ่มช่างเทคนิค ผู้ตรวจประเมิน (Auditor) หรือคู่ค้า โดยกำหนดบทบาท (Role) อย่างชัดเจน
            </p>
          </div>

          {/* Invite Form */}
          <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={newInviteEmail}
              onChange={(e) => setNewInviteEmail(e.target.value)}
              placeholder="ระบุอีเมลผู้รับคำเชิญ เช่น somchai@farm.com"
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-indigo-500"
              required
            />
            <select
              value={newInviteRole}
              onChange={(e) => setNewInviteRole(e.target.value as UserRole)}
              className="px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-300 focus:outline-indigo-500 bg-white"
            >
              <option value="technician">ช่างเทคนิค (Technician)</option>
              <option value="auditor">ผู้ตรวจประเมิน (Auditor)</option>
              <option value="hatchery">โรงเพาะฟัก (Hatchery)</option>
              <option value="processor">โรงงานแปรรูป (Processor)</option>
              <option value="exporter">ผู้ส่งออก (Exporter)</option>
            </select>
            <button
              type="submit"
              className="min-h-[46px] px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              ส่งคำเชิญ
            </button>
          </form>

          {/* Invites List */}
          <div className="space-y-2 pt-2">
            {invites.map(inv => (
              <div 
                key={inv.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inv.email}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    บทบาท: <strong>{inv.role}</strong> | เชิญโดย: {inv.invitedBy}
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  inv.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {inv.status === 'accepted' ? 'ยอมรับแล้ว' : 'รอการตอบรับ'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: REVOCABLE CONSENT */}
      {activeSubTab === 'consent' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">
              ระบบจัดการความยินยอมการเปิดเผยข้อมูล (Revocable Consent)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              เจ้าของฟาร์มมีสิทธิเปิดหรือเพิกถอนความยินยอมในการเปิดเผยข้อมูลให้สาธารณะและผู้ตรวจประเมินได้ตลอดเวลา
            </p>
          </div>

          <div className="space-y-4">
            
            <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  1. ยินยอมเปิดเผยข้อมูลห่วงโซ่การผลิตสู่สาธารณะ (Public Traceability)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  อนุญาตให้ผู้บริโภคที่สแกน QR Code ตรวจสอบข้อมูลฟาร์ม มาตรฐาน GAP และล็อตลูกกุ้ง (ไม่รวมข้อมูลต้นทุน)
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={consentPublicTrace}
                  onChange={(e) => setConsentPublicTrace(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  2. ยินยอมให้ผู้ตรวจประเมิน (Auditor) เข้าถึงข้อมูลต้นทุนและ FCR
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  อนุญาตให้ Auditor ดูรายงาน FCR และการใช้อาหารเพื่อการรับรองมาตรฐาน Carbon Footprint / ASC
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={consentAuditorFinancial}
                  onChange={(e) => setConsentAuditorFinancial(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 5: AUDIT LOG */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900">
                บันทึกการตรวจสอบระบบ (Audit Log - Immutable Trail)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                บันทึกทุกการแก้ไขค่าด้วยมือ การปิดรอบเลี้ยง การสร้างล็อตจับ และการปรับเปลี่ยนสิทธิ
              </p>
            </div>

            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="ค้นหา Log..."
              className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-300 w-full sm:w-60"
            />
          </div>

          <div className="space-y-2.5">
            {filteredAudit.map((log) => (
              <div 
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {log.action}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {formatDate(log.timestamp, lang, era)} {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                  </span>
                </div>
                <div className="text-slate-800 font-medium">
                  {log.details}
                </div>
                <div className="text-[11px] text-slate-500">
                  ผู้ปฏิบัติการ: <strong>{log.userName}</strong> ({log.userRole})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
