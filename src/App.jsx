// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from './Pages/Home';
import Sheets from './Pages/Sheets';
import SheetDetail from './Pages/SheetDetail';
import Analytics from './Pages/Analytics';
import LoginForm from './Pages/LoginForm';
import RegisterForm from './Pages/RegisterForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route 
          path="/home" 
          element={
            <Layout>
              <Home />
            </Layout>
          } 
        />
        <Route 
          path="/sheets" 
          element={
            <Layout>
              <Sheets />
            </Layout>
          } 
        />
        <Route 
          path="/sheets/:sheetId" 
          element={
            <Layout>
              <SheetDetail />
            </Layout>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <Layout>
              <Analytics />
            </Layout>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;