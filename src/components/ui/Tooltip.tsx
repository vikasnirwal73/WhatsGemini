import React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";

export const TooltipProvider = RadixTooltip.Provider;

interface TooltipProps {
  label: string;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
}

// Wraps a single focusable/interactive child (usually an icon button) with a
// hover/focus tooltip describing what it does - icon-only buttons otherwise
// give no clue what they do until clicked.
export const Tooltip: React.FC<TooltipProps> = ({ label, children, side = "bottom" }) => (
  <RadixTooltip.Root delayDuration={300}>
    <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        side={side}
        sideOffset={6}
        className="z-[80] px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[12px] font-medium shadow-lg select-none"
      >
        {label}
        <RadixTooltip.Arrow className="fill-foreground" width={8} height={4} />
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  </RadixTooltip.Root>
);
