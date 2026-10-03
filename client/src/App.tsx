import React, { useState, useEffect } from 'react';
import { CustomerMenuPage } from './pages/CustomerMenuPage';
import { AdminLogin } from './admin/AdminLogin';
import { AdminDashboard } from './admin/AdminDashboard';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'menu' | 'admin'>('menu');
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('sree_mk_admin_token'));
  const [adminUser, setAdminUser] = useState<string>(localStorage.getItem('sree_mk_admin_user') || 'admin');

  useEffect(() => {
    // If URL hash or pathname is /admin, start in admin view
    if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
      setCurrentView('admin');
    }
  }, []);

  const handleLoginSuccess = (token: string, username: string) => {
    setAdminToken(token);
    setAdminUser(username);
    setCurrentView('admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('sree_mk_admin_token');
    localStorage.removeItem('sree_mk_admin_user');
    setAdminToken(null);
    setCurrentView('menu');
  };

  const handleUpdateUsername = (newUsername: string, newToken?: string) => {
    setAdminUser(newUsername);
    localStorage.setItem('sree_mk_admin_user', newUsername);
    if (newToken) {
      setAdminToken(newToken);
      localStorage.setItem('sree_mk_admin_token', newToken);
    }
  };

  if (currentView === 'admin') {
    if (!adminToken) {
      return (
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
          onBackToMenu={() => {
            window.history.pushState(null, '', '/');
            setCurrentView('menu');
          }}
        />
      );
    }

    return (
      <AdminDashboard
        token={adminToken}
        adminUsername={adminUser}
        onLogout={handleLogout}
        onPreviewMenu={() => setCurrentView('menu')}
        onUpdateUsername={handleUpdateUsername}
      />
    );
  }

  return (
    <CustomerMenuPage
      onOpenAdmin={() => {
        window.history.pushState(null, '', '/admin');
        setCurrentView('admin');
      }}
    />
  );
};
