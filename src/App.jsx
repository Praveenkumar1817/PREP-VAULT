import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import AdminLayout from '../components/AdminLayout';
import Home from './Pages/Home';
import Sheets from './Pages/Sheets';
import SheetDetail from './Pages/SheetDetail';
import Analytics from './Pages/Analytics';
import Problems from './Pages/Problems';
import LoginForm from './Pages/LoginForm';
import RegisterForm from './Pages/RegisterForm';
import Profile from './Pages/Profile';
import AdminLoginForm from './Pages/AdminLoginForm';
import AdminAnalytics from './Pages/AdminAnalytics';
import UserManagement from './Pages/UserManagement';
import AdminDebug from './Pages/AdminDebug';
import PrivateRoute from '../components/PrivateRoute';
import AdminRoute from '../components/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import ProblemDetail from './Pages/ProblemDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route 
            path="/home" 
            element={
              <PrivateRoute>
                <Layout>
                  <Home />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/sheets" 
            element={
              <PrivateRoute>
                <Layout>
                  <Sheets />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/sheets/:sheetId" 
            element={
              <PrivateRoute>
                <Layout>
                  <SheetDetail />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/problems/:problemId" 
            element={
              <PrivateRoute>
                <Layout>
                  <ProblemDetail />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <PrivateRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Layout>
                  <Profile />
                </Layout>
              </PrivateRoute>
            } 
          />
          
          <Route path="/admin/login" element={<AdminLoginForm />} />
          <Route path="/admin/debug" element={<AdminDebug />} />
          <Route 
            path="/admin/analytics" 
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminAnalytics />
                </AdminLayout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminRoute>
                <AdminLayout>
                  <UserManagement />
                </AdminLayout>
              </AdminRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;