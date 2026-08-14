import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { RequireAuth } from "./components/layout/RequireAuth";
import { useAuth } from "./context/AuthContext";
import { LoginPage, RegisterPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DiaryPage } from "./pages/DiaryPage";
import { EntryFormPage } from "./pages/EntryFormPage";
import { GoalsPage } from "./pages/GoalsPage";
import { ReportsPage } from "./pages/ReportsPage";

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-ink/50">Loading…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/diary" element={<DiaryPage />} />
        <Route path="/log" element={<EntryFormPage />} />
        <Route path="/log/:id" element={<EntryFormPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}
