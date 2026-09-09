import React from 'react';
import { cn } from '../../utils/cn';

interface SettingsCardProps {
  className?: string;
  children: React.ReactNode;
}

// A grouped card of settings rows, hairline-divided between children -
// matches the "WhatsGemini Redesign" canvas's settings-tab screens (2a-2e):
// a rounded card per logical group, each field sitting on its own row with
// a divider instead of the old stacked-label-above-field layout.
export const SettingsCard: React.FC<SettingsCardProps> = ({ className, children }) => (
  <div className={cn("rounded-xl bg-card border border-border/50 overflow-hidden", className)}>
    <div className="divide-y divide-border/40">{children}</div>
  </div>
);

interface SettingsCardHeaderProps {
  title: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}

// A card-level header (e.g. "Provider", "Output") - distinct from a row's own
// left-side label, used when a card groups a heading + free-form content
// (like a pill picker) above its regular rows.
export const SettingsCardHeader: React.FC<SettingsCardHeaderProps> = ({ title, hint, className }) => (
  <div className={cn("flex items-baseline justify-between gap-4 flex-wrap", className)}>
    <h4 className="font-semibold text-[14.5px] text-foreground">{title}</h4>
    {hint && <span className="text-xs text-subtle">{hint}</span>}
  </div>
);

interface SettingsRowProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  align?: "center" | "start";
  className?: string;
}

// One field row: a fixed-width label+hint column on the left, the actual
// control on the right - the grid-template-columns:220px 1fr pattern used
// throughout the redesign's settings screens.
export const SettingsRow: React.FC<SettingsRowProps> = ({ label, hint, children, align = "center", className }) => (
  <div
    className={cn(
      "px-5 py-4 grid grid-cols-1 sm:grid-cols-[220px_minmax(0,1fr)] gap-2.5 sm:gap-5",
      align === "start" ? "sm:items-start" : "sm:items-center",
      className
    )}
  >
    <div>
      <div className="text-sm font-medium text-foreground">{label}</div>
      {hint && <div className="text-xs text-subtle mt-0.5 leading-relaxed">{hint}</div>}
    </div>
    <div className="min-w-0">{children}</div>
  </div>
);
