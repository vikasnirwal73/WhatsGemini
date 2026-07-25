import React, { useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils/cn";

export interface ToastData {
  id: string;
  message: string;
  type: "success" | "error";
  duration?: number;
}

interface ToastProps {
  message: string;
  type?: "success" | "error";
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = "success", duration = 5000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const isError = type === "error";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[280px] max-w-[400px]",
        isError ? "bg-red-500 text-white" : "bg-primary text-onAccent"
      )}
      role="alert"
    >
      <div className="flex-shrink-0">
        {isError ? <FaExclamationCircle size={18} /> : <FaCheckCircle size={18} />}
      </div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button onClick={onClose} className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition" aria-label="Close">
        <FaTimes size={14} />
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastData[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
