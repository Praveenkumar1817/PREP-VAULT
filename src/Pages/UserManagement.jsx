import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import styles from "./Analytics.module.css";

export default function UserManagement() {
  const { currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!currentUser || !isAdmin) {
          setError("Admin access required");
          setLoading(false);
          return;
        }
        
        const problemsRef = collection(db, "problems");
        const problemsSnapshot = await getDocs(problemsRef);
        
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        const userProfiles = {};
        usersSnapshot.docs.forEach((doc) => {
          const userData = doc.data();
          userProfiles[doc.id] = {
            name: userData.name || userData.email?.split('@')[0] || "Unknown User",
            email: userData.email,
            linkedinUrl: userData.linkedinUrl,
            college: userData.college,
            graduationYear: userData.graduationYear,
            contact: userData.contact,
            bio: userData.bio
          };
        });
        
        const userStats = {};
        
        problemsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const userId = data.user;
          const userEmail = data.userEmail || "Unknown User";
          const userProfile = userProfiles[userId];
          
          if (!userStats[userId]) {
            userStats[userId] = {
              email: userEmail,
              name: userProfile?.name || userEmail?.split('@')[0] || "Unknown User",
              linkedinUrl: userProfile?.linkedinUrl || "",
              college: userProfile?.college || "",
              graduationYear: userProfile?.graduationYear || "",
              contact: userProfile?.contact || "",
              bio: userProfile?.bio || "",
              solved: 0,
              attempted: 0,
              unsolved: 0,
              total: 0,
              lastActivity: data.createdAt || new Date()
            };
          }
          
          userStats[userId].total++;
          
          if (data.status === "Solved") {
            userStats[userId].solved++;
          } else if (data.status === "Attempted") {
            userStats[userId].attempted++;
          } else {
            userStats[userId].unsolved++;
          }
          
          if (data.createdAt && data.createdAt > userStats[userId].lastActivity) {
            userStats[userId].lastActivity = data.createdAt;
          }
        });
        
        const usersArray = Object.entries(userStats)
          .map(([userId, stats]) => ({
            userId,
            ...stats,
            successRate: stats.total > 0 ? ((stats.solved / stats.total) * 100).toFixed(1) : 0
          }))
          .sort((a, b) => b.total - a.total);
        
        setUsers(usersArray);
        
      } catch (err) {
        console.error("Error fetching users data:", err);
        if (err.code === 'permission-denied') {
          setError("Permission denied. Please update Firebase security rules to allow admin access. Check FIREBASE_RULES_SETUP.md for instructions.");
        } else {
          setError(`Failed to load users data: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser, isAdmin]);

  const formatDate = (date) => {
    if (date && date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={styles.analytics}>
        <h2 className={styles.pageTitle}>User Management 👥</h2>
        <p>Loading users data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.analytics}>
        <h2 className={styles.pageTitle}>User Management 👥</h2>
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
      <h2 className={styles.pageTitle}>User Management 👥</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '18px', color: '#666' }}>
          Total Users: <strong>{users.length}</strong>
        </p>
      </div>

      <Card>
        <CardContent>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e5e5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Total Problems</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Solved</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Attempted</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Success Rate</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.userId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '16px', color: '#1f2937' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
                        {user.college && (
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                            🎓 {user.college} {user.graduationYear && `(${user.graduationYear})`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                      {user.total}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#22c55e', fontWeight: 'bold' }}>
                      {user.solved}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#facc15', fontWeight: 'bold' }}>
                      {user.attempted}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                      <span style={{ 
                        color: parseFloat(user.successRate) >= 70 ? '#22c55e' : 
                               parseFloat(user.successRate) >= 40 ? '#facc15' : '#ef4444'
                      }}>
                        {user.successRate}%
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
                      {formatDate(user.lastActivity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              No users found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}