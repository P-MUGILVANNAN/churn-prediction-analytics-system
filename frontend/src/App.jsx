import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import ExploratoryAnalysis from './pages/ExploratoryAnalysis';
import ModelTraining from './pages/ModelTraining';
import PredictionEngine from './pages/PredictionEngine';
import ExplainableAI from './pages/ExplainableAI';
import Segmentation from './pages/Segmentation';
import RetentionRecommendations from './pages/RetentionRecommendations';
import CampaignManagement from './pages/CampaignManagement';
import RevenueAnalytics from './pages/RevenueAnalytics';
import ReportsAndResearch from './pages/ReportsAndResearch';
import Login from './pages/Login';

const PAGE_TITLES = {
  '/': { title: 'Executive Overview Dashboard', subtitle: 'Real-time KPI metrics & customer risk distributions' },
  '/customers': { title: 'Customer Data Management', subtitle: 'Search, filter, inspect profiles, and upload CSV datasets' },
  '/eda': { title: 'Exploratory Data Analysis (EDA)', subtitle: 'Data provenance, missing value audits, and churn correlations' },
  '/models': { title: 'ML Model Benchmarks & Evaluation', subtitle: 'Comparative ROC-AUC, 5-fold CV, and soft-voting hybrid ensemble' },
  '/predict': { title: 'Churn Prediction & Prescriptions', subtitle: 'Individual inference, local SHAP factors, and retention actions' },
  '/xai': { title: 'Explainable AI (SHAP Framework)', subtitle: 'Game-theoretic feature importance and risk directional attributions' },
  '/segments': { title: 'Customer Value-Risk Segmentation', subtitle: 'K-Means clustering into 5 actionable business cohorts' },
  '/retention': { title: 'Retention Recommendation Engine', subtitle: 'Rule-based decision-support interventions queue' },
  '/campaigns': { title: 'Campaign Management & ROI', subtitle: 'Targeted outreach programs, conversion tracking, and saved MRR' },
  '/revenue': { title: 'Revenue-at-Risk Financial Analytics', subtitle: 'Recurring monthly and annual revenue exposure metrics' },
  '/reports': { title: 'Reports & Research Deliverables', subtitle: 'Executive briefing synthesis and IEEE conference paper manuscript' }
};

function Layout({ user, onLogout }) {
  const location = useLocation();
  const meta = PAGE_TITLES[location.pathname] || { title: 'Customer Churn Analytics', subtitle: '' };
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar
        user={user}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title={meta.title}
          subtitle={meta.subtitle}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/eda" element={<ExploratoryAnalysis />} />
            <Route path="/models" element={<ModelTraining />} />
            <Route path="/predict" element={<PredictionEngine />} />
            <Route path="/xai" element={<ExplainableAI />} />
            <Route path="/segments" element={<Segmentation />} />
            <Route path="/retention" element={<RetentionRecommendations />} />
            <Route path="/campaigns" element={<CampaignManagement />} />
            <Route path="/revenue" element={<RevenueAnalytics />} />
            <Route path="/reports" element={<ReportsAndResearch />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('churn_user');
    return saved ? JSON.parse(saved) : { username: 'analyst@telecom.ai', role: 'Senior Churn Analyst' };
  });

  const handleLogout = () => {
    localStorage.removeItem('churn_token');
    localStorage.removeItem('churn_user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      {user ? (
        <Layout user={user} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={(u) => setUser(u)} />
      )}
    </BrowserRouter>
  );
}
