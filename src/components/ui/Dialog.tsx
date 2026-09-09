import React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

// Shared modal foundation: Radix Dialog gives focus trapping, Escape-to-close,
// backdrop-click-to-close, and proper ARIA for free; Framer Motion drives the
// enter/exit animation. Built to replace every hand-rolled `fixed inset-0`
// overlay in the app with one accessible, animated primitive.

interface DialogRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const DialogRoot = ({ open, onOpenChange, children }: DialogRootProps) => (
  <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
    <AnimatePresence>
      {open && (
        <RadixDialog.Portal forceMount>
          <RadixDialog.Overlay asChild forceMount>
            <motion.div
              className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          </RadixDialog.Overlay>
          {children}
        </RadixDialog.Portal>
      )}
    </AnimatePresence>
  </RadixDialog.Root>
);

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
  size?: "sm" | "lg" | "full";
}

const sizeClasses: Record<NonNullable<DialogContentProps["size"]>, string> = {
  sm: "max-w-sm max-h-[85vh]",
  lg: "max-w-2xl max-h-[85vh]",
  full: "max-w-[95vw] max-h-[95vh]",
};

// Radix's `asChild` clones its props (role, aria-*, focus trap) onto whichever
// single element is passed as Content's child - that's the positioning wrapper
// below. The actual animated box is a separate nested element deliberately:
// Framer Motion owns the `transform` CSS property outright once it animates
// scale/x/y, which would silently clobber a Tailwind translate-based centering
// utility on the same element, so centering (flex) and animation (motion) are
// kept on two different elements.
export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, size = "sm" }, ref) => (
    <RadixDialog.Content asChild forceMount onOpenAutoFocus={(e) => { if (size === "full") e.preventDefault(); }}>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <motion.div
          ref={ref}
          className={cn(
            "w-full bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col focus:outline-none",
            sizeClasses[size],
            className
          )}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </RadixDialog.Content>
  )
);
DialogContent.displayName = "DialogContent";

export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;
export const DialogClose = RadixDialog.Close;
