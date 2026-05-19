'use client';
import { AuthProvider, useAuth } from '@/lib/auth';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';

function AppContent() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <LoginPage />;
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}