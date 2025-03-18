import React, { useContext, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { FaSignOutAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContext";
import { FaUserPlus, FaMoon, FaSun, FaCog } from "react-icons/fa";

const NAV_LINKS = [
  { to: "/characters", icon: FaUserPlus, title: "New Chat", bgClass: "bg-[#25D366] hover:bg-[#1db954]" },
  { to: "/settings", icon: FaCog, title: "Settings", bgClass: "hover:bg-white/20" },
];

const Header = () => {
  const { toggleTheme, darkMode } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);
  // Prevent unnecessary re-renders
  const handleToggleTheme = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  return (
    <header className="flex items-center justify-between p-3 bg-[#008069] dark:bg-[#202c33] text-white shadow-md">
      <Link to="/" className="ml-14 sm:ml-0 text-lg font-semibold tracking-wide" aria-label="Go to Home">
        WhatsGemini
      </Link>

      <div className="flex gap-3 items-center">
        {NAV_LINKS.map(({ to, icon: Icon, title, bgClass }) => (
          <Link 
            key={to}
            to={to}
            className={`p-2 rounded-full transition ${bgClass}`}
            title={title}
            aria-label={title}
          >
            <Icon size={18} />
          </Link>
        ))}

        <button 
          onClick={handleToggleTheme}
          className="p-2 rounded-full hover:bg-white/20 transition"
          title="Toggle Theme"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
        </button>
        <button
          onClick={logout}
          className="p-2 rounded-full hover:bg-white/20 transition"
          title="Logout"
          aria-label="Logout"
        >
          <FaSignOutAlt size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
