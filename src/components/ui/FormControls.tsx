import React from "react";
import { FaChevronDown } from "react-icons/fa";
import { cn } from "../../utils/cn";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Slider as ShadcnSlider } from "./slider";

const fieldBase = "w-full p-3 bg-panel2 text-ink placeholder-ink-faint rounded-xl border border-line focus:border-primary outline-none transition-all disabled:opacity-50";

export const TextInput = Input;

export const TextArea = Textarea;

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
  htmlFor?: string;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({ children, hint, className, htmlFor }) => (
  <div className={cn("mb-1.5", className)}>
    <Label htmlFor={htmlFor}>{children}</Label>
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

// Adapts this app's single-number Slider API onto Radix's array-valued Slider
// (which supports multi-thumb ranges we don't need here).
export const Slider: React.FC<SliderProps> = ({ value, min, max, step, onChange, className }) => (
  <ShadcnSlider
    value={[value]}
    min={min}
    max={max}
    step={step}
    onValueChange={([v]) => onChange(v)}
    className={className}
  />
);
