import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";

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

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-sm bg-app-light dark:bg-panel-dark rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700/50 overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${modalState.isConfirm ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                  {modalState.isConfirm ? <FaExclamationTriangle size={18} /> : <FaInfoCircle size={18} />}
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                  {modalState.title}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-slate-300 text-sm mb-6 ml-1">
                {modalState.message}
              </p>
              
              <div className="flex gap-3 justify-end">
                {modalState.isConfirm && (
                  <button
                    onClick={modalState.onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={modalState.onConfirm}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition ${
                    modalState.isConfirm 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-indigo-500 hover:bg-indigo-600'
                  }`}
                >
                  {modalState.isConfirm ? 'Confirm' : 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </ModalContext.Provider>
  );
};
