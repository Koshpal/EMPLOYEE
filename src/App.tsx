import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Coaches from './pages/Coaches/Coaches';
import Sessions from './pages/Sessions/Sessions';
import Profile from './pages/Profile/Profile';
import Calendar from './pages/Calendar/Calendar';
import MoneyCheckIn from './pages/Onboarding/MoneyCheckIn';

// Finance pages
import FinanceDashboard from './pages/Finance/FinanceDashboard';
import Transactions from './pages/Finance/Transactions';
import Analytics from './pages/Finance/Analytics';
import Subscriptions from './pages/Finance/Subscriptions';
import WellnessScore from './pages/Finance/WellnessScore';
import Insights from './pages/Finance/Insights';
import ConsentGate from './pages/Finance/ConsentGate';
import Goals from './pages/Finance/Goals';




function App() {
  console.log('App Rendering');
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/coaches" element={<ProtectedRoute><Coaches /></ProtectedRoute>} />
      <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><MoneyCheckIn /></ProtectedRoute>} />

      {/* Finance routes */}
      <Route path="/finance" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
      <Route path="/finance/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/finance/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/finance/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
      <Route path="/finance/score" element={<ProtectedRoute><WellnessScore /></ProtectedRoute>} />
      <Route path="/finance/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
      <Route path="/finance/consent" element={<ProtectedRoute><ConsentGate /></ProtectedRoute>} />
      <Route path="/finance/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
