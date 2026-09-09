import React, { ReactNode } from "react";
import { FaTimes } from "react-icons/fa";
import { DialogRoot, DialogContent, DialogTitle, DialogClose } from "./ui/Dialog";
import { Button } from "./ui/button";

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
        <div className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
          <DialogTitle asChild>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-auto w-auto p-1 -m-1 rounded-full text-muted-foreground hover:text-foreground" aria-label="Close">
              <FaTimes />
            </Button>
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
