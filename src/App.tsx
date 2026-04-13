import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Bracket from './pages/Bracket';
import TopScorers from './pages/TopScorers';
import AdminLogin from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMatchEdit from './pages/admin/MatchEdit';
import AdminMatchCreate from './pages/admin/MatchCreate';
import AdminBracket from './pages/admin/BracketAdmin';
import AdminAdmins from './pages/admin/Admins';
import AdminTeams from './pages/admin/TeamsAdmin';
import AdminTeamEdit from './pages/admin/TeamEdit';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="utakmice" element={<Matches />} />
        <Route path="utakmice/:id" element={<MatchDetail />} />
        <Route path="ekipe" element={<Teams />} />
        <Route path="ekipe/:id" element={<TeamDetail />} />
        <Route path="ladder" element={<Bracket />} />
        <Route path="strijelci" element={<TopScorers />} />
      </Route>

      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="utakmica/nova" element={<AdminMatchCreate />} />
        <Route path="utakmica/:id" element={<AdminMatchEdit />} />
        <Route path="ekipe" element={<AdminTeams />} />
        <Route path="ekipe/nova" element={<AdminTeamEdit />} />
        <Route path="ekipe/:id" element={<AdminTeamEdit />} />
        <Route path="ladder" element={<AdminBracket />} />
        <Route path="organizatori" element={<AdminAdmins />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
