import React, { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-xl flex flex-col overflow-hidden max-h-[80vh]">
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" aria-label="Close">
            <FaTimes />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
