import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui';
import { useAuth } from '../src/context/AuthContext';
import styles from './Navbar.module.css';

export default function AdminNavbar({ onLogout }) {
  const { currentUser } = useAuth();

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <div className={styles.navLinks}>
          <Link to="/admin/analytics" className={styles.logo}>PrepVault Admin</Link>
          <Link to="/admin/analytics" className={styles.navLink}>Admin Analytics</Link>
          <Link to="/admin/users" className={styles.navLink}>User Management</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#666', fontSize: '14px' }}>
            Admin: {currentUser?.email?.split('@')[0]}
          </span>
          <Button variant="ghost" onClick={onLogout}>Logout</Button>
        </div>
      </div>
    </nav>
  );
}