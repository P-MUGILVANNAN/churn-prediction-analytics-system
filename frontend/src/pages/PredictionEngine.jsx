import React, { useState } from 'react';
import {
  UserCheck,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  DollarSign,
  Calendar,
  Send,
  Zap,
  Upload,
  Download
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { api } from '../services/api';

const PRESET_ARCHETYPES = {
  highRisk: {
    label: 'High-Risk Month-to-Month Fiber',
    data: {
      customerID: 'ARCH-RISK-01',
      gender: 'Female',
      SeniorCitizen: 0,
      Partner: 'No',
      Dependents: 'No',
      tenure: 2,
      PhoneService: 'Yes',
      MultipleLines: 'No',
      InternetService: 'Fiber optic',
      OnlineSecurity: 'No',
      OnlineBackup: 'No',
      DeviceProtection: 'No',
      TechSupport: 'No',
      StreamingTV: 'Yes',
      StreamingMovies: 'No',
      Contract: 'Month-to-month',
      PaperlessBilling: 'Yes',
      PaymentMethod: 'Electronic check',
      MonthlyCharges: 85.0
    }
  },
  loyalVIP: {
    label: 'Loyal Two-Year Enterprise VIP',
    data: {
      customerID: 'ARCH-LOYAL-02',
      gender: 'Male',
      SeniorCitizen: 0,
      Partner: 'Yes',
      Dependents: 'Yes',
      tenure: 60,
      PhoneService: 'Yes',
      MultipleLines: 'Yes',
      InternetService: 'DSL',
      OnlineSecurity: 'Yes',
      OnlineBackup: 'Yes',
      DeviceProtection: 'Yes',
      TechSupport: 'Yes',
      StreamingTV: 'Yes',
      StreamingMovies: 'Yes',
      Contract: 'Two year',
      PaperlessBilling: 'No',
      PaymentMethod: 'Credit card (automatic)',
      MonthlyCharges: 75.0
    }
  },
  borderline: {
    label: 'Borderline 1-Year Contract DSL',
    data: {
      customerID: 'ARCH-BORDER-03',
      gender: 'Male',
      SeniorCitizen: 1,
      Partner: 'No',
      Dependents: 'No',
      tenure: 18,
      PhoneService: 'Yes',
      MultipleLines: 'No',
      InternetService: 'Fiber optic',
      OnlineSecurity: 'No',
      OnlineBackup: 'Yes',
      DeviceProtection: 'No',
      TechSupport: 'No',
      StreamingTV: 'No',
      StreamingMovies: 'No',
      Contract: 'One year',
      PaperlessBilling: 'Yes',
      PaymentMethod: 'Bank transfer (automatic)',
      MonthlyCharges: 70.0
    }
  }
};

export default function PredictionEngine() {
  const [formData, setFormData] = useState(PRESET_ARCHETYPES.highRisk.data);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchFile, setBatchFile] = useState(null);
  const [batchScoring, setBatchScoring] = useState(false);

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await api.predictSingle(formData);
      setPrediction(res);
    } catch (err) {
      alert(`Prediction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadArchetype = (key) => {
    const arch = PRESET_ARCHETYPES[key].data;
    setFormData(arch);
    setPrediction(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Customer Churn Prediction Engine</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Real-time individual inference with local SHAP attributions and prescriptive retention strategies.
        </p>
      </div>

      {/* Preset Archetypes Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-slate-700">Quick Test Archetypes:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {Object.entries(PRESET_ARCHETYPES).map(([key, arch]) => (
            <button
              key={key}
              onClick={() => loadArchetype(key)}
              className="text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition"
            >
              {arch.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Customer Parameters (7 Cols) */}
        <form onSubmit={handlePredict} className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Customer Subscription Parameters</h2>
            <span className="text-xs text-slate-400 font-mono">ID: {formData.customerID}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Contract Type */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Contract Duration *</label>
              <select
                value={formData.Contract}
                onChange={(e) => handleInputChange('Contract', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Month-to-month">Month-to-month</option>
                <option value="One year">One year</option>
                <option value="Two year">Two year</option>
              </select>
            </div>

            {/* Internet Service */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Internet Service *</label>
              <select
                value={formData.InternetService}
                onChange={(e) => handleInputChange('InternetService', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Fiber optic">Fiber optic</option>
                <option value="DSL">DSL</option>
                <option value="No">No Internet</option>
              </select>
            </div>

            {/* Tenure Slider */}
            <div className="sm:col-span-2 space-y-1">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Tenure: {formData.tenure} Months</span>
                <span className="text-slate-400 text-[11px] font-normal">Max: 72 Mos</span>
              </div>
              <input
                type="range"
                min="1"
                max="72"
                value={formData.tenure}
                onChange={(e) => handleInputChange('tenure', parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Monthly Charges Slider */}
            <div className="sm:col-span-2 space-y-1">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Monthly Charges: ${formData.MonthlyCharges.toFixed(2)}</span>
                <span className="text-slate-400 text-[11px] font-normal">Range: $18 - $120</span>
              </div>
              <input
                type="range"
                min="18"
                max="120"
                step="0.5"
                value={formData.MonthlyCharges}
                onChange={(e) => handleInputChange('MonthlyCharges', parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Tech Support */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Technical Support</label>
              <select
                value={formData.TechSupport}
                onChange={(e) => handleInputChange('TechSupport', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>

            {/* Online Security */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cybersecurity Suite</label>
              <select
                value={formData.OnlineSecurity}
                onChange={(e) => handleInputChange('OnlineSecurity', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
              <select
                value={formData.PaymentMethod}
                onChange={(e) => handleInputChange('PaymentMethod', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Electronic check">Electronic check</option>
                <option value="Mailed check">Mailed check</option>
                <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                <option value="Credit card (automatic)">Credit card (automatic)</option>
              </select>
            </div>

            {/* Paperless Billing */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Paperless Billing</label>
              <select
                value={formData.PaperlessBilling}
                onChange={(e) => handleInputChange('PaperlessBilling', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-500/20 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Evaluating Model...' : 'Calculate Churn Probability'}</span>
            </button>
          </div>
        </form>

        {/* Right Output: Score & Recommendations (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {prediction ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-300">
              {/* Score Gauge */}
              <div className="text-center pb-5 border-b border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Churn Propensity</span>
                <div className="flex items-center justify-center space-x-3 my-2">
                  <span className={`text-4xl font-black ${
                    prediction.risk_tier === 'High' ? 'text-rose-600' :
                    prediction.risk_tier === 'Medium' ? 'text-amber-500' : 'text-emerald-600'
                  }`}>
                    {(prediction.churn_probability * 100).toFixed(1)}%
                  </span>
                  <RiskBadge tier={prediction.risk_tier} />
                </div>
                <p className="text-xs text-slate-500">
                  {prediction.risk_tier === 'High'
                    ? 'Elevated risk of attrition within 30-60 days. Immediate intervention advised.'
                    : prediction.risk_tier === 'Medium'
                    ? 'Moderate sensitivity. Monitor billing events.'
                    : 'Stable account. Standard loyalty cadences apply.'}
                </p>
              </div>

              {/* Financial Risk Exposure */}
              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Monthly Recurring Revenue at Risk:</span>
                <span className="font-black text-rose-600 text-sm">
                  ${prediction.monthly_revenue_at_risk.toFixed(2)} / mo
                </span>
              </div>

              {/* Top SHAP Drivers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top Explainability Factors (SHAP)</h3>
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="space-y-1.5">
                  {prediction.explanation?.contributions?.slice(0, 3).map((factor, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{factor.feature}</span>
                      <span className={`font-bold ${factor.shap_value > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {factor.shap_value > 0 ? `+${factor.shap_value.toFixed(3)}` : factor.shap_value.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retention Prescription */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>Prescribed Retention Strategy</span>
                </div>
                <p className="text-xs font-bold text-slate-900 leading-snug">
                  {prediction.retention?.primary_recommendation}
                </p>
                <div className="flex items-center justify-between text-[11px] text-blue-800 pt-2 border-t border-blue-100">
                  <span>Priority: <strong>{prediction.retention?.priority}</strong></span>
                  <span>Follow-Up: <strong>{prediction.retention?.suggested_follow_up_date}</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200/80 shadow-xs text-center flex flex-col items-center justify-center space-y-3 min-h-[350px]">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Prediction Generated</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Adjust customer parameters on the left or click a Quick Test Archetype to run real-time inference.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
