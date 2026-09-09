import React from 'react';
import { cn } from '../../utils/cn';

interface SegmentedOption {
  value: string;
  label: React.ReactNode;
}

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  disabled?: boolean;
  className?: string;
}

// A pill-group toggle replacing a <select> for short enumerated choices
// (font size, aspect ratio, safety threshold, reference-image mode) - the
// redesign's own annotation on the Safety screen calls this out explicitly:
// "One segmented control per category instead of four dropdowns."
export const SegmentedControl: React.FC<SegmentedControlProps> = ({ value, onChange, options, disabled, className }) => (
  <div
    className={cn(
      "inline-flex flex-wrap gap-0.5 p-[3px] rounded-lg bg-background border border-input",
      disabled && "opacity-50 pointer-events-none",
      className
    )}
  >
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "h-8 px-3.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors",
            active ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);
