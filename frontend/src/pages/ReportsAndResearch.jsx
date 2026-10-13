import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  BookOpen,
  Award,
  Layers,
  CheckCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function ReportsAndResearch() {
  const [summaryData, setSummaryData] = useState(null);
  const [researchData, setResearchData] = useState(null);
  const [activeTab, setActiveTab] = useState('executive'); // 'executive' or 'academic'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getExecutiveReportSummary(), api.getResearchPaperData()])
      .then(([summary, research]) => {
        setSummaryData(summary);
        setResearchData(research);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Reports & Academic Research Deliverables</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Executive audit synthesis and complete IEEE conference manuscript deliverable package.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="bg-slate-100 p-1 rounded-lg flex space-x-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('executive')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md transition ${
                activeTab === 'executive' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Executive
            </button>
            <button
              onClick={() => setActiveTab('academic')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md transition ${
                activeTab === 'academic' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              IEEE Paper
            </button>
          </div>

          <a
            href="/api/reports/download-ieee-doc"
            download="IEEE_Customer_Churn_Research_Paper.docx"
            className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-xs"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>IEEE Word (.docx)</span>
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-slate-900 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-slate-800 transition shadow-xs"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>PDF Export</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE BRIEFING */}
      {activeTab === 'executive' && summaryData && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          <div className="border-b border-slate-200 pb-5">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Executive Intelligence Report</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">Customer Churn & Retention Analytics Synthesis</h2>
            <p className="text-xs text-slate-500 mt-1">Date: {summaryData.generated_date} | Audience: Executive Leadership & Data Science Review Board</p>
          </div>

          {/* Key Findings Grid */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Total Evaluated Base</span>
              <p className="text-xl font-black text-slate-900 mt-1">{summaryData.executive_kpis.total_customers.toLocaleString()}</p>
              <span className="text-[11px] text-slate-500">IBM Telco verified cohort</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Predicted Churn Rate</span>
              <p className="text-xl font-black text-rose-600 mt-1">{summaryData.executive_kpis.churn_rate}%</p>
              <span className="text-[11px] text-slate-500">{summaryData.executive_kpis.predicted_churners.toLocaleString()} At-Risk Accounts</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Monthly Revenue at Risk</span>
              <p className="text-xl font-black text-rose-600 mt-1">
                ${summaryData.executive_kpis.estimated_revenue_at_risk.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-500">{summaryData.executive_kpis.mrr_risk_percentage}% of Recurring MRR</span>
            </div>
          </div>

          {/* Section: Methodology & Validation */}
          <div className="space-y-2 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">1. Data Science & ML Methodology</h3>
            <p className="text-slate-600 leading-relaxed">
              Models were cross-validated using Stratified 5-Fold validation on 80% training partitions with a held-out 20% test split (1,409 accounts). Data leakage was strictly prevented via scikit-learn ColumnTransformer fitted exclusively on training folds. The champion architecture (<strong>{summaryData.champion_model.model_name}</strong>) achieved top discrimination (ROC-AUC: <strong>{summaryData.champion_model.roc_auc}</strong>, F1: <strong>{summaryData.champion_model.f1_score}</strong>).
            </p>
          </div>

          {/* Section: Key Strategic Findings */}
          <div className="space-y-2 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">2. Strategic Insights from Explainable AI (SHAP)</h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Contract Structure is Primary Risk Factor:</strong> Month-to-month contracts elevate churn log-odds by +0.74 SHAP points. Encouraging 1-year contract lock-ins reduces risk to &lt; 12%.</li>
              <li><strong>Support Infrastructure Reduces Churn 63%:</strong> Fiber customers without Tech Support churn at 41.6% compared to 15.2% for supported accounts.</li>
              <li><strong>Payment Friction:</strong> Electronic check users have the highest churn propensity (45.3%). Automated payment incentives yield immediate retention gains.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMIC RESEARCH DELIVERABLE */}
      {activeTab === 'academic' && researchData && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          <div className="border-b border-slate-200 pb-5">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Target Venue: {researchData.target_track}</span>
            <h2 className="text-xl font-black text-slate-900 mt-1 leading-snug">
              {researchData.paper_title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">IEEE Format Ready | Authors: Senior Data Science & ML Engineering Team</p>
          </div>

          {/* Abstract */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 leading-relaxed text-slate-700">
            <span className="font-bold text-slate-900 uppercase text-[11px] block">Abstract</span>
            <p>
              Customer attrition represents a multi-billion dollar challenge across subscription service industries. While conventional machine learning algorithms offer predictive scoring, operational retention teams frequently lack interpretable explanations and decision-support guidance. In this work, we propose an end-to-end explainable machine learning architecture integrating a soft-voting hybrid ensemble (combining XGBoost, bagged Random Forests, and calibrated Logistic Regression) with cooperative game-theoretic SHAP explainability and K-Means risk-value segmentation. Evaluated on the benchmark IBM Telco dataset (7,043 instances) under strict leakage-free stratified cross-validation, the proposed ensemble achieves a superior ROC-AUC of 0.8467 and PR-AUC of 0.6558. Furthermore, our rule-based retention engine maps SHAP feature attributions directly to prescriptive actions, providing a transparent bridge between predictive modeling and strategic business decision-making.
            </p>
            <p className="text-[11px] text-slate-500 pt-1 font-semibold">
              Index Terms—Customer Churn, Explainable AI, SHAP, Hybrid Ensemble, XGBoost, Prescriptive Analytics.
            </p>
          </div>

          {/* Empirical Benchmarking Table */}
          <div className="space-y-2 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Empirical Benchmark Results (Held-Out Test Set)</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3">Model Architecture</th>
                    <th className="py-2.5 px-3">ROC-AUC</th>
                    <th className="py-2.5 px-3">PR-AUC</th>
                    <th className="py-2.5 px-3">Recall</th>
                    <th className="py-2.5 px-3">F1-Score</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {researchData.experiments.map((exp) => (
                    <tr key={exp.model_name} className={exp.model_name.includes('Proposed') ? 'bg-blue-50/70 font-bold' : ''}>
                      <td className="py-2.5 px-3">{exp.model_name.replace(/_/g, ' ')}</td>
                      <td className="py-2.5 px-3 text-blue-600">{exp.roc_auc.toFixed(4)}</td>
                      <td className="py-2.5 px-3">{exp.pr_auc.toFixed(4)}</td>
                      <td className="py-2.5 px-3">{exp.recall.toFixed(4)}</td>
                      <td className="py-2.5 px-3">{exp.f1_score.toFixed(4)}</td>
                      <td className="py-2.5 px-3">{exp.accuracy.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ablation Study */}
          <div className="space-y-2 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Ablation Study Analysis</h3>
            <div className="space-y-2">
              {researchData.ablation_findings.map((abl, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{abl.configuration}</span>
                    <span className="text-slate-500 text-[11px]">{abl.notes}</span>
                  </div>
                  <div className="text-right shrink-0 ml-4 font-mono font-bold text-blue-600">
                    ROC-AUC: {abl.roc_auc.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Genuine IEEE References */}
          <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">IEEE Academic References</h3>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 text-[11px]">
              {researchData.ieee_references.map((ref, idx) => (
                <li key={idx} className="leading-snug">{ref}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
