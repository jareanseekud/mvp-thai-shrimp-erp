import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { 
  Mail, Lock, User, ArrowRight, Check, AlertCircle, 
  Sparkles, LogIn, UserPlus, HelpCircle, Waves
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { UserRole, UserProfile } from '../types';
import { Language, translations } from '../lib/i18n';
import { RoleIcon25D } from './ui/RoleIcon25D';
import { FarmerTutorialModal } from './FarmerTutorialModal';

interface AuthScreenProps {
  onAuthenticated: (user: UserProfile) => void;
  lang: Language;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated, lang }) => {
  const t = translations[lang];

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  
  // Dev convenience auto-fill per role (editable by user)
  const devCredentials: Record<UserRole, { email: string; name: string; org: string }> = {
    owner: { email: 'owner@thaisrimp.com', name: 'คุณสมศักดิ์ รุ่งเรืองพัฒนา', org: 'ฟาร์มทรัพย์สมบูรณ์ กุ้งทอง' },
    technician: { email: 'tech@thaisrimp.com', name: 'นายช่างสมชาย มั่นคง', org: 'ฝ่ายปฏิบัติการภาคสนาม' },
    hatchery: { email: 'hatchery@thaisrimp.com', name: 'สยามมารีน แฮตเชอรี', org: 'ศูนย์เพาะฟักลูกกุ้ง SPF' },
    processor: { email: 'processor@thaisrimp.com', name: 'สุราษฎร์มารีน ซีฟู้ด', org: 'โรงงานแปรรูปอาหารทะเล' },
    exporter: { email: 'exporter@thaisrimp.com', name: 'ไทยยูเนียน เอ็กซ์พอร์ต', org: 'ฝ่ายส่งออกตลาดต่างประเทศ' },
    auditor: { email: 'auditor@thaisrimp.com', name: 'ผู้ตรวจประเมิน GAP/CoC', org: 'กรมประมง กระทรวงเกษตรฯ' },
    admin: { email: 'admin@thaisrimp.com', name: 'ผู้ดูแลระบบกลาง', org: 'ศูนย์บริหารจัดการข้อมูล' },
    public: { email: 'guest@thaisrimp.com', name: 'บุคคลทั่วไป', org: 'ผู้บริโภค' },
  };

  const [email, setEmail] = useState<string>(devCredentials[selectedRole].email);
  const [password, setPassword] = useState<string>('Shrimp1234@!');
  const [displayName, setDisplayName] = useState<string>(devCredentials[selectedRole].name);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The 7 primary roles matching the user's reference image
  const rolesList: { role: UserRole; titleTh: string; titleEn: string }[] = [
    { role: 'owner', titleTh: 'เจ้าของฟาร์ม', titleEn: '(Owner)' },
    { role: 'technician', titleTh: 'ช่างเทคนิค', titleEn: '(Technician)' },
    { role: 'hatchery', titleTh: 'โรงเพาะฟัก', titleEn: '(Hatchery)' },
    { role: 'processor', titleTh: 'โรงงานแปรรูป', titleEn: '(Processor)' },
    { role: 'exporter', titleTh: 'ผู้ส่งออก', titleEn: '(Exporter)' },
    { role: 'auditor', titleTh: 'ผู้ตรวจประเมิน', titleEn: '(Auditor)' },
    { role: 'admin', titleTh: 'ผู้ดูแลระบบ', titleEn: '(Admin)' },
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(devCredentials[role].email);
    setDisplayName(devCredentials[role].name);
    setErrorMessage(null);
    navigator.vibrate?.(10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Validation with clear explanation of what to fix
    if (!email || !email.includes('@')) {
      setErrorMessage('กรุณาแก้ไข: รูปแบบอีเมลไม่ถูกต้อง ต้องมีเครื่องหมาย @ เช่น farm@gmail.com');
      setIsLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('กรุณาแก้ไข: รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        try {
          const res = await createUserWithEmailAndPassword(auth, email, password);
          if (res.user) {
            await updateProfile(res.user, { displayName });
          }
        } catch (authErr: any) {
          console.warn('Firebase Auth note:', authErr.message);
        }
      } else {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (authErr: any) {
          console.warn('Firebase Auth note:', authErr.message);
        }
      }

      onAuthenticated({
        uid: auth.currentUser?.uid || `user-${Date.now()}`,
        email,
        displayName: displayName || devCredentials[selectedRole].name,
        role: selectedRole,
        farmId: 'farm-001',
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setErrorMessage(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบข้อมูล'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Subtle Orange Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#FF7A1A]/12 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Top Bar with Brand & 3-Step Tutorial Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF7A1A] to-[#E25800] text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Waves className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-farmer-title tracking-tight text-slate-900 font-extrabold">
                กุ้งไทยครบวงจร MVP
              </h1>
              <p className="text-[15px] font-medium text-slate-600">
                ระบบจัดการฟาร์มกุ้งและตรวจสอบย้อนกลับมาตรฐาน GAP/CoC
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            className="self-start sm:self-auto min-h-[48px] px-5 rounded-2xl bg-white/90 hover:bg-orange-50 border-2 border-[#FF7A1A]/30 text-[#FF7A1A] hover:text-[#E25800] text-[16px] font-bold flex items-center gap-2 shadow-xs transition active:scale-[0.97] cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-[#FF7A1A]" />
            <span>สอนใช้งาน 3 ขั้นตอน</span>
          </button>
        </div>

        {/* ROLE SELECTION HEADER - MATCHING THE REFERENCE IMAGE EXACTLY */}
        <div className="glass-card p-6 sm:p-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-orange-100 pb-3">
            <h2 className="text-[22px] sm:text-[24px] font-bold text-slate-900 tracking-tight">
              2. เลือกบทบาทหน้าที่ของคุณ (Role):
            </h2>
            <span className="text-[17px] font-semibold text-slate-500">
              แยก Onboarding ตามสายงาน
            </span>
          </div>

          {/* 7 Role Cards Grid - Matching Reference Image */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {rolesList.map(({ role, titleTh, titleEn }) => {
              const isSelected = selectedRole === role;

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`p-5 rounded-[22px] text-left transition-all duration-200 flex flex-col justify-between min-h-[160px] cursor-pointer active:scale-[0.97] ${
                    isSelected
                      ? 'glass-card-selected'
                      : 'glass-card hover:border-[#FF7A1A]/40'
                  }`}
                  aria-pressed={isSelected}
                >
                  {/* 2.5D Orange Icon with Crisp White Outline */}
                  <div className="mb-3">
                    <RoleIcon25D role={role} size={54} />
                  </div>

                  {/* Thai Role Title & English Subtitle */}
                  <div>
                    <div className="text-[18px] sm:text-[19px] font-bold text-slate-950 leading-tight">
                      {titleTh}
                    </div>
                    <div className="text-[15px] font-semibold text-slate-600 mt-0.5">
                      {titleEn}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Login Form Section (1 Job = 1 Screen) */}
          <div className="pt-6 border-t border-orange-100 space-y-5">
            
            {/* Mode Switcher */}
            <div className="flex items-center justify-center p-1.5 bg-orange-50/80 rounded-2xl max-w-sm mx-auto border border-orange-200/60">
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMessage(null); }}
                className={`flex-1 min-h-[44px] text-[16px] font-bold rounded-xl transition ${
                  mode === 'signin' 
                    ? 'bg-white text-[#FF7A1A] shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เข้าสู่ระบบ (Sign In)
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMessage(null); }}
                className={`flex-1 min-h-[44px] text-[16px] font-bold rounded-xl transition ${
                  mode === 'signup' 
                    ? 'bg-white text-[#FF7A1A] shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ลงทะเบียน (Sign Up)
              </button>
            </div>

            {/* Error Message with Specific Correction Instructions */}
            {errorMessage && (
              <div 
                role="alert" 
                className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-900 text-[17px] font-bold flex items-start gap-3 shadow-xs animate-in fade-in duration-150"
              >
                <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[18px] font-black text-rose-800">โปรดตรวจสอบข้อมูล</div>
                  <div className="mt-0.5 text-rose-700 font-medium">{errorMessage}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
              
              {mode === 'signup' && (
                <div>
                  <label className="block text-[17px] font-bold text-slate-800 mb-1.5">
                    ชื่อ-นามสกุล / ชื่อผู้ใช้งาน
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="farmer-input w-full pl-12"
                      placeholder="เช่น คุณสมศักดิ์ รุ่งเรืองพัฒนา"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[17px] font-bold text-slate-800 mb-1.5">
                  อีเมลเข้าใช้งาน (บัญชีชั่วคราวสำหรับทดสอบ แก้ไขได้)
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="farmer-input w-full pl-12"
                    placeholder="กรอกอีเมลของคุณ"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[17px] font-bold text-slate-800 mb-1.5">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="farmer-input w-full pl-12"
                    placeholder="กรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร"
                    required
                  />
                </div>
              </div>

              {/* Submit Button (>= 60px) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="farmer-btn-primary w-full min-h-[62px] text-[19px] disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>กำลังเข้าสู่ระบบ...</span>
                  ) : mode === 'signin' ? (
                    <>
                      <LogIn className="w-6 h-6" />
                      <span>เข้าสู่ระบบเป็น {rolesList.find(r => r.role === selectedRole)?.titleTh}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-6 h-6" />
                      <span>ลงทะเบียนและเริ่มต้นใช้งาน</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>

        </div>

      </div>

      {/* 3-Step Tutorial Modal */}
      <FarmerTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

    </div>
  );
};
