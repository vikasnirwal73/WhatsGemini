import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaArrowLeft, FaSun, FaMoon, FaUserFriends, FaCog, FaSignOutAlt, FaEllipsisV, FaQuestionCircle } from "react-icons/fa";
import { useSidebar } from "../contexts/SidebarContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { AuthContext } from "../contexts/AuthContext";
import { DARK } from "../utils/constants";
import { cn } from "../utils/cn";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";

// A single header icon action, described once and rendered two ways: as a
// tooltipped icon button in the desktop row, and as a labeled row in the
// mobile "more" menu - so page-specific actions (e.g. ChatPage's Export/
// Compress/Follow-up) don't need to hand-build both layouts themselves.
export interface HeaderAction {
  icon: React.ComponentType<{ size?: number; className?: string }>;
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

export const iconBtnClass = "flex items-center justify-center w-9 h-9 rounded-lg border-0 shadow-none bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground transition flex-shrink-0";
const iconBtnActiveClass = "flex items-center justify-center w-9 h-9 rounded-lg border-0 shadow-none bg-primary/[0.14] text-primary hover:bg-primary/[0.2] transition flex-shrink-0";
const iconBtnDangerClass = "flex items-center justify-center w-9 h-9 rounded-lg border-0 shadow-none bg-transparent text-subtle hover:bg-destructive/10 hover:text-destructive transition flex-shrink-0";

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
    <header className="h-[60px] flex-shrink-0 border-b border-border/40 bg-card flex items-center gap-2.5 px-3 md:px-4 z-20">
      <Button onClick={open} variant="outline" size="icon" title="Menu" aria-label="Open menu" className={cn(iconBtnClass, "md:hidden")}>
        <FaBars size={16} />
      </Button>

      {onBack && (
        <Button
          onClick={onBack}
          variant="outline"
          title="Back"
          aria-label="Back"
          className="h-9 px-3 rounded-lg border-0 shadow-none bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground text-[13px] font-medium flex-shrink-0"
        >
          <FaArrowLeft size={13} /> <span className="hidden sm:inline">Back</span>
        </Button>
      )}

      <div className="flex items-center gap-2.5 min-w-0">
        {avatar}
        <div className="min-w-0 leading-tight">
          <div className={cn("text-[15px] font-semibold truncate text-foreground", avatar ? "font-serif" : "font-sans")}>{title}</div>
          {subtitle && (
            <div className="text-[11.5px] text-muted-foreground truncate flex items-center gap-1.5">
              {avatar && <span className="w-[6px] h-[6px] rounded-full bg-success flex-shrink-0" />}
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1" />

      {/* Desktop: full row of tooltipped icon buttons, grouped with dividers */}
      <div className="hidden md:flex items-center gap-1">
        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="w-px h-6 bg-border/50 mx-1 flex-shrink-0" />}
            {group.map((action, ai) => (
              <Tooltip key={ai}>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>{action.label}</TooltipContent>
              </Tooltip>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile: everything above collapses into one menu so buttons stop crowding the header */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More options" className={iconBtnClass}>
              <FaEllipsisV size={15} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {groups.map((group, gi) => (
              <React.Fragment key={gi}>
                {gi > 0 && <DropdownMenuSeparator />}
                {group.map((action, ai) => (
                  <DropdownMenuItem
                    key={ai}
                    onSelect={action.onClick}
                    disabled={action.disabled}
                    className={cn(
                      action.danger && "text-destructive focus:text-destructive",
                      action.active && "text-primary focus:text-primary"
                    )}
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                ))}
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </header>
  );
};

export default Header;
