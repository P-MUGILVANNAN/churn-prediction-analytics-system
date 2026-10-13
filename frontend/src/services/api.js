/**
 * Unified API Client for Customer Churn Analytics Backend
 */
const API_BASE = '/api';

export const api = {
  // Health
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Auth
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  // Dashboard
  getDashboardSummary: async () => {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    return res.json();
  },

  // Customers
  getCustomers: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '' && v !== 'undefined')
    );
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`${API_BASE}/customers?${query}`);
    return res.json();
  },

  getCustomerById: async (id) => {
    const res = await fetch(`${API_BASE}/customers/${id}`);
    return res.json();
  },

  uploadCustomersCsv: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/customers/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  exportCustomersUrl: (riskTier = 'All', contract = 'All') => {
    return `${API_BASE}/customers/export?risk_tier=${riskTier}&contract=${contract}`;
  },

  // EDA & Analytics
  getEdaAnalytics: async () => {
    const res = await fetch(`${API_BASE}/analytics/eda`);
    return res.json();
  },

  getRevenueRisk: async () => {
    const res = await fetch(`${API_BASE}/analytics/revenue-risk`);
    return res.json();
  },

  // Machine Learning & Experiments
  getExperiments: async () => {
    const res = await fetch(`${API_BASE}/models/experiments`);
    return res.json();
  },

  getChampionModel: async () => {
    const res = await fetch(`${API_BASE}/models/champion`);
    return res.json();
  },

  trainModels: async (useSmote = false) => {
    const res = await fetch(`${API_BASE}/models/train?use_smote=${useSmote}`, {
      method: 'POST'
    });
    return res.json();
  },

  // Predictions
  predictSingle: async (customerData) => {
    const res = await fetch(`${API_BASE}/predictions/single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Prediction failed');
    }
    return res.json();
  },

  getPredictionHistory: async () => {
    const res = await fetch(`${API_BASE}/predictions/history`);
    return res.json();
  },

  // Explainability (SHAP)
  getGlobalExplanations: async () => {
    const res = await fetch(`${API_BASE}/explanations/global`);
    return res.json();
  },

  getLocalExplanation: async (customerData) => {
    const res = await fetch(`${API_BASE}/explanations/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    return res.json();
  },

  // Segmentation
  getSegments: async () => {
    const res = await fetch(`${API_BASE}/segments`);
    return res.json();
  },

  // Retention
  getRetentionRecommendations: async () => {
    const res = await fetch(`${API_BASE}/retention/recommendations`);
    return res.json();
  },

  // Campaigns
  getCampaigns: async () => {
    const res = await fetch(`${API_BASE}/campaigns`);
    return res.json();
  },

  createCampaign: async (campaignData) => {
    const res = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData)
    });
    return res.json();
  },

  getCampaignActivities: async (campaignId) => {
    const res = await fetch(`${API_BASE}/campaigns/${campaignId}/activities`);
    return res.json();
  },

  updateCampaignActivity: async (activityId, status, notes = '') => {
    const res = await fetch(`${API_BASE}/campaigns/activities/${activityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
    return res.json();
  },

  // Reports & Research
  getExecutiveReportSummary: async () => {
    const res = await fetch(`${API_BASE}/reports/summary`);
    return res.json();
  },

  getResearchPaperData: async () => {
    const res = await fetch(`${API_BASE}/reports/research-paper-data`);
    return res.json();
  }
};
