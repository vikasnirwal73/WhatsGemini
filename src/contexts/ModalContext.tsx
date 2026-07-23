import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import Modal from "../components/Modal";

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  isConfirm: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  showAlert: (title: string, message: string) => Promise<void>;
  showConfirm: (title: string, message: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
    isConfirm: false,
  });

  const showAlert = useCallback((title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        isConfirm: false,
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve();
        },
      });
    });
  }, []);

  const showConfirm = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        isConfirm: true,
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  // Escape/backdrop-click land here too since they route through onClose -> onCancel
  // (or onConfirm for a plain alert, which only has one exit path).
  const handleClose = modalState.isConfirm ? modalState.onCancel : modalState.onConfirm;

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      <Modal isOpen={modalState.isOpen} onClose={() => handleClose?.()} title={modalState.title}>
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${modalState.isConfirm ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-secondary/15 text-secondary'}`}>
            {modalState.isConfirm ? <FaExclamationTriangle size={18} /> : <FaInfoCircle size={18} />}
          </div>
          <p className="text-ink-muted text-sm flex-1">
            {modalState.message}
          </p>
        </div>

        <div className="flex gap-3 justify-end mt-3">
          {modalState.isConfirm && (
            <button
              onClick={modalState.onCancel}
              className="px-4 py-2 text-sm font-medium text-ink-muted bg-app rounded-lg hover:bg-panel2 transition"
            >
              Cancel
            </button>
          )}
          <button
            onClick={modalState.onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition ${
              modalState.isConfirm
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary hover:bg-primary-hover'
            }`}
          >
            {modalState.isConfirm ? 'Confirm' : 'OK'}
          </button>
        </div>
      </Modal>
    </ModalContext.Provider>
  );
};
