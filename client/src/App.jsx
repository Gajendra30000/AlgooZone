import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Background from './components/Background';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import Contests from './pages/Contests';
import Sheets from './pages/Sheets';
import AdminSheets from './pages/AdminSheets';
import CodeReviewer from './pages/CodeReviewer';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/dashboard" />; // Basic role check

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <Leaderboard />
      } />
      <Route path="/sheets" element={
        <ProtectedRoute>
          <Sheets />
        </ProtectedRoute>
      } />
      <Route path="/code-reviewer" element={
        <ProtectedRoute>
          <CodeReviewer />
        </ProtectedRoute>
      } />
      <Route path="/contests" element={
        <ProtectedRoute>
          <Contests />
        </ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute role="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/:id" element={
        <ProtectedRoute role="admin">
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/sheets" element={
        <ProtectedRoute role="admin">
          <AdminSheets />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Background />
        <div className="relative z-10 min-h-screen text-white">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
