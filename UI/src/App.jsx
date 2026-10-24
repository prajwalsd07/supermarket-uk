import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/LoginPage'
import SelectStorePage from './pages/SelectStorePage'
import DashboardPage from './pages/DashboardPage'
import BalanceSheetPage from './pages/BalanceSheetPage'
import DayEndReportPage from './pages/DayEndReportPage'
import TemperaturePage from './pages/TemperaturePage'
import TrainingPage from './pages/TrainingPage'
import ProblemReportPage from './pages/ProblemReportPage'
import CleaningSchedulePage from './pages/CleaningSchedulePage'
import UsersPage from './pages/UsersPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/select-store"
            element={
              <ProtectedRoute>
                <SelectStorePage />
              </ProtectedRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="balance" element={<BalanceSheetPage />} />
            <Route path="dayend" element={<DayEndReportPage />} />
            <Route path="temperature" element={<TemperaturePage />} />
            <Route
              path="training"
              element={
                <RoleRoute allow={['manager', 'administrator']}>
                  <TrainingPage />
                </RoleRoute>
              }
            />
            <Route path="problems" element={<ProblemReportPage />} />
            <Route path="cleaning" element={<CleaningSchedulePage />} />
            <Route
              path="users"
              element={
                <RoleRoute allow={['administrator']}>
                  <UsersPage />
                </RoleRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  )
}
