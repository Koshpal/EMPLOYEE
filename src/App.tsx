import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PageLoader } from './components/common/Skeleton';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';

// Route components are code-split: each page ships as its own chunk and is
// fetched on first navigation, so the initial load isn't one big bundle.
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Coaches = lazy(() => import('./pages/Coaches/Coaches'));
const CoachProfile = lazy(() => import('./pages/Coaches/CoachProfile'));
const Sessions = lazy(() => import('./pages/Sessions/Sessions'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const Calendar = lazy(() => import('./pages/Calendar/Calendar'));
const MoneyCheckIn = lazy(() => import('./pages/Onboarding/MoneyCheckIn'));

// Finance pages
const FinanceDashboard = lazy(() => import('./pages/Finance/FinanceDashboard'));
const Transactions = lazy(() => import('./pages/Finance/Transactions'));
const Analytics = lazy(() => import('./pages/Finance/Analytics'));
const Subscriptions = lazy(() => import('./pages/Finance/Subscriptions'));
const WellnessScore = lazy(() => import('./pages/Finance/WellnessScore'));
const Insights = lazy(() => import('./pages/Finance/Insights'));
const ConsentGate = lazy(() => import('./pages/Finance/ConsentGate'));
const Goals = lazy(() => import('./pages/Finance/Goals'));
const Budgets = lazy(() => import('./pages/Finance/Budgets'));
const DuesReminders = lazy(() => import('./pages/Finance/DuesReminders'));
const SpentByCategory = lazy(() => import('./pages/Finance/SpentByCategory'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/coaches" element={<ProtectedRoute><Coaches /></ProtectedRoute>} />
        <Route path="/coaches/:id" element={<ProtectedRoute><CoachProfile /></ProtectedRoute>} />
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
        <Route path="/finance/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
        <Route path="/finance/dues-reminders" element={<ProtectedRoute><DuesReminders /></ProtectedRoute>} />
        <Route path="/finance/spent-by-category" element={<ProtectedRoute><SpentByCategory /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
