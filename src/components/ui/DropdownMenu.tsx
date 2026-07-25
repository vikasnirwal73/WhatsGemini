import React, { useState } from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

// Tap/click-triggered menu (Radix's default - no hover dependency), unlike the
// opacity-0 group-hover pattern this replaces, which had no equivalent on touch.

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DropdownMenu = ({ trigger, children, align = "end", open: openProp, onOpenChange }: DropdownMenuProps) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;

  return (
    <RadixDropdownMenu.Root open={open} onOpenChange={setOpen}>
      <RadixDropdownMenu.Trigger asChild>{trigger}</RadixDropdownMenu.Trigger>
      <AnimatePresence>
        {open && (
          <RadixDropdownMenu.Portal forceMount>
            <RadixDropdownMenu.Content asChild align={align} sideOffset={6} forceMount>
              <motion.div
                className="z-[70] min-w-[170px] py-1.5 rounded-xl shadow-xl border border-line bg-panel focus:outline-none"
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.12 }}
              >
                {children}
              </motion.div>
            </RadixDropdownMenu.Content>
          </RadixDropdownMenu.Portal>
        )}
      </AnimatePresence>
    </RadixDropdownMenu.Root>
  );
};

interface DropdownMenuItemProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
}

export const DropdownMenuItem = ({ icon: Icon, label, onClick, disabled, danger, active }: DropdownMenuItemProps) => (
  <RadixDropdownMenu.Item
    onSelect={onClick}
    disabled={disabled}
    className={cn(
      "flex items-center gap-3 mx-1.5 px-3 py-2 text-sm rounded-lg outline-none select-none",
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer data-[highlighted]:bg-app",
      danger ? "text-red-500" : active ? "text-primary" : "text-ink"
    )}
  >
    <Icon size={14} />
    <span>{label}</span>
  </RadixDropdownMenu.Item>
);

// Divider between logical groups of items (e.g. page actions vs. app nav vs.
// session) inside a dropdown - mirrors the vertical dividers used between the
// same groups in Header's desktop icon row.
export const DropdownMenuSeparator = () => (
  <RadixDropdownMenu.Separator className="h-px bg-line my-1.5 mx-1.5" />
);
