import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function CustomSelect({ value, onChange, options, placeholder = "اختر...", className = "" }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border text-sm outline-none transition-all duration-300 shadow-sm hover:shadow-md ${
          open 
            ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20 bg-white' 
            : value 
              ? 'bg-[var(--primary-light)]/40 border-[var(--primary)]/40 text-[var(--primary)] font-bold' 
              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
        }`}
      >
        <span className="truncate ml-2">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-300 ${open ? 'rotate-180 text-[var(--primary)]' : value ? 'text-[var(--primary)]' : 'text-gray-400'}`} 
        />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1.5 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden origin-top animate-[toast-animate-in_0.2s_ease-out]">
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'bg-[var(--primary-light)]/50 text-[var(--primary)] font-bold' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={14} className="text-[var(--primary)]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
