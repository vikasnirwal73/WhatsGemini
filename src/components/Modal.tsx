import React, { ReactNode } from "react";
import { FaTimes } from "react-icons/fa";
import { DialogRoot, DialogContent, DialogTitle, DialogClose } from "./ui/Dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <DialogRoot open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <div className="p-4 border-b border-line flex justify-between items-center flex-shrink-0">
          <DialogTitle asChild>
            <h2 className="text-lg font-bold text-ink">{title}</h2>
          </DialogTitle>
          <DialogClose asChild>
            <button className="text-ink-muted hover:text-ink transition p-1 -m-1 rounded-full" aria-label="Close">
              <FaTimes />
            </button>
          </DialogClose>
        </div>
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
          {children}
        </div>
      </DialogContent>
    </DialogRoot>
  );
};

export default Modal;
