import React, { useContext, useEffect, useState, lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Provider } from "react-redux";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ModalProvider } from "./contexts/ModalContext";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import store from "./store/store";
import { useAppDispatch } from "./store/hooks";
import { fetchChats, addChat } from "./features/chatSlice";
import { fetchCharacters } from "./features/characterSlice";
import { LS_FONT_SIZE } from "./utils/constants";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ServiceWorkerUpdater from "./components/ServiceWorkerUpdater";

const ChatPage = lazy(() => import("./pages/ChatPage"));
const Login = lazy(() => import("./pages/Login"));
const CharacterPage = lazy(() => import("./pages/CharacterPage"));
const CharacterGalleryPage = lazy(() => import("./pages/CharacterGalleryPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));


const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Rendered at "/" (no chat selected). On mobile the sidebar is off-screen until
// opened via the hamburger, so this still needs its own Header - without it,
// there'd be no way to get back to the chat list on a phone.
const EmptyChatState = () => {
  const { open } = useSidebar();
  return (
    <div className="flex flex-col w-full h-screen bg-app">
      <Header title="WhatsGemini" subtitle="Select a chat to get started" />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-ink-muted px-6 text-center">
        <p className="text-sm">Select a chat from the sidebar to continue a conversation.</p>
        <button
          onClick={open}
          className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gemini-logo text-onAccent font-semibold text-sm shadow-lg shadow-primary/20"
        >
          Browse chats
        </button>
      </div>
    </div>
  );
};

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
    <div className="bg-app min-h-screen text-ink font-sans">
      <div className="flex flex-col h-screen w-full">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 bg-app relative z-1 min-w-0">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/chat/:chatId" element={<ChatPage />} />
                <Route path="/characters" element={<CharacterPage />} />
                <Route path="/characters/:characterId/gallery" element={<CharacterGalleryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/" element={<EmptyChatState />} />
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
    <ServiceWorkerUpdater />
    <AuthProvider>
      <ThemeProvider>
        <ModalProvider>
          <SidebarProvider>
            <HashRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="*" element={<AppContent />} />
                </Routes>
              </Suspense>
            </HashRouter>
          </SidebarProvider>
        </ModalProvider>
      </ThemeProvider>
    </AuthProvider>
  </Provider>
);

export default App;
