import React, { ReactNode } from "react";
import { FaTimes } from "react-icons/fa";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "./ui/dialog";
import { Button } from "./ui/button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="default">
        <DialogHeader className="flex-row items-center justify-between space-y-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-auto w-auto p-1 -m-1 rounded-full text-muted-foreground hover:text-foreground" aria-label="Close">
              <FaTimes />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 flex flex-col gap-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
