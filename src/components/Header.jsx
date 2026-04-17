import React, { useContext, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { FaSignOutAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContext";
import { FaUserPlus, FaMoon, FaSun, FaCog } from "react-icons/fa";

const NAV_LINKS = [
  { to: "/characters", icon: FaUserPlus, title: "New Chat", bgClass: "bg-primary hover:bg-primary-hover text-white" },
  { to: "/settings", icon: FaCog, title: "Settings", bgClass: "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" },
];

const Header = () => {
  const { toggleTheme, darkMode } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);
  // Prevent unnecessary re-renders
  const handleToggleTheme = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  return (
    <header className="flex items-center justify-between p-3 bg-panel-light dark:bg-panel-dark text-black dark:text-white border-b border-gray-200 dark:border-gray-800 z-10 relative">
      <Link to="/" className="ml-14 sm:ml-0 text-xl font-bold tracking-tight text-primary dark:text-white" aria-label="Go to Home">
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
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300"
          title="Toggle Theme"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
        </button>
        <button
          onClick={logout}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300"
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
