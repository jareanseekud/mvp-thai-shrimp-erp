import React from 'react';
import { 
  Waves, UserCheck, Globe, Calendar, LogOut, 
  Building2, ChevronDown, Keyboard, Home, ArrowLeft,
  Sparkles, Eye, EyeOff
} from 'lucide-react';
import { UserRole, SyncState, Farm, UserProfile } from '../types';
import { Language, CalendarEra, translations } from '../lib/i18n';
import { SyncBanner } from './SyncBanner';
import { PWAInstallButton } from './PWAInstallButton';
import { SelectPopover, SelectOption } from './ui/SelectPopover';
import { RoleIcon25D } from './ui/RoleIcon25D';

interface HeaderProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
  era: CalendarEra;
  onEraChange: (era: CalendarEra) => void;
  syncState: SyncState;
  isOnline: boolean;
  farms: Farm[];
  selectedFarmId: string;
  onFarmChange: (farmId: string) => void;
  onOpenShortcuts?: () => void;
  onNavigateHome?: () => void;
  onNavigateBack?: () => void;
  onOpenTutorial?: () => void;
  reduceMotion?: boolean;
  onToggleReduceMotion?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  currentRole,
  onRoleChange,
  lang,
  onLangChange,
  era,
  onEraChange,
  syncState,
  isOnline,
  farms,
  selectedFarmId,
  onFarmChange,
  onOpenShortcuts,
  onNavigateHome,
  onNavigateBack,
  onOpenTutorial,
  reduceMotion = false,
  onToggleReduceMotion,
}) => {
  const t = translations[lang];

  const roleOptions: SelectOption<UserRole>[] = [
    { value: 'owner', label: 'เจ้าของฟาร์ม (Owner)', sublabel: 'สิทธิ์สูงสุด / การเงิน', icon: <RoleIcon25D role="owner" size={26} /> },
    { value: 'technician', label: 'ช่างเทคนิค (Tech)', sublabel: 'ค่าน้ำ / อาหาร / โรค', icon: <RoleIcon25D role="technician" size={26} /> },
    { value: 'hatchery', label: 'โรงเพาะฟัก (Hatchery)', sublabel: 'ล็อต PL- / PCR', icon: <RoleIcon25D role="hatchery" size={26} /> },
    { value: 'processor', label: 'โรงงานแปรรูป (Processor)', sublabel: 'ล็อต PR- / Yield', icon: <RoleIcon25D role="processor" size={26} /> },
    { value: 'exporter', label: 'ผู้ส่งออก (Exporter)', sublabel: 'ล็อต EX- / ตลาดโลก', icon: <RoleIcon25D role="exporter" size={26} /> },
    { value: 'auditor', label: 'ผู้ตรวจประเมิน (Auditor)', sublabel: 'ตรวจสอบย้อนกลับ', icon: <RoleIcon25D role="auditor" size={26} /> },
    { value: 'admin', label: 'ผู้ดูแลระบบ (Admin)', sublabel: 'เกณฑ์มาตรฐานระบบ', icon: <RoleIcon25D role="admin" size={26} /> },
    { value: 'public', label: 'บุคคลทั่วไป (Public)', sublabel: 'ตรวจสอบ QR สาธารณะ', icon: <RoleIcon25D role="trace" size={26} /> },
  ];

  const farmOptions: SelectOption<string>[] = farms.map(f => ({
    value: f.id,
    label: f.name,
    sublabel: `${f.province} (${f.standardCertifications[0] || 'GAP'})`,
  }));

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#FF7A1A]/20 shadow-xs">
      
      {/* Offline Alert Strip if Offline */}
      {!isOnline && (
        <aside aria-label="สถานะการเชื่อมต่อ" className="bg-amber-500 text-amber-950 px-4 py-1.5 text-[15px] font-bold text-center flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-950 animate-ping" />
          <span>โหมดออฟไลน์: บันทึกข้อมูลลงเครื่องอัตโนมัติ และจะเชื่อมต่อซิงก์ขึ้นคลาวด์เมื่อสัญญาณกลับมา</span>
        </aside>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          
          {/* Left: Permanent Navigation Buttons (Home + Back) + Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            
            {/* Permanent Back Button */}
            {onNavigateBack && (
              <button
                type="button"
                onClick={onNavigateBack}
                className="min-h-[48px] px-3.5 rounded-2xl bg-white hover:bg-orange-50 border-2 border-orange-200 text-slate-800 text-[16px] font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-[0.97] cursor-pointer"
                title="ย้อนกลับไปหน้าที่แล้ว"
                aria-label="ย้อนกลับ"
              >
                <ArrowLeft className="w-5 h-5 text-[#FF7A1A]" />
                <span className="hidden sm:inline">ย้อนกลับ</span>
              </button>
            )}

            {/* Permanent Home Button */}
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="min-h-[48px] px-3.5 rounded-2xl bg-white hover:bg-orange-50 border-2 border-orange-200 text-slate-800 text-[16px] font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-[0.97] cursor-pointer"
                title="กลับหน้าแรก (วันนี้)"
                aria-label="หน้าแรก"
              >
                <Home className="w-5 h-5 text-[#FF7A1A]" />
                <span className="hidden sm:inline">หน้าแรก</span>
              </button>
            )}

            {/* Logo & Brand */}
            <div className="flex items-center gap-2.5 min-w-0 ml-1">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF7A1A] to-[#E25800] flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                <Waves className="w-6 h-6" />
              </div>
              <div className="min-w-0 hidden md:block">
                <div className="flex items-center gap-2">
                  <span className="text-[18px] font-black text-slate-900 tracking-tight truncate">
                    {t.appTitle}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold uppercase bg-orange-100 text-[#FF7A1A] rounded-md border border-orange-200">
                    GAP MVP
                  </span>
                </div>
                <p className="text-[13px] font-semibold text-slate-400 truncate">
                  {farms.find(f => f.id === selectedFarmId)?.name || 'ระบบฟาร์มกุ้งไทย'}
                </p>
              </div>
            </div>

          </div>

          {/* Center: Sync Status & Tutorial Button */}
          <div className="hidden xl:flex items-center gap-3">
            <SyncBanner syncState={syncState} isOnline={isOnline} lang={lang} />
            <PWAInstallButton lang={lang} />
          </div>

          {/* Right: Controls & Role Switcher Popover */}
          <div className="flex items-center gap-2">
            
            {/* 3-Step Tutorial Quick Button */}
            {onOpenTutorial && (
              <button
                type="button"
                onClick={onOpenTutorial}
                className="min-h-[46px] px-3.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-[#FF7A1A] border border-orange-200 text-[15px] font-bold flex items-center gap-1.5 transition active:scale-[0.97] cursor-pointer"
                title="เปิดโหมดสอนใช้งานแบบรูปภาพ 3 ขั้นตอน"
                aria-label="สอนใช้งาน"
              >
                <Sparkles className="w-4 h-4 text-[#FF7A1A]" />
                <span className="hidden lg:inline">สอนใช้งาน (3 ขั้น)</span>
              </button>
            )}

            {/* Reduce Motion Accessibility Toggle */}
            {onToggleReduceMotion && (
              <button
                type="button"
                onClick={onToggleReduceMotion}
                className={`min-h-[46px] px-3 rounded-2xl border text-[14px] font-bold flex items-center gap-1.5 transition active:scale-[0.97] cursor-pointer ${
                  reduceMotion 
                    ? 'bg-amber-100 border-amber-300 text-amber-900' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
                title={reduceMotion ? 'เปิดอนิเมชั่น' : 'ลดการเคลื่อนไหว (สำหรับคนเวียนหัวง่าย)'}
                aria-label="ลดการเคลื่อนไหว"
              >
                {reduceMotion ? <EyeOff className="w-4 h-4 text-amber-700" /> : <Eye className="w-4 h-4 text-slate-500" />}
                <span className="hidden xl:inline">{reduceMotion ? 'ปิดอนิเมชั่น' : 'อนิเมชั่นปกติ'}</span>
              </button>
            )}

            {/* Farm Selector Popover */}
            {currentRole !== 'public' && farmOptions.length > 0 && (
              <div className="hidden lg:block">
                <SelectPopover
                  value={selectedFarmId}
                  onChange={onFarmChange}
                  options={farmOptions}
                  buttonClassName="min-h-[46px] px-3 text-[14px] font-bold border-orange-200/80 rounded-2xl"
                  aria-label="เลือกฟาร์ม"
                />
              </div>
            )}

            {/* Role Switcher Popover with 2.5D Icons */}
            <SelectPopover
              value={currentRole}
              onChange={onRoleChange}
              options={roleOptions}
              buttonClassName="min-h-[46px] px-3.5 text-[15px] font-bold text-slate-900 border-2 border-orange-200/80 bg-white hover:bg-orange-50/50 rounded-2xl shadow-2xs"
              aria-label="สลับบทบาทการใช้งาน"
            />

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => onLangChange(lang === 'th' ? 'en' : 'th')}
              className="min-h-[46px] px-3 text-[14px] font-bold text-slate-700 hover:text-slate-900 hover:bg-orange-50 rounded-2xl border border-orange-200/80 flex items-center gap-1 transition"
              title="สลับภาษา / Switch Language"
              aria-label="สลับภาษาไทยและอังกฤษ"
            >
              <Globe className="w-4 h-4 text-[#FF7A1A]" />
              <span>{lang === 'th' ? 'TH' : 'EN'}</span>
            </button>

            {/* Calendar Era Toggle */}
            <button
              type="button"
              onClick={() => onEraChange(era === 'buddhist' ? 'gregorian' : 'buddhist')}
              className="hidden sm:flex min-h-[46px] items-center gap-1 px-3 text-[14px] font-bold text-slate-700 hover:text-slate-900 hover:bg-orange-50 rounded-2xl border border-orange-200/80 transition"
              title="สลับ พ.ศ. / ค.ศ."
              aria-label="สลับระบบปฏิทิน พุทธศักราช และคริสต์ศักราช"
            >
              <Calendar className="w-4 h-4 text-[#FF7A1A]" />
              <span>{era === 'buddhist' ? 'พ.ศ.' : 'ค.ศ.'}</span>
            </button>

            {/* Logout / Switch User Button */}
            {currentUser && (
              <button
                type="button"
                onClick={onLogout}
                className="min-h-[46px] px-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl border border-slate-200 transition"
                title="ออกจากระบบ / สลับบัญชี"
                aria-label="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
