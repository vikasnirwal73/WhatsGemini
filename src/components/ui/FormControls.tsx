import React from "react";
import { FaChevronDown } from "react-icons/fa";
import { cn } from "../../utils/cn";

const fieldBase = "w-full p-3 bg-app text-ink placeholder-ink-muted rounded-xl border border-line focus:border-primary outline-none transition-all disabled:opacity-50";

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, className)} {...props} />
  )
);
TextInput.displayName = "TextInput";

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, "resize-y min-h-[80px]", className)} {...props} />
  )
);
TextArea.displayName = "TextArea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn(fieldBase, "pr-10 appearance-none cursor-pointer", className)} {...props}>
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
        <FaChevronDown size={12} className="text-ink-muted" />
      </div>
    </div>
  )
);
Select.displayName = "Select";

interface FieldLabelProps {
  children: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({ children, hint, className }) => (
  <div className={cn("mb-1.5", className)}>
    <label className="block text-sm font-medium text-ink">{children}</label>
    {hint && <p className="text-xs text-ink-muted mt-0.5">{hint}</p>}
  </div>
);

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  className?: string;
}

// A single filled-track slider using the real accent color, replacing the
// hardcoded #a78bfa/#fb923c/#38bdf8 rainbow gradient that was disconnected
// from the app's actual palette.
export const Slider: React.FC<SliderProps> = ({ value, min, max, step, onChange, className }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary", className)}
      style={{
        background: `linear-gradient(to right, rgb(var(--color-primary)) 0%, rgb(var(--color-primary)) ${pct}%, rgb(var(--color-border-main)) ${pct}%, rgb(var(--color-border-main)) 100%)`,
      }}
    />
  );
};
