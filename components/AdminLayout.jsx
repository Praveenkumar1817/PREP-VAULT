import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../src/firebase';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <AdminNavbar onLogout={handleLogout} />
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}