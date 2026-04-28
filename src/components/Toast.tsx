import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
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
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = "success", duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const isError = type === "error";

  return (
    <div
      className={cn(
        "toast",
        isLeaving && "toast--leaving",
        isError ? "toast--error" : "toast--success"
      )}
      role="alert"
    >
      <div className="toast__icon">
        {isError ? <FaExclamationCircle size={18} /> : <FaCheckCircle size={18} />}
      </div>
      <p className="toast__message">{message}</p>
      <button onClick={handleClose} className="toast__close" aria-label="Close">
        <FaTimes size={14} />
      </button>
    </div>
  );
};

// Toast Container to manage multiple toasts
interface ToastContainerProps {
  toasts: ToastData[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;
