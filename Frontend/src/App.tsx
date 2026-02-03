import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MapPage from './pages/MapPage'
import ManagerPage from './pages/ManagerPage'
import LockedUsersPage from './pages/LockedUsersPage'
import RequireRole from './routes/RequireRole'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireRole role="MANAGER" />}>
        <Route path="/manager" element={<ManagerPage />} />
        <Route path="/manager/locked-users" element={<LockedUsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
