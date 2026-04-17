import { useContext, useEffect, useState, lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import store from "./store/store";
// Redux Actions
import { fetchChats } from "./features/chatSlice";
import { fetchCharacters } from "./features/characterSlice";

// Components (keep Header and Sidebar eagerly loaded for shell)
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

// Lazy-loaded Pages
const ChatPage = lazy(() => import("./pages/ChatPage"));
const Login = lazy(() => import("./pages/Login"));
const CharacterPage = lazy(() => import("./pages/CharacterPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));


// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const AppContent = () => {
  const { apiKey } = useContext(AuthContext);
  const dispatch = useDispatch();
  const [error, setError] = useState(null);

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
  }, [dispatch]);

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
    <div className="bg-app-light dark:bg-app-dark min-h-screen">
      <div className="flex flex-col h-screen mx-auto max-w-[1200px] shadow-2xl">
        <Header />
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
        <HashRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<AppContent />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </ThemeProvider>
    </AuthProvider>
  </Provider>
);

export default App;
