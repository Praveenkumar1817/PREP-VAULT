import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent } from "../../components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import styles from "./Analytics.module.css";

export default function AdminAnalytics() {
  const { currentUser, isAdmin } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [globalStats, setGlobalStats] = useState({ 
    totalUsers: 0, 
    totalProblems: 0, 
    totalSolved: 0, 
    totalAttempted: 0,
    totalUnsolved: 0 
  });
  const [problemStats, setProblemStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is authenticated and is admin
        if (!currentUser || !isAdmin) {
          setError("Admin access required");
          setLoading(false);
          return;
        }
        
        // Fetch all problems to calculate user statistics
        const problemsRef = collection(db, "problems");
        const problemsSnapshot = await getDocs(problemsRef);
        
        // Fetch all user profiles to get names
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        // Create user profiles map
        const userProfiles = {};
        usersSnapshot.docs.forEach((doc) => {
          const userData = doc.data();
          // Debug log to see what data we're getting
          console.log("User profile data for", doc.id, ":", userData);
          console.log("LinkedIn URL:", userData.linkedinUrl, "Contact:", userData.contact);
          
          userProfiles[doc.id] = {
            name: userData.name || userData.email?.split('@')[0] || "Unknown User",
            email: userData.email || "Unknown Email",
            linkedinUrl: userData.linkedinUrl,
            contact: userData.contact,
            college: userData.college,
            graduationYear: userData.graduationYear
          };
        });
        
        // Calculate user statistics for leaderboard
        const userStats = {};
        let totalSolved = 0, totalAttempted = 0, totalUnsolved = 0;
        const difficultyStats = { Easy: 0, Medium: 0, Hard: 0 };
        
        problemsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const userId = data.user;
          const userEmail = data.userEmail;
          const userProfile = userProfiles[userId];
          
          // Debug log for the first few problems
          if (Object.keys(userStats).length < 3) {
            console.log("Problem data:", { userId, userEmail, userProfile, problemData: data });
          }
          
          if (!userStats[userId]) {
            // Use profile email if available, otherwise fall back to problem data, then auth email
            const finalEmail = userProfile?.email || userEmail || "Unknown User";
            const finalName = userProfile?.name || (finalEmail && finalEmail !== "Unknown User" ? finalEmail.split('@')[0] : "Unknown User");
            
            userStats[userId] = {
              email: finalEmail,
              name: finalName,
              linkedinUrl: userProfile?.linkedinUrl || "",
              contact: userProfile?.contact || "",
              college: userProfile?.college || "",
              graduationYear: userProfile?.graduationYear || "",
              solved: 0,
              attempted: 0,
              unsolved: 0,
              total: 0
            };
          }
          
          userStats[userId].total++;
          
          if (data.status === "Solved") {
            userStats[userId].solved++;
            totalSolved++;
          } else if (data.status === "Attempted") {
            userStats[userId].attempted++;
            totalAttempted++;
          } else {
            userStats[userId].unsolved++;
            totalUnsolved++;
          }
          
          // Count difficulty distribution
          if (data.difficulty && difficultyStats.hasOwnProperty(data.difficulty)) {
            difficultyStats[data.difficulty]++;
          }
        });
        
        // Convert to leaderboard array and sort by solved problems
        const leaderboardData = Object.entries(userStats)
          .map(([userId, stats]) => ({
            userId,
            ...stats,
            successRate: stats.total > 0 ? ((stats.solved / stats.total) * 100).toFixed(1) : 0
          }))
          .sort((a, b) => {
            // Sort by solved problems first, then by success rate
            if (b.solved !== a.solved) return b.solved - a.solved;
            return parseFloat(b.successRate) - parseFloat(a.successRate);
          })
          .slice(0, 10); // Top 10 users
        
        setLeaderboard(leaderboardData);
        
        // Set global statistics
        setGlobalStats({
          totalUsers: Object.keys(userStats).length,
          totalProblems: problemsSnapshot.docs.length,
          totalSolved,
          totalAttempted,
          totalUnsolved
        });
        
        // Set problem difficulty statistics for chart
        setProblemStats([
          { name: "Easy", value: difficultyStats.Easy },
          { name: "Medium", value: difficultyStats.Medium },
          { name: "Hard", value: difficultyStats.Hard }
        ]);
        
      } catch (err) {
        console.error("Error fetching admin analytics data:", err);
        if (err.code === 'permission-denied') {
          setError("Permission denied. Please update Firebase security rules to allow admin access. Check FIREBASE_RULES_SETUP.md for instructions.");
        } else {
          setError(`Failed to load admin analytics data: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [currentUser, isAdmin]);

  const statusData = [
    { name: "Solved", value: globalStats.totalSolved },
    { name: "Attempted", value: globalStats.totalAttempted },
    { name: "Unsolved", value: globalStats.totalUnsolved }
  ];

  const COLORS = ["#22c55e", "#facc15", "#ef4444"];
  const DIFFICULTY_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

  if (loading) {
    return (
      <div className={styles.analytics}>
        <h2 className={styles.pageTitle}>Admin Analytics 🎯</h2>
        <p>Loading admin analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.analytics}>
        <h2 className={styles.pageTitle}>Admin Analytics 🎯</h2>
        <div style={{ 
          backgroundColor: '#fee2e2', 
          border: '1px solid #fecaca', 
          borderRadius: '8px', 
          padding: '20px', 
          margin: '20px 0' 
        }}>
          <h3 style={{ color: '#dc2626', marginBottom: '10px' }}>⚠️ Access Error</h3>
          <p style={{ color: '#dc2626', marginBottom: '15px' }}>{error}</p>
          {error.includes('permission-denied') && (
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px' }}>
              <h4 style={{ color: '#374151', marginBottom: '10px' }}>Quick Fix:</h4>
              <ol style={{ color: '#374151', paddingLeft: '20px' }}>
                <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
                <li>Select your project → Firestore Database → Rules</li>
                <li>Update rules using the content in <code>firestore.rules</code> file</li>
                <li>Click "Publish" and refresh this page</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.analytics}>
      <h2 className={styles.pageTitle}>Admin Analytics Dashboard 🎯</h2>

      {/* Global Statistics */}
      <div className={styles.statsGrid}>
        <Card className={`${styles.statCard} ${styles.solved}`}>
          <CardContent>
            <p className={`${styles.statValue} ${styles.solved}`}>{globalStats.totalUsers}</p>
            <p className={styles.statLabel}>Total Users</p>
          </CardContent>
        </Card>
        <Card className={`${styles.statCard} ${styles.attempted}`}>
          <CardContent>
            <p className={`${styles.statValue} ${styles.attempted}`}>{globalStats.totalProblems}</p>
            <p className={styles.statLabel}>Total Problems</p>
          </CardContent>
        </Card>
        <Card className={`${styles.statCard} ${styles.solved}`}>
          <CardContent>
            <p className={`${styles.statValue} ${styles.solved}`}>{globalStats.totalSolved}</p>
            <p className={styles.statLabel}>Total Solved</p>
          </CardContent>
        </Card>
        <Card className={`${styles.statCard} ${styles.unsolved}`}>
          <CardContent>
            <p className={`${styles.statValue} ${styles.unsolved}`}>
              {((globalStats.totalSolved / Math.max(globalStats.totalProblems, 1)) * 100).toFixed(1)}%
            </p>
            <p className={styles.statLabel}>Success Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Section */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
          🏆 Top Performers Leaderboard
        </h3>
        <Card>
          <CardContent>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e5e5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Rank</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>User</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Solved</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Attempted</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Total</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((user, index) => (
                    <tr key={user.userId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: index < 3 ? '#d4af37' : '#666',
                          fontSize: index < 3 ? '18px' : '16px'
                        }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '16px', color: '#1f2937' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {user.email}
                          </div>
                          {user.college && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                              🎓 {user.college} {user.graduationYear && `'${user.graduationYear.toString().slice(-2)}`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#22c55e', fontWeight: 'bold' }}>
                        {user.solved}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#facc15', fontWeight: 'bold' }}>
                        {user.attempted}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                        {user.total}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                        <span style={{ 
                          color: parseFloat(user.successRate) >= 70 ? '#22c55e' : 
                                 parseFloat(user.successRate) >= 40 ? '#facc15' : '#ef4444'
                        }}>
                          {user.successRate}%
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {leaderboard.length === 0 && (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                No user data available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '40px' }}>
        {/* Problem Status Distribution */}
        <Card>
          <CardContent>
            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Problem Status Distribution</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={statusData} 
                    dataKey="value" 
                    outerRadius={80} 
                    label={({name, value}) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Problem Difficulty Distribution */}
        <Card>
          <CardContent>
            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Problem Difficulty Distribution</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={problemStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {problemStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DIFFICULTY_COLORS[index % DIFFICULTY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
          📊 Platform Insights
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <Card>
            <CardContent>
              <h4 style={{ marginBottom: '15px', color: '#22c55e' }}>Top Performers</h4>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Users with highest success rates are leading the platform. 
                Top performer has {leaderboard.length > 0 ? leaderboard[0].successRate : 0}% success rate.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h4 style={{ marginBottom: '15px', color: '#3b82f6' }}>Platform Health</h4>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Overall platform success rate: {' '}
                <strong>
                  {((globalStats.totalSolved / Math.max(globalStats.totalProblems, 1)) * 100).toFixed(1)}%
                </strong>
                {' '} indicating good user engagement.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h4 style={{ marginBottom: '15px', color: '#f59e0b' }}>Activity Level</h4>
              <p style={{ fontSize: '14px', color: '#666' }}>
                {globalStats.totalUsers} active users have attempted {globalStats.totalProblems} problems total.
                Average: {(globalStats.totalProblems / Math.max(globalStats.totalUsers, 1)).toFixed(1)} problems per user.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}