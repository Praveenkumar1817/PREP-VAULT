import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui';
import styles from './Navbar.module.css';

export default function Navbar({ onLogout }) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <div className={styles.navLinks}>
          <Link to="/home" className={styles.logo}>PrepVault</Link>
          <Link to="/sheets" className={styles.navLink}>Sheets</Link>
          <Link to="/analytics" className={styles.navLink}>Analytics</Link>
        </div>
        <div>
          <Button variant="ghost" onClick={onLogout}>Logout</Button>
        </div>
      </div>
    </nav>
  );
}