import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaArrowLeft, FaSun, FaMoon, FaUserFriends, FaCog, FaSignOutAlt, FaEllipsisV, FaQuestionCircle } from "react-icons/fa";
import { useSidebar } from "../contexts/SidebarContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { AuthContext } from "../contexts/AuthContext";
import { DARK } from "../utils/constants";
import { cn } from "../utils/cn";
import { Tooltip } from "./ui/Tooltip";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "./ui/DropdownMenu";
import { Button } from "./ui/button";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";

// A single header icon action, described once and rendered two ways: as a
// tooltipped icon button in the desktop row, and as a labeled row in the
// mobile "more" menu - so page-specific actions (e.g. ChatPage's Export/
// Compress/Follow-up) don't need to hand-build both layouts themselves.
export interface HeaderAction {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
}

interface HeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  avatar?: React.ReactNode;
  onBack?: () => void;
  // Page-specific action groups (e.g. Chat's Export/Compress/Follow-up),
  // rendered before the built-in App/Session groups, each separated by a divider.
  actionGroups?: HeaderAction[][];
}

export const iconBtnClass = "flex items-center justify-center w-9 h-9 rounded-[10px] border border-border bg-muted text-muted-foreground hover:bg-hover hover:text-foreground transition flex-shrink-0";
const iconBtnActiveClass = "flex items-center justify-center w-9 h-9 rounded-[10px] border border-primary bg-muted text-primary hover:bg-hover transition flex-shrink-0";
const iconBtnDangerClass = "flex items-center justify-center w-9 h-9 rounded-[10px] border border-border bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition flex-shrink-0";

const Header: React.FC<HeaderProps> = ({ title, subtitle, avatar, onBack, actionGroups = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { open } = useSidebar();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);
  const isDark = theme === DARK;
  const isCharacters = location.pathname.startsWith("/characters");
  const isSettings = location.pathname.startsWith("/settings");
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Global "?" shortcut to open the help overlay - guarded so it doesn't
  // fire while the user is actually typing "?" into a text field.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "?" || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const isEditable = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isEditable) return;
      e.preventDefault();
      setShowShortcuts(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Built-in groups, always appended after any page-specific ones: app-level
  // navigation, then the destructive session action on its own.
  const appGroup: HeaderAction[] = [
    { icon: isDark ? FaSun : FaMoon, label: "Toggle theme", onClick: toggleTheme },
    { icon: FaQuestionCircle, label: "Keyboard shortcuts", onClick: () => setShowShortcuts(true) },
    { icon: FaUserFriends, label: "Characters", onClick: () => navigate("/characters"), active: isCharacters },
    { icon: FaCog, label: "Settings", onClick: () => navigate("/settings"), active: isSettings },
  ];
  const sessionGroup: HeaderAction[] = [
    { icon: FaSignOutAlt, label: "Log out", onClick: logout, danger: true },
  ];

  const groups = [...actionGroups, appGroup, sessionGroup].filter((g) => g.length > 0);

  return (
    <header className="h-[60px] flex-shrink-0 border-b border-border bg-card flex items-center gap-2.5 px-3 md:px-4 z-20">
      <Button onClick={open} variant="outline" size="icon" title="Menu" aria-label="Open menu" className={cn(iconBtnClass, "md:hidden")}>
        <FaBars size={16} />
      </Button>

      {onBack && (
        <Button
          onClick={onBack}
          variant="outline"
          title="Back"
          aria-label="Back"
          className="h-9 px-3 rounded-[10px] bg-muted text-muted-foreground hover:text-foreground hover:border-primary text-[13px] font-medium flex-shrink-0"
        >
          <FaArrowLeft size={13} /> <span className="hidden sm:inline">Back</span>
        </Button>
      )}

      <div className="flex items-center gap-2.5 min-w-0">
        {avatar}
        <div className="min-w-0 leading-tight">
          <div className="text-[14.5px] font-semibold truncate text-foreground">{title}</div>
          {subtitle && <div className="text-[11.5px] text-muted-foreground truncate">{subtitle}</div>}
        </div>
      </div>

      <div className="flex-1" />

      {/* Desktop: full row of tooltipped icon buttons, grouped with dividers */}
      <div className="hidden md:flex items-center gap-1">
        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="w-px h-6 bg-border mx-1 flex-shrink-0" />}
            {group.map((action, ai) => (
              <Tooltip key={ai} label={action.label}>
                <Button
                  onClick={action.onClick}
                  disabled={action.disabled}
                  variant="outline"
                  size="icon"
                  aria-label={action.label}
                  className={cn(
                    action.danger ? iconBtnDangerClass : action.active ? iconBtnActiveClass : iconBtnClass,
                    action.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <action.icon size={15} />
                </Button>
              </Tooltip>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile: everything above collapses into one menu so buttons stop crowding the header */}
      <div className="md:hidden">
        <DropdownMenu
          trigger={
            <Button variant="outline" size="icon" aria-label="More options" className={iconBtnClass}>
              <FaEllipsisV size={15} />
            </Button>
          }
        >
          {groups.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <DropdownMenuSeparator />}
              {group.map((action, ai) => (
                <DropdownMenuItem
                  key={ai}
                  icon={action.icon}
                  label={action.label}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  active={action.active}
                  danger={action.danger}
                />
              ))}
            </React.Fragment>
          ))}
        </DropdownMenu>
      </div>

      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </header>
  );
};

export default Header;
