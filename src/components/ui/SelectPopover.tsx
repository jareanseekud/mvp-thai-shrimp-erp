import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface SelectPopoverProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  label?: string;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  id?: string;
  'aria-label'?: string;
}

export function SelectPopover<T extends string = string>({
  value,
  onChange,
  options,
  label,
  placeholder = 'เลือกตัวเลือก...',
  className = '',
  buttonClassName = '',
  id,
  'aria-label': ariaLabel,
}: SelectPopoverProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const selectedOption = options.find(opt => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        const idx = options.findIndex(o => o.value === value);
        setActiveIndex(idx >= 0 ? idx : 0);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < options.length) {
        onChange(options[activeIndex].value);
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} onKeyDown={handleKeyDown}>
      {label && (
        <label htmlFor={selectId} className="block text-label mb-1.5 font-medium">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={buttonRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || label}
        onClick={() => {
          setIsOpen(!isOpen);
          const idx = options.findIndex(o => o.value === value);
          setActiveIndex(idx >= 0 ? idx : 0);
        }}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-body text-slate-800 hover:border-slate-300 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition shadow-xs ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 truncate font-medium">
          {selectedOption?.icon}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Popover (16px / rounded-2xl) with gentle stagger */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[220px] max-w-sm rounded-2xl bg-white border border-slate-200/90 shadow-xl py-1.5 backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <ul
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            className="max-h-60 overflow-y-auto py-1 px-1 space-y-0.5"
          >
            {options.map((option, idx) => {
              const isSelected = option.value === value;
              const isHighlighted = idx === activeIndex;

              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    buttonRef.current?.focus();
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer select-none transition-colors duration-100 ${
                    isSelected
                      ? 'bg-orange-50 text-orange-950 font-bold border border-orange-200'
                      : isHighlighted
                      ? 'bg-slate-100/80 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  style={{ animationDelay: `${idx * 15}ms` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {option.icon}
                    <div className="min-w-0">
                      <div className="truncate">{option.label}</div>
                      {option.sublabel && (
                        <div className="text-[10px] text-slate-400 truncate">{option.sublabel}</div>
                      )}
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#FF7A1A] shrink-0" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
