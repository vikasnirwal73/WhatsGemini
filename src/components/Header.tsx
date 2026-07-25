import React, { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaArrowLeft, FaSun, FaMoon, FaUserFriends, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useSidebar } from "../contexts/SidebarContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { AuthContext } from "../contexts/AuthContext";
import { DARK } from "../utils/constants";
import { cn } from "../utils/cn";

interface HeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  avatar?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export const iconBtnClass = "flex items-center justify-center w-9 h-9 rounded-[10px] border border-line bg-panel2 text-ink-muted hover:bg-hover hover:text-ink transition flex-shrink-0";
const iconBtnActiveClass = "flex items-center justify-center w-9 h-9 rounded-[10px] border border-primary bg-panel2 text-primary hover:bg-hover transition flex-shrink-0";

const Header: React.FC<HeaderProps> = ({ title, subtitle, avatar, onBack, actions }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { open } = useSidebar();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);
  const isDark = theme === DARK;
  const isCharacters = location.pathname.startsWith("/characters");
  const isSettings = location.pathname.startsWith("/settings");

  return (
    <header className="h-[60px] flex-shrink-0 border-b border-line bg-panel flex items-center gap-2.5 px-3 md:px-4 z-20">
      <button onClick={open} title="Menu" aria-label="Open menu" className={cn(iconBtnClass, "md:hidden")}>
        <FaBars size={16} />
      </button>

      {onBack && (
        <button
          onClick={onBack}
          title="Back"
          aria-label="Back"
          className="flex items-center gap-2 h-9 px-3 rounded-[10px] border border-line bg-panel2 text-ink-muted hover:text-ink hover:border-primary transition text-[13px] font-medium flex-shrink-0"
        >
          <FaArrowLeft size={13} /> <span className="hidden sm:inline">Back</span>
        </button>
      )}

      <div className="flex items-center gap-2.5 min-w-0">
        {avatar}
        <div className="min-w-0 leading-tight">
          <div className="text-[14.5px] font-semibold truncate text-ink">{title}</div>
          {subtitle && <div className="text-[11.5px] text-ink-muted truncate">{subtitle}</div>}
        </div>
      </div>

      <div className="flex-1" />

      {actions && <div className="flex items-center gap-1">{actions}</div>}

      <button onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme" className={iconBtnClass}>
        {isDark ? <FaSun size={15} /> : <FaMoon size={15} />}
      </button>
      <button onClick={() => navigate("/characters")} title="Characters" aria-label="Characters" className={isCharacters ? iconBtnActiveClass : iconBtnClass}>
        <FaUserFriends size={16} />
      </button>
      <button onClick={() => navigate("/settings")} title="Settings" aria-label="Settings" className={isSettings ? iconBtnActiveClass : iconBtnClass}>
        <FaCog size={16} />
      </button>
      <div className="w-px h-6 bg-line mx-0.5 hidden sm:block flex-shrink-0" />
      <button
        onClick={logout}
        title="Log out"
        aria-label="Log out"
        className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-[10px] border border-line text-ink-muted hover:text-red-500 hover:border-red-500/50 transition text-[12.5px] font-medium flex-shrink-0"
      >
        <FaSignOutAlt size={13} /> Logout
      </button>
    </header>
  );
};

export default Header;
