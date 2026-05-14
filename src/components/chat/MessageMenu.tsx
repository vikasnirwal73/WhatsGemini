import React, { useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

// Message Menu Component
export const MessageMenu = ({
  isOpen,
  onClose,
  children,
  isUserMessage,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isUserMessage?: boolean;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-8 right-0 z-50 min-w-[140px] py-1 rounded-lg shadow-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    >
      {children}
    </div>
  );
};

export const MenuItem = ({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'w-full flex items-center gap-3 px-4 py-2 text-sm transition',
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700',
      danger ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'
    )}
  >
    <Icon size={14} />
    <span>{label}</span>
  </button>
);
