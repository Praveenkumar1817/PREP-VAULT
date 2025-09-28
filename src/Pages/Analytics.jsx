import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Card, CardContent } from "../../components/ui/Card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./Analytics.module.css";

export default function Analytics() {
  const [stats, setStats] = useState({ solved: 0, attempted: 0, unsolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Check if user is authenticated
      if (!auth.currentUser) {
        console.warn("No authenticated user, cannot fetch analytics");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const problemsRef = collection(db, "problems");
        // Query only problems belonging to the current user
        const q = query(problemsRef, where("user", "==", auth.currentUser.uid));
        const snapshot = await getDocs(q);
        
        let solved = 0, attempted = 0, unsolved = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          // Status validation
          if (data.status === "Solved") solved++;
          else if (data.status === "Attempted") attempted++;
          else if (data.status === "Unsolved") unsolved++;
          // Handle any other status as "Unsolved" for safety
        });

        setStats({ solved, attempted, unsolved });
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = [
    { name: "Solved", value: stats.solved },
    { name: "Attempted", value: stats.attempted },
    { name: "Unsolved", value: stats.unsolved },
  ];

  const COLORS = ["#22c55e", "#facc15", "#ef4444"];

  // Handle loading and error states
  if (loading) {
    return (
      <div className={styles.analytics}>
        <h2 className={styles.pageTitle}>Analytics 📊</h2>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.analytics}>
        <h2 className={styles.pageTitle}>Analytics 📊</h2>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.analytics}>
      <h2 className={styles.pageTitle}>Analytics 📊</h2>

      <div className={styles.statsGrid}>
        <Card className={`${styles.statCard} ${styles.solved}`}>
          <CardContent>
            <p className={`${styles.statValue} ${styles.solved}`}>{stats.solved}</p>
            <p className={styles.statLabel}>Solved</p>
          </CardContent>
        </Card>
        <Card className={`${styles.statCard} ${styles.attempted}`}>
          <CardContent>
            <p className={`${styles.statValue} ${styles.attempted}`}>{stats.attempted}</p>
            <p className={styles.statLabel}>Attempted</p>
          </CardContent>
        </Card>
        <Card className={`${styles.statCard} ${styles.unsolved}`}>
          <CardContent>
            <p className={`${styles.statValue} ${styles.unsolved}`}>{stats.unsolved}</p>
            <p className={styles.statLabel}>Unsolved</p>
          </CardContent>
        </Card>
      </div>

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={chartData} 
              dataKey="value" 
              outerRadius={100} 
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}