import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  UserCheck,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Layers,
  Activity
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { api } from '../services/api';

export default function CustomerManagement() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [contractFilter, setContractFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [churnFilter, setChurnFilter] = useState('All');

  // Customer Profile Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // CSV Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  const fetchCustomers = () => {
    setLoading(true);
    const params = {
      page,
      limit: 15,
      contract: contractFilter,
      risk_tier: riskFilter,
      actual_churn: churnFilter
    };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    api.getCustomers(params)
      .then(res => {
        setCustomers(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(res.total_pages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.error('Customer fetch error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, contractFilter, riskFilter, churnFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setContractFilter('All');
    setRiskFilter('All');
    setChurnFilter('All');
    setPage(1);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploadStatus({ loading: true, message: 'Validating schema, applying pipeline & scoring with XGBoost model...' });
    try {
      const res = await api.uploadCustomersCsv(uploadFile);
      const importedCount = res.imported_records ?? 0;
      const updatedCount = res.updated_records ?? 0;
      const totalCount = res.total_in_file ?? importedCount;
      const riskPct = (res.mean_predicted_churn * 100).toFixed(1);
      
      setUploadStatus({
        success: true,
        data: res,
        message: `Successfully processed ${totalCount} records (${importedCount} new, ${updatedCount} updated). Mean churn risk: ${riskPct}%.`
      });
      fetchCustomers();
    } catch (err) {
      setUploadStatus({
        error: true,
        message: err.message || 'CSV upload failed.'
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Customer Data Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, filter, inspect profiles, and upload customer datasets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setUploadStatus(null);
              setUploadFile(null);
              setShowUploadModal(true);
            }}
            className="flex items-center space-x-2 px-3.5 sm:px-4 py-2 bg-slate-900 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-slate-800 transition shadow-xs"
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span>Upload CSV</span>
          </button>

          <a
            href={api.exportCustomersUrl(riskFilter, contractFilter)}
            download
            className="flex items-center space-x-2 px-3.5 sm:px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold hover:bg-slate-50 transition shadow-xs"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Customer ID or Payment Method..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </form>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Contract:</span>
            <select
              value={contractFilter}
              onChange={(e) => { setContractFilter(e.target.value); setPage(1); }}
              className="text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            >
              <option value="All">All Contracts</option>
              <option value="Month-to-month">Month-to-month</option>
              <option value="One year">One year</option>
              <option value="Two year">Two year</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Risk Tier:</span>
            <select
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
              className="text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            >
              <option value="All">All Risk Tiers</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Actual Churn:</span>
            <select
              value={churnFilter}
              onChange={(e) => { setChurnFilter(e.target.value); setPage(1); }}
              className="text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            >
              <option value="All">All Records</option>
              <option value="Yes">Historical Churn (Yes)</option>
              <option value="No">Historical Active (No)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Customer ID</th>
                <th className="py-3.5 px-4">Tenure</th>
                <th className="py-3.5 px-4">Contract</th>
                <th className="py-3.5 px-4">Internet</th>
                <th className="py-3.5 px-4">Monthly Charge</th>
                <th className="py-3.5 px-4">Model Churn Prob</th>
                <th className="py-3.5 px-4">Risk Tier</th>
                <th className="py-3.5 px-4">Historical Churn</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-medium">
                    Loading customer data...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-700">No customers found</p>
                      <p className="text-xs text-slate-400">No customer records match your active search or filter criteria.</p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{c.customer_id}</td>
                    <td className="py-3.5 px-4 text-slate-600">{c.tenure} mos</td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{c.contract}</td>
                    <td className="py-3.5 px-4 text-slate-600">{c.internet_service}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">${c.monthly_charges.toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">
                          {c.predicted_churn_prob ? `${(c.predicted_churn_prob * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                        {c.predicted_churn_prob && (
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                c.predicted_churn_prob >= 0.65
                                  ? 'bg-rose-500'
                                  : c.predicted_churn_prob >= 0.35
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${c.predicted_churn_prob * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge tier={c.risk_tier} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        c.actual_churn === 'Yes' ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {c.actual_churn || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="View Customer Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Showing Page <span className="font-bold text-slate-800">{page}</span> of{' '}
            <span className="font-bold text-slate-800">{totalPages}</span> ({total.toLocaleString()} Total Records)
          </p>

          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer 360 Profile Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Customer Profile: {selectedCustomer.customer_id}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Comprehensive subscription and risk breakdown</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">Risk Tier</span>
                <div className="mt-1">
                  <RiskBadge tier={selectedCustomer.risk_tier} />
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">Churn Probability</span>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                  {selectedCustomer.predicted_churn_prob ? `${(selectedCustomer.predicted_churn_prob * 100).toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">Monthly Charge</span>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                  ${selectedCustomer.monthly_charges.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Contract & Billing</h4>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Contract Type:</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer.contract}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tenure:</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer.tenure} Months</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer.payment_method}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Total Charges:</span>
                  <span className="font-semibold text-slate-800">${selectedCustomer.total_charges.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Subscribed Services</h4>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Internet Service:</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer.internet_service}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Senior Citizen:</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer.senior_citizen ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Historical Churn:</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer.actual_churn}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Assigned Segment:</span>
                  <span className="font-semibold text-blue-600">{selectedCustomer.segment_code || 'STANDARD'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  navigate('/predict');
                }}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition inline-flex items-center space-x-1"
              >
                <span>Run What-If Simulation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Ingest & Batch Score Customer CSV</h3>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadStatus(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation Pipeline */}
            {!uploadStatus?.success && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Upload a Telco customer CSV file to automatically trigger the end-to-end data ingestion and machine learning inference pipeline:
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block">1. Schema Validation</span>
                    <span className="text-slate-500">Verifies mandatory features (tenure, charges, contracts).</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block">2. ML Inference</span>
                    <span className="text-slate-500">Scores batch with leak-free Champion XGBoost model.</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block">3. Risk Classification</span>
                    <span className="text-slate-500">Assigns High, Medium, or Low risk tiers and segments.</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block">4. MySQL Database Sync</span>
                    <span className="text-slate-500">Persists records to MySQL database and logs audit history.</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {!uploadStatus?.success && (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-blue-400 transition cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">Accepted format: CSV with standard Telco Customer fields</p>
                </div>
              )}

              {uploadStatus && (
                <div className={`p-3.5 rounded-xl text-xs font-medium space-y-1 ${
                  uploadStatus.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' :
                  uploadStatus.error ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-blue-50 text-blue-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    {uploadStatus.success && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {uploadStatus.error && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span className="font-semibold">{uploadStatus.message}</span>
                  </div>
                </div>
              )}

              {/* What Next? Actions after successful upload */}
              {uploadStatus?.success && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>What Next? Follow The Churn Analytics Workflow:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadModal(false);
                        setUploadStatus(null);
                      }}
                      className="p-2.5 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-left transition flex items-center justify-between group shadow-2xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition">1. Explore Table</span>
                        <span className="text-[11px] text-slate-500">Inspect newly scored customer rows</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadModal(false);
                        navigate('/segments');
                      }}
                      className="p-2.5 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-left transition flex items-center justify-between group shadow-2xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition">2. Segments</span>
                        <span className="text-[11px] text-slate-500">View Risk-Value cohort distributions</span>
                      </div>
                      <Layers className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadModal(false);
                        navigate('/retention');
                      }}
                      className="p-2.5 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-left transition flex items-center justify-between group shadow-2xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition">3. Retention Engine</span>
                        <span className="text-[11px] text-slate-500">Calculate ROI & prescribe actions</span>
                      </div>
                      <ShieldAlert className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadModal(false);
                        navigate('/campaigns');
                      }}
                      className="p-2.5 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-left transition flex items-center justify-between group shadow-2xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition">4. Campaigns</span>
                        <span className="text-[11px] text-slate-500">Enroll at-risk users into outreach</span>
                      </div>
                      <Activity className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadStatus(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  {uploadStatus?.success ? 'Close' : 'Cancel'}
                </button>
                {!uploadStatus?.success && (
                  <button
                    type="submit"
                    disabled={!uploadFile || uploadStatus?.loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 transition shadow-xs"
                  >
                    {uploadStatus?.loading ? 'Processing & Scoring...' : 'Upload & Score CSV'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
