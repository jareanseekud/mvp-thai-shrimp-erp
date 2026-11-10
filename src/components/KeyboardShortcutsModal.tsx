import React from 'react';
import { Keyboard, X, Sparkles, Command } from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  actionTh: string;
  actionEn: string;
  category: string;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'th' | 'en';
}

export const SHORTCUTS_LIST: ShortcutItem[] = [
  { keys: ['Ctrl', 'F1'], actionTh: 'เปิดโมดูล A: บันทึกค่าน้ำ (F5/F9)', actionEn: 'Open Module A: Water Quality Logs', category: 'โมดูลหลัก' },
  { keys: ['Ctrl', 'F2'], actionTh: 'เปิดโมดูล B: คำนวณอาหาร (F6)', actionEn: 'Open Module B: Feeding Calculator', category: 'โมดูลหลัก' },
  { keys: ['Ctrl', 'F3'], actionTh: 'เปิดโมดูล C: ตรวจเช็คอาการโรค (F8)', actionEn: 'Open Module C: Disease Checker', category: 'โมดูลหลัก' },
  { keys: ['Ctrl', 'F4'], actionTh: 'เปิดหน้า วันนี้ (ภารกิจรายบ่อ)', actionEn: 'Open Today Dashboard', category: 'การนำทาง' },
  { keys: ['Ctrl', 'F5'], actionTh: 'เปิดหน้า ฟาร์ม บ่อ และรอบเลี้ยง (CC-)', actionEn: 'Open Farm, Ponds & Cycles', category: 'การนำทาง' },
  { keys: ['Ctrl', 'F6'], actionTh: 'เปิดหน้า โรงเพาะฟักและปล่อยกุ้ง (PL-)', actionEn: 'Open Hatchery & Stocking', category: 'การนำทาง' },
  { keys: ['Ctrl', 'F7'], actionTh: 'เปิดหน้า ยาและประตูตรวจก่อนจับ (Gate)', actionEn: 'Open Medicine & Harvest Gate', category: 'การนำทาง' },
  { keys: ['Ctrl', 'F8'], actionTh: 'เปิดหน้า แปรรูปและตรวจสอบย้อนกลับ', actionEn: 'Open Traceability & Timeline', category: 'การนำทาง' },
  { keys: ['Ctrl', 'F9'], actionTh: 'เปิดหน้า ต้นทุน กำไร และรายงาน FCR', actionEn: 'Open Finance & Reports', category: 'การนำทาง' },
  { keys: ['Ctrl', 'F10'], actionTh: 'เปิดหน้า ตั้งค่าระบบ (Admin)', actionEn: 'Open Admin Settings', category: 'การนำทาง' },
  { keys: ['Alt', '1-9'], actionTh: 'ทางลัดสำรองสำหรับเบราว์เซอร์ (Alt+1 ถึง Alt+9)', actionEn: 'Alternative browser shortcut (Alt+1 to Alt+9)', category: 'ทางเลือกสำรอง' },
  { keys: ['?'], actionTh: 'เปิด/ปิดหน้าต่างแสดงคีย์ลัดนี้', actionEn: 'Toggle keyboard shortcuts guide', category: 'ระบบ' },
  { keys: ['Esc'], actionTh: 'ปิดหน้าต่างป๊อปอัป / คีย์ลัด', actionEn: 'Close popup or modal', category: 'ระบบ' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  lang = 'th',
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div 
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-title font-bold text-slate-900">
                {lang === 'th' ? 'คีย์ลัดบนแป้นพิมพ์ (Keyboard Shortcuts)' : 'Keyboard Shortcuts'}
              </h2>
              <p className="text-caption text-slate-500">
                {lang === 'th' ? 'นำทางในแอปได้รวดเร็วโดยไม่ต้องใช้เมาส์' : 'Fast navigation without mouse'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="space-y-2">
            {SHORTCUTS_LIST.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 text-caption"
              >
                <span className="text-slate-700 font-medium truncate">
                  {lang === 'th' ? item.actionTh : item.actionEn}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  {item.keys.map((k, kIdx) => (
                    <kbd 
                      key={kIdx}
                      className="px-2 py-1 text-[11px] font-mono font-bold text-slate-800 bg-slate-100 border border-slate-300 rounded-md shadow-2xs"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-sky-50/70 border border-sky-200/80 rounded-xl text-caption text-sky-900">
            <strong>คำแนะนำ:</strong> สามารถกด <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white border border-sky-300 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white border border-sky-300 rounded">F1-F3</kbd> หรือ <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white border border-sky-300 rounded">Alt</kbd> + <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white border border-sky-300 rounded">1-3</kbd> ได้จากทุกหน้าจอ
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-caption font-semibold rounded-xl transition"
          >
            {lang === 'th' ? 'เข้าใจแล้ว (Esc)' : 'Got it (Esc)'}
          </button>
        </div>
      </div>
    </div>
  );
};
