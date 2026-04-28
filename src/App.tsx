import React, { useContext, useEffect, useState, lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Provider } from "react-redux";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ModalProvider } from "./contexts/ModalContext";
import store from "./store/store";
import { useAppDispatch } from "./store/hooks";
import { fetchChats, addChat } from "./features/chatSlice";
import { fetchCharacters } from "./features/characterSlice";
import { LS_FONT_SIZE } from "./utils/constants";

// import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

const ChatPage = lazy(() => import("./pages/ChatPage"));
const Login = lazy(() => import("./pages/Login"));
const CharacterPage = lazy(() => import("./pages/CharacterPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));


const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const AppContent = () => {
  const { apiKey } = useContext(AuthContext);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchChats()).unwrap();
        await dispatch(fetchCharacters()).unwrap();
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load chats and characters. Please try again.");
      }
    };

    fetchData();
    
    // Apply font size
    const fontSize = localStorage.getItem(LS_FONT_SIZE) || "16px";
    document.documentElement.style.setProperty('--chat-font-size', fontSize);
  }, [dispatch]);

  // Global Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        try {
          const result = await dispatch(addChat({ title: "New Chat" })).unwrap();
          if (result && result.id) {
            navigate(`/chat/${result.id}`);
          }
        } catch (err) {
          console.error("Failed to create new chat:", err);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, navigate]);

  if (!apiKey) {
    return <Navigate to="/login" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-app-light dark:bg-app-dark min-h-screen text-slate-900 dark:text-slate-100 font-sans">
      <div className="flex flex-col h-screen w-full">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 bg-app-light dark:bg-app-dark border-l border-gray-200 dark:border-gray-800 relative z-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/chat/:chatId" element={<ChatPage />} />
                <Route path="/characters" element={<CharacterPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="/"
                  element={
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      Select a chat
                    </div>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <Provider store={store}>
    <AuthProvider>
      <ThemeProvider>
        <ModalProvider>
          <HashRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<AppContent />} />
              </Routes>
            </Suspense>
          </HashRouter>
        </ModalProvider>
      </ThemeProvider>
    </AuthProvider>
  </Provider>
);

export default App;
