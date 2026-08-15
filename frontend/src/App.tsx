import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { DiaryPage } from './pages/DiaryPage'
import { EntryFormPage } from './pages/EntryFormPage'
import { GoalsPage } from './pages/GoalsPage'
import { ReportsPage } from './pages/ReportsPage'

function App() {
  return (
    <Routes>
      <Route path="login" element={<AuthPage mode="login" />} />
      <Route path="register" element={<AuthPage mode="register" />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="diary" element={<DiaryPage />} />
        <Route path="log" element={<EntryFormPage />} />
        <Route path="log/:id" element={<EntryFormPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
