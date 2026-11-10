import { useEffect } from 'react';

interface ShortcutHandlers {
  onNavigateTab: (tabId: string, label: string) => void;
  onToggleShortcutsModal: () => void;
}

export function useGlobalKeyboardShortcuts({
  onNavigateTab,
  onToggleShortcutsModal,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = 
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        (e.target as HTMLElement)?.isContentEditable;

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;

      // Toggle shortcuts help on '?' (Shift + /) when not inside an input
      if (!isInput && e.key === '?' && !isCtrlOrMeta && !isAlt) {
        e.preventDefault();
        onToggleShortcutsModal();
        return;
      }

      // Toggle shortcuts on Ctrl + /
      if (isCtrlOrMeta && e.key === '/') {
        e.preventDefault();
        onToggleShortcutsModal();
        return;
      }

      // 1. Water Quality Log (Ctrl+F1 or Alt+1)
      if ((isCtrlOrMeta && e.key === 'F1') || (isAlt && e.key === '1')) {
        e.preventDefault();
        onNavigateTab('water', 'โมดูล A: บันทึกค่าน้ำ (F5/F9)');
        return;
      }

      // 2. Feeding Calculator (Ctrl+F2 or Alt+2)
      if ((isCtrlOrMeta && e.key === 'F2') || (isAlt && e.key === '2')) {
        e.preventDefault();
        onNavigateTab('feeding', 'โมดูล B: คำนวณอาหาร (F6)');
        return;
      }

      // 3. Disease Checker (Ctrl+F3 or Alt+3)
      if ((isCtrlOrMeta && e.key === 'F3') || (isAlt && e.key === '3')) {
        e.preventDefault();
        onNavigateTab('disease', 'โมดูล C: ตรวจเช็คอาการโรค (F8)');
        return;
      }

      // 4. Today Dashboard (Ctrl+F4 or Alt+4)
      if ((isCtrlOrMeta && e.key === 'F4') || (isAlt && e.key === '4')) {
        e.preventDefault();
        onNavigateTab('today', 'หน้า วันนี้ (ภารกิจประจำวัน)');
        return;
      }

      // 5. Farm, Ponds & Cycles (Ctrl+F5 or Alt+5)
      if ((isCtrlOrMeta && e.key === 'F5') || (isAlt && e.key === '5')) {
        e.preventDefault();
        onNavigateTab('farm', 'ฟาร์ม บ่อ และรอบเลี้ยง (CC-)');
        return;
      }

      // 6. Hatchery & Stocking (Ctrl+F6 or Alt+6)
      if ((isCtrlOrMeta && e.key === 'F6') || (isAlt && e.key === '6')) {
        e.preventDefault();
        onNavigateTab('hatchery', 'โรงเพาะฟักและปล่อยกุ้ง (PL-)');
        return;
      }

      // 7. Medicine & Gate (Ctrl+F7 or Alt+7)
      if ((isCtrlOrMeta && e.key === 'F7') || (isAlt && e.key === '7')) {
        e.preventDefault();
        onNavigateTab('medicine', 'ยาและประตูตรวจก่อนจับ (Gate)');
        return;
      }

      // 8. Traceability Timeline (Ctrl+F8 or Alt+8)
      if ((isCtrlOrMeta && e.key === 'F8') || (isAlt && e.key === '8')) {
        e.preventDefault();
        onNavigateTab('traceability', 'แปรรูป ส่งออก และตรวจสอบย้อนกลับ');
        return;
      }

      // 9. Finance & Reports (Ctrl+F9 or Alt+9)
      if ((isCtrlOrMeta && e.key === 'F9') || (isAlt && e.key === '9')) {
        e.preventDefault();
        onNavigateTab('finance', 'ต้นทุน กำไร และรายงานทางวิชาการ');
        return;
      }

      // 10. Admin Settings (Ctrl+F10 or Alt+0)
      if ((isCtrlOrMeta && e.key === 'F10') || (isAlt && e.key === '0')) {
        e.preventDefault();
        onNavigateTab('admin', 'การตั้งค่าระบบ (Admin)');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNavigateTab, onToggleShortcutsModal]);
}
