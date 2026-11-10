import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, ChevronLeft, X, Sparkles, HelpCircle } from 'lucide-react';
import { RoleIcon25D } from './ui/RoleIcon25D';

interface FarmerTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FarmerTutorialModal: React.FC<FarmerTutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'ขั้นตอนที่ 1: เลือกบ่อเลี้ยงและดูสถานะน้ำ',
      subtitle: 'เปิดแอปมาจะเห็นบ่อของคุณทันที ตัวเลขใหญ่ ชัดเจน ไม่ต้องเพ่ง',
      icon: 'pond' as const,
      color: 'from-orange-500/10 to-orange-500/5',
      highlights: [
        'สังเกตสีแถบสถานะ: สีเขียว = ปกติสบายใจ, สีแดง = มีปัญหาต้องรีบดู',
        'ดูออกซิเจน (DO) ตัวเลขใหญ่ชัดเจน ถ้าน้อยกว่า 3.5 เครื่องจะเตือนทันที',
        'กดเลือกบ่อ 1, บ่อ 2 ได้ง่ายๆ ด้วยนิ้วโป้งเดียว'
      ]
    },
    {
      title: 'ขั้นตอนที่ 2: กดปุ่มใหญ่ "ให้อาหารแล้ว" หรือ "บันทึกน้ำ"',
      subtitle: 'ปุ่มใหญ่พิเศษ 56-64 มม. กดง่ายแม้เปียกน้ำหรือใส่ถุงมือริมบ่อ',
      icon: 'feed' as const,
      color: 'from-amber-500/10 to-amber-500/5',
      highlights: [
        'ให้อาหารเสร็จ กดปุ่ม "ให้อาหารแล้ว" ครั้งเดียว จบงานมื้อนั้นทันที',
        'มีระบบคำนวณอาหารให้เสร็จสรรพตามน้ำหนักกุ้ง ไม่ต้องกดเครื่องคิดเลข',
        'ตรวจถาดเช็คอาหารแล้วติ๊กเลือกได้ง่าย หมดเกลี้ยง หรือเหลือเยอะ'
      ]
    },
    {
      title: 'ขั้นตอนที่ 3: ระบบเตือนน้ำเสีย พร้อมบอกวิธีแก้ภาษาบ้านๆ',
      subtitle: 'ไม่ต้องงงกับศัพท์ยาก ถ้ามีปัญหาจะบอกตรงๆ ว่าต้องทำอะไร',
      icon: 'alert' as const,
      color: 'from-rose-500/10 to-rose-500/5',
      highlights: [
        'เตือนสีแดงชัดเจน เช่น "ออกซิเจนต่ำ เสี่ยงตายยกบ่อ! รีบเปิดใบพัดน้ำด่วน"',
        'มีเบอร์โทรสัตวแพทย์และผู้เชี่ยวชาญ กดปุ่มเดียวโทรออกได้ทันที',
        'บันทึกแล้ว ข้อมูลไม่หาย ทำงานได้แม้อยู่ริมบ่อไม่มีสัญญาณเน็ต'
      ]
    }
  ];

  const activeStepData = steps[currentStep];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-[24px] border border-[#FF7A1A]/30 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-orange-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF7A1A] to-[#E25800] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[22px] font-bold text-slate-900 leading-tight">
                สอนใช้งานง่ายๆ 3 ขั้นตอน
              </h3>
              <p className="text-[15px] text-slate-500">
                สำหรับเกษตรกรผู้เลี้ยงกุ้ง มือเปียกก็กดง่าย
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-orange-50 hover:bg-orange-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress */}
        <div className="flex items-center justify-between gap-2">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
                idx === currentStep 
                  ? 'bg-[#FF7A1A]' 
                  : idx < currentStep 
                  ? 'bg-orange-300' 
                  : 'bg-slate-100'
              }`}
            />
          ))}
        </div>

        {/* Step Card Content */}
        <div className={`p-6 rounded-3xl bg-gradient-to-br ${activeStepData.color} border border-orange-200/80 space-y-4`}>
          <div className="flex items-center gap-4">
            <RoleIcon25D role={activeStepData.icon as any} size={64} />
            <div>
              <span className="text-[13px] font-bold uppercase tracking-wider text-[#FF7A1A]">
                ขั้นตอนที่ {currentStep + 1} จาก 3
              </span>
              <h4 className="text-[20px] font-bold text-slate-900 leading-snug">
                {activeStepData.title}
              </h4>
            </div>
          </div>

          <p className="text-[17px] font-medium text-slate-700">
            {activeStepData.subtitle}
          </p>

          <ul className="space-y-2.5 pt-2 border-t border-orange-200/50">
            {activeStepData.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[16px] text-slate-800">
                <CheckCircle2 className="w-5 h-5 text-[#FF7A1A] shrink-0 mt-0.5" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Navigation Buttons (>=56px) */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="min-h-[56px] px-6 rounded-2xl border-2 border-orange-200 hover:bg-orange-50 text-slate-800 text-[18px] font-bold flex items-center gap-2 active:scale-[0.97] transition cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>ย้อนกลับ</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="min-h-[56px] flex-1 max-w-xs px-6 rounded-2xl bg-gradient-to-r from-[#FF7A1A] to-[#E25800] hover:from-[#E25800] hover:to-[#B33E00] text-white text-[18px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-[0.97] transition cursor-pointer ml-auto"
            >
              <span>ถัดไป</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[56px] flex-1 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-[18px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.97] transition cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>เข้าใจแล้ว เริ่มใช้งานเลย!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
