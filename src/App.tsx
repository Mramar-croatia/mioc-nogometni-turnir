import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Loading from './components/Loading';

const Home = lazy(() => import('./pages/Home'));
const Matches = lazy(() => import('./pages/Matches'));
const MatchDetail = lazy(() => import('./pages/MatchDetail'));
const Teams = lazy(() => import('./pages/Teams'));
const TeamDetail = lazy(() => import('./pages/TeamDetail'));
const Bracket = lazy(() => import('./pages/Bracket'));
const TopScorers = lazy(() => import('./pages/TopScorers'));
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminMatchEdit = lazy(() => import('./pages/admin/MatchEdit'));
const AdminMatchCreate = lazy(() => import('./pages/admin/MatchCreate'));
const AdminBracket = lazy(() => import('./pages/admin/BracketAdmin'));
const AdminAdmins = lazy(() => import('./pages/admin/Admins'));
const AdminTeams = lazy(() => import('./pages/admin/TeamsAdmin'));
const AdminTeamEdit = lazy(() => import('./pages/admin/TeamEdit'));

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
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
    </Suspense>
  );
}
