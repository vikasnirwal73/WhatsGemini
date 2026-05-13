import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  title?: string;
  className?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  title,
  className = ""
}) => {
  return (
    <label 
      title={title}
      className={`flex items-center gap-2 cursor-pointer text-sm transition select-none ${disabled ? 'opacity-50 pointer-events-none' : ''} ${checked ? 'text-indigo-500 dark:text-indigo-400 font-medium' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'} ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div className={`flex-shrink-0 w-9 h-5 rounded-full flex items-center px-0.5 transition-colors duration-300 ease-in-out ${checked ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-slate-700'}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </div>
      {label && <span>{label}</span>}
    </label>
  );
};

export default ToggleSwitch;
