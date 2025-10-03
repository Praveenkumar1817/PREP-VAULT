import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';

export default function AdminDebug() {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading authentication status...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin Debug Information</h2>
      <Card style={{ marginTop: '20px' }}>
        <CardContent>
          <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            <p><strong>Current User:</strong> {currentUser ? currentUser.email : 'Not logged in'}</p>
            <p><strong>User ID:</strong> {currentUser ? currentUser.uid : 'N/A'}</p>
            <p><strong>Is Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Auth Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Admin Emails:</strong> admin@prepvault.com, praveenkumar1817@gmail.com</p>
          </div>
        </CardContent>
      </Card>
      
      {currentUser && (
        <Card style={{ marginTop: '20px' }}>
          <CardContent>
            <h3>Troubleshooting</h3>
            {!isAdmin && (
              <div style={{ color: '#dc2626' }}>
                <p>❌ You are not recognized as an admin.</p>
                <p>Make sure your email ({currentUser.email}) is in the admin list.</p>
              </div>
            )}
            {isAdmin && (
              <div style={{ color: '#16a34a' }}>
                <p>✅ Admin access confirmed!</p>
                <p>You should be able to access admin analytics.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}