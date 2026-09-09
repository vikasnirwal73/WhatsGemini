import React from "react";
import { FaChevronDown } from "react-icons/fa";
import { cn } from "../../utils/cn";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Slider as ShadcnSlider } from "./slider";

const fieldBase = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 md:text-sm";

export const TextInput = Input;

export const TextArea = Textarea;

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn(fieldBase, "pr-10 appearance-none cursor-pointer", className)} {...props}>
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
        <FaChevronDown size={12} className="text-muted-foreground" />
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
    {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
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
