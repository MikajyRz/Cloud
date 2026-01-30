import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MapPage from './pages/MapPage'
import ManagerPage from './pages/ManagerPage'
import UserProfilePage from './pages/UserProfilePage'
import SignalementsPage from './pages/SignalementsPage'
import UtilisateursPage from './pages/UtilisateursPage'
import StatistiquesPage from './pages/StatistiquesPage'
import RequireRole from './routes/RequireRole'
import RequireAuth from './routes/RequireAuth'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/profile" element={<UserProfilePage />} />
      </Route>

      <Route element={<RequireRole role="MANAGER" />}>
        <Route path="/manager" element={<ManagerPage />} />
        <Route path="/manager/signalements" element={<SignalementsPage />} />
        <Route path="/manager/utilisateurs" element={<UtilisateursPage />} />
        <Route path="/manager/statistiques" element={<StatistiquesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
