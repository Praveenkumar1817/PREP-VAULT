import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent } from "../../components/ui/Card";
import styles from "./Home.module.css";

export default function Home() {
  const [stats, setStats] = useState({ solved: 0, attempted: 0, unsolved: 0 });
  const [recent, setRecent] = useState([]);
  const [profileComplete, setProfileComplete] = useState(true);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      console.log("Current user in Home:", auth.currentUser);
      
      if (!auth.currentUser) {
        console.warn("No authenticated user, cannot fetch dashboard data");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData.name || "");
          setProfileComplete(!!userData.name && !!userData.name.trim());
        } else {
          setProfileComplete(false);
        }
        
        const problemsRef = collection(db, "problems");
        const q = query(problemsRef, where("user", "==", auth.currentUser.uid));
        const snap = await getDocs(q);

        console.log("Found problems:", snap.size);
        
        if (snap.empty) {
          console.log("No problems found for user");
          setStats({ solved: 0, attempted: 0, unsolved: 0 });
          setRecent([]);
          setLoading(false);
          return;
        }

        let solved = 0, attempted = 0, unsolved = 0;
        const userProblems = [];

        snap.docs.forEach((doc) => {
          const data = doc.data();
          console.log("Processing problem:", data);
          
          if (data.status === "Solved") solved++;
          else if (data.status === "Attempted") attempted++;
          else unsolved++;

          userProblems.push({ id: doc.id, ...data });
        });

        setStats({ solved, attempted, unsolved });
        const sortedProblems = userProblems
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 5);
        setRecent(sortedProblems);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        console.error("Error details:", err.code, err.message);
        setError(`Failed to load dashboard data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className={styles.home}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.headerTitle}>PrepVault</h1>
            <p className={styles.headerSubtitle}>Your DSA practice dashboard</p>
          </div>
          <div className={styles.headerActions}>
            <Link to="/sheets"><Button>Open Sheets</Button></Link>
            <Link to="/analytics"><Button variant="outline">View Analytics</Button></Link>
          </div>
        </header>

        {!loading && !profileComplete && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            margin: '20px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '16px' }}>
                👋 Complete Your Profile
              </h3>
              <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                Add your name and details to appear properly on leaderboards and connect with other users.
              </p>
            </div>
            <Link to="/profile">
              <Button style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none' }}>
                Complete Profile
              </Button>
            </Link>
          </div>
        )}

        {!loading && profileComplete && userName && (
          <div style={{
            backgroundColor: '#d1fae5',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '12px 16px',
            margin: '20px 0',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#065f46', fontSize: '16px' }}>
              Welcome back, <strong>{userName}</strong>! 👋 Ready to solve some problems?
            </p>
          </div>
        )}

        {loading && (
          <div className={styles.loadingContainer}>
            <p>Loading your dashboard...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorContainer}>
            <p style={{ color: 'red' }}>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className={styles.stats}>
              <Card className={styles.statCard}>
                <CardContent>
                  <p className={styles.statLabel}>Solved</p>
                  <p className={`${styles.statValue} ${styles.solved}`}>{stats.solved}</p>
                </CardContent>
              </Card>
              <Card className={styles.statCard}>
                <CardContent>
                  <p className={styles.statLabel}>Attempted</p>
                  <p className={`${styles.statValue} ${styles.attempted}`}>{stats.attempted}</p>
                </CardContent>
              </Card>
              <Card className={styles.statCard}>
                <CardContent>
                  <p className={styles.statLabel}>Unsolved</p>
                  <p className={`${styles.statValue} ${styles.unsolved}`}>{stats.unsolved}</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Problems + Quick Add */}
            <div className={styles.contentGrid}>
              <div className={styles.recentProblems}>
                <div className={styles.recentHeader}>
                  <h2 className={styles.recentTitle}>Recent Problems</h2>
                  <Link to="/sheets" className={styles.seeAll}>See all</Link>
                </div>
                {recent.length === 0 ? (
                  <p className={styles.noProblems}>No recent problems. Add your first problem!</p>
                ) : (
                  <ul className={styles.problemsList}>
                    {recent.map((p) => (
                      <li key={p.id} className={styles.problemItem}>
                        <div className={styles.problemInfo}>
                          {isValidUrl(p.url) ? (
                            <a 
                              href={p.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className={styles.problemTitle}
                            >
                              {p.title}
                            </a>
                          ) : (
                            <span className={styles.problemTitle}>{p.title}</span>
                          )}
                          <div className={styles.problemTags}>
                            {p.tags?.slice(0, 3).join(", ")}
                          </div>
                        </div>
                        <div className={styles.problemActions}>
                          <Badge variant={
                            p.status === "Solved" ? "success" : 
                            p.status === "Attempted" ? "warning" : "default"
                          }>
                            {p.status}
                          </Badge>
                          <Link to="/sheets" className={styles.editLink}>Edit</Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={styles.quickAdd}>
                <Card className={styles.quickAddCard}>
                  <CardContent>
                    <h2 className={styles.quickAddTitle}>Quick Add</h2>
                    <p className={styles.quickAddText}>Add a problem quickly from here.</p>
                    <Link to="/sheets">
                      <Button className={styles.quickAddButton}>Add Problem</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}