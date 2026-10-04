import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchBatches,
  uploadFile,
  importSMS,
  fetchStagedTransactions,
  confirmStagedTransaction,
  ignoreStagedTransaction,
  editStagedTransaction,
  confirmAllStaged,
  removeBatch,
  setCurrentBatch,
  clearImportState
} from '../redux/slices/importSlice';
import syntheticSMSData from '../data/synthetic_sms_dataset.json';
import { EditorialHero, FloatingCircle, DotGrid } from '../components/common/DecorativeElements';
import { Icons } from '../components/common/Icons';

function Imports() {
  const dispatch = useDispatch();
  const { batches, currentBatch, stagedTransactions, loading, uploading, error, successMessage } =
    useSelector((state) => state.imports);

  // Mode: 'file' (CSV/Excel) vs 'sms' (Message Ingestion)
  const [activeTab, setActiveTab] = useState('file');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // SMS Ingestion State
  const [smsText, setSmsText] = useState('');
  const [smsFile, setSmsFile] = useState(null);
  const smsFileInputRef = useRef(null);

  // Filter & Edit State
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, STAGED, CONFIRMED, DUPLICATES
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const categories = [
    'Food',
    'Food & Dining',
    'Shopping',
    'Transport',
    'Transportation',
    'Bills',
    'Bills & Utilities',
    'Entertainment',
    'Healthcare',
    'Education',
    'Travel',
    'Salary',
    'Investments',
    'Rent',
    'Transfer',
    'Other'
  ];

  useEffect(() => {
    dispatch(fetchBatches());
  }, [dispatch]);

  useEffect(() => {
    if (batches.length > 0 && !currentBatch) {
      dispatch(setCurrentBatch(batches[0]));
    }
  }, [batches, currentBatch, dispatch]);

  useEffect(() => {
    if (currentBatch && currentBatch._id) {
      dispatch(fetchStagedTransactions(currentBatch._id));
    }
  }, [currentBatch, dispatch]);

  // File Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (['csv', 'xlsx', 'xls'].includes(ext)) {
      setSelectedFile(file);
    } else {
      alert('Please upload a valid CSV or Excel (.xlsx, .xls) file.');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    const type = ext === 'csv' ? 'csv' : 'excel';

    const result = await dispatch(uploadFile({ type, file: selectedFile }));
    if (!result.error) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (result.payload?.batch) {
        dispatch(fetchStagedTransactions(result.payload.batch._id));
      }
    }
  };

  // SMS Ingestion Handlers
  const handleLoadDemoSMS = () => {
    const formatted = syntheticSMSData.map((s) => s.text).join('\n');
    setSmsText(formatted);
    setSmsFile(null);
  };

  const handleSMSFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSmsFile(e.target.files[0]);
      setSmsText('');
    }
  };

  const handleSMSSubmit = async (e) => {
    e.preventDefault();

    let result;
    if (smsFile) {
      const formData = new FormData();
      formData.append('file', smsFile);
      result = await dispatch(importSMS({ payload: formData, isFormData: true }));
    } else if (smsText.trim()) {
      result = await dispatch(importSMS({ payload: { text: smsText }, isFormData: false }));
    } else {
      alert('Please paste SMS message text or select an SMS dataset file.');
      return;
    }

    if (!result.error) {
      setSmsText('');
      setSmsFile(null);
      if (smsFileInputRef.current) smsFileInputRef.current.value = '';
      if (result.payload?.batch) {
        dispatch(fetchStagedTransactions(result.payload.batch._id));
      }
    }
  };

  const handleBatchSelect = (batch) => {
    dispatch(setCurrentBatch(batch));
    setEditingId(null);
  };

  const handleDeleteBatch = async (batchId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this import batch and all its staged transactions?')) {
      await dispatch(removeBatch(batchId));
    }
  };

  const handleConfirmSingle = async (id) => {
    await dispatch(confirmStagedTransaction(id));
  };

  const handleIgnoreSingle = async (id) => {
    await dispatch(ignoreStagedTransaction(id));
  };

  const handleStartEdit = (tx) => {
    setEditingId(tx._id);
    setEditFormData({
      merchant: tx.merchant || '',
      category: tx.category || 'Other',
      amount: tx.amount || 0,
      type: tx.type || 'expense',
      date: tx.transactionDate || tx.date ? new Date(tx.transactionDate || tx.date).toISOString().split('T')[0] : ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = async (id) => {
    await dispatch(editStagedTransaction({ id, data: editFormData }));
    setEditingId(null);
  };

  const handleConfirmAll = async () => {
    if (!currentBatch) return;
    const stagedCount = stagedTransactions.filter((t) => t.status === 'staged').length;
    if (stagedCount === 0) {
      alert('No pending staged transactions to confirm.');
      return;
    }
    if (window.confirm(`Are you sure you want to confirm all ${stagedCount} staged transactions into your active ledger?`)) {
      await dispatch(confirmAllStaged(currentBatch._id));
    }
  };

  // Filtered transactions
  const filteredTransactions = stagedTransactions.filter((tx) => {
    if (filterStatus === 'STAGED') return tx.status === 'staged';
    if (filterStatus === 'CONFIRMED') return tx.status === 'confirmed';
    if (filterStatus === 'IGNORED') return tx.status === 'ignored';
    if (filterStatus === 'DUPLICATES') return tx.isDuplicate;
    return true;
  });

  // Calculate Batch Stats
  const totalCount = stagedTransactions.length;
  const stagedCount = stagedTransactions.filter((t) => t.status === 'staged').length;
  const confirmedCount = stagedTransactions.filter((t) => t.status === 'confirmed').length;
  const ignoredCount = stagedTransactions.filter((t) => t.status === 'ignored').length;
  const duplicateCount = stagedTransactions.filter((t) => t.isDuplicate).length;

  return (
    <div className="space-y-8 pb-16 relative">
      <FloatingCircle size={28} className="absolute -top-4 right-1/4 animate-float-slow" />
      <DotGrid rows={3} cols={5} className="absolute top-10 right-1/3 hidden xl:grid" />

      {/* Header Statement */}
      <EditorialHero
        kicker="DATA INGESTION"
        title={
          <span>
            INGEST & RECONCILE <br />
            <span className="font-light italic text-slate-800">FINANCIAL STATEMENTS.</span>
          </span>
        }
        subtitle="Ingest records from bank statements (CSV / Excel) or SMS transaction messages, review AI categorization & duplicate checks, and approve into your ledger."
      >
        {currentBatch && stagedCount > 0 && (
          <button
            onClick={handleConfirmAll}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 font-bold rounded-2xl shadow-glow-mint transition text-xs active:scale-95"
          >
            <Icons.Check className="w-4 h-4 text-slate-950" />
            <span>Confirm All Staged ({stagedCount})</span>
          </button>
        )}
      </EditorialHero>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Icons.AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => dispatch(clearImportState())} className="text-rose-600 hover:text-rose-900 font-bold">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Icons.Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => dispatch(clearImportState())} className="text-emerald-600 hover:text-emerald-900 font-bold">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mode Switch Tabs & Ingestion Box */}
      <div className="slab-panel overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-emerald-100 bg-emerald-50/30">
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-4 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'file'
                ? 'border-[#35D6A2] text-slate-950 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-emerald-50/50'
            }`}
          >
            <Icons.Upload className="w-4 h-4 text-emerald-700" />
            <span>Bank Statement Upload (CSV / Excel)</span>
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`flex-1 py-4 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'sms'
                ? 'border-[#35D6A2] text-slate-950 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-emerald-50/50'
            }`}
          >
            <Icons.MessageSquare className="w-4 h-4 text-emerald-700" />
            <span>Message / SMS Ingestion</span>
          </button>
        </div>

        {/* Tab 1: Bank Statement Upload */}
        {activeTab === 'file' && (
          <div className="p-7">
            <h2 className="text-base font-bold text-slate-900 mb-1">Upload Bank Statement</h2>
            <p className="text-xs text-slate-500 mb-5">
              Supported formats: <strong className="text-slate-800">.CSV, .XLSX, .XLS</strong>. Auto-maps Indian standard bank columns (HDFC, SBI, ICICI, Axis, Kotak, generic formats).
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-150 ${
                  dragActive
                    ? 'border-[#35D6A2] bg-emerald-50/60'
                    : selectedFile
                    ? 'border-[#35D6A2] bg-emerald-50/40'
                    : 'border-emerald-200/80 hover:border-[#35D6A2] bg-white/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <Icons.Upload className="w-7 h-7 text-[#35D6A2]" />
                  </div>
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-bold text-emerald-950">{selectedFile.name}</p>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        <span className="text-[#1A956C] font-bold hover:underline">Click to browse</span> or drag and drop statement here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Maximum file size: 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-2 border border-emerald-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-semibold transition"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className={`px-5 py-2.5 rounded-2xl font-bold text-xs text-slate-950 shadow-glow-mint flex items-center gap-2 transition active:scale-95 ${
                    !selectedFile || uploading
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600'
                  }`}
                >
                  {uploading ? (
                    <>
                      <Icons.Refresh className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing & Staging...</span>
                    </>
                  ) : (
                    <>
                      <Icons.Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      <span>Process & Ingest File</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Message / SMS Ingestion */}
        {activeTab === 'sms' && (
          <div className="p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Message / SMS Transaction Ingestion
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste bank SMS alerts (single or multiple lines) or upload an SMS export file (.csv / .txt).
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadDemoSMS}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Icons.Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Load 30+ Demo SMS Dataset</span>
                </button>
                {(smsText || smsFile) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSmsText('');
                      setSmsFile(null);
                      if (smsFileInputRef.current) smsFileInputRef.current.value = '';
                    }}
                    className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl text-xs font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Privacy Notice Banner */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-emerald-950 text-xs flex items-center gap-3">
              <Icons.ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <span>
                <strong>Safe Client-Side Ingestion:</strong> FinTrack processes pasted/uploaded messages on-demand without background phone access. Sensitive data (OTPs, PINs, full account numbers) is automatically sanitized & redacted.
              </span>
            </div>

            <form onSubmit={handleSMSSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Paste SMS Alert Text (Supports single or multiple line messages)
                </label>
                <textarea
                  rows={6}
                  value={smsText}
                  onChange={(e) => {
                    setSmsText(e.target.value);
                    if (smsFile) setSmsFile(null);
                  }}
                  placeholder={`Examples:
UPI payment of Rs.480 to SWIGGY on 26-09-2026 was successful. Ref: UPI48192019
INR 1,250 debited from your A/c 5491 for AMAZON on 25-09-2026. Txn ID: AMZ99210
Rs 95,000.00 credited to your account. Salary credit from INFOSYS TECHNOLOGIES on 25-09-2026.
ATM withdrawal of Rs.3,000 from ICICI ATM MG Road on 23-09-2026.
Electricity bill payment of Rs.1,850 to BESCOM completed successfully.`}
                  className="w-full px-4 py-3 border border-emerald-200/80 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-[#35D6A2] focus:border-[#35D6A2] bg-white shadow-xs"
                />
              </div>

              {/* Alternative file upload */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>Or upload SMS file:</span>
                  <input
                    ref={smsFileInputRef}
                    type="file"
                    accept=".csv,.txt,text/plain,text/csv"
                    onChange={handleSMSFileChange}
                    className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100"
                  />
                  {smsFile && (
                    <span className="text-emerald-700 font-semibold truncate max-w-xs">
                      {smsFile.name}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={(!smsText.trim() && !smsFile) || uploading}
                  className={`px-5 py-2.5 rounded-2xl font-bold text-xs text-slate-950 shadow-glow-mint flex items-center justify-center gap-2 transition active:scale-95 ${
                    (!smsText.trim() && !smsFile) || uploading
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600'
                  }`}
                >
                  {uploading ? (
                    <>
                      <Icons.Refresh className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing & Staging SMS...</span>
                    </>
                  ) : (
                    <>
                      <Icons.Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      <span>Parse & Stage Messages</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Main Content Area: Batches & Review */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Batches Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Import History ({batches.length})
            </h3>
            <button
              onClick={() => dispatch(fetchBatches())}
              className="text-xs text-[#1A956C] font-semibold hover:underline"
            >
              Refresh
            </button>
          </div>

          {batches.length === 0 ? (
            <div className="slab-panel p-6 text-center text-slate-400 text-xs">
              No batches ingested yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {batches.map((b) => {
                const isSelected = currentBatch?._id === b._id;
                const sourceBadge = b.source === 'sms' ? 'SMS' : b.source === 'excel' ? 'Excel' : 'CSV';

                return (
                  <div
                    key={b._id}
                    onClick={() => handleBatchSelect(b)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#35D6A2] bg-emerald-50/70 shadow-sm'
                        : 'border-emerald-100/80 bg-white/80 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 truncate" title={b.fileName || b.originalFileName}>
                          {b.fileName || b.originalFileName}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
                          <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-800">{sourceBadge}</span>
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteBatch(b._id, e)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                        title="Delete batch"
                      >
                        <Icons.X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-600">
                        {b.totalRecords || b.totalParsed || b.processedRecords || 0} records ({b.duplicateRecords || b.duplicatesDetected || 0} dups)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          b.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status === 'COMPLETED' ? 'Completed' : 'Review'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Staging Table & Review Panel */}
        <div className="lg:col-span-3 space-y-6">
          {currentBatch ? (
            <>
              {/* Batch KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="slab-panel p-5">
                  <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Total Records</p>
                  <p className="text-2xl font-light font-mono text-slate-900 mt-1">{totalCount}</p>
                </div>
                <div className="slab-panel p-5">
                  <p className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider">Pending Review</p>
                  <p className="text-2xl font-light font-mono text-amber-800 mt-1">{stagedCount}</p>
                </div>
                <div className="slab-panel p-5">
                  <p className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider">Confirmed</p>
                  <p className="text-2xl font-light font-mono text-emerald-900 mt-1">{confirmedCount}</p>
                </div>
                <div className="slab-panel p-5">
                  <p className="text-xs font-mono font-bold text-rose-700 uppercase tracking-wider">Duplicates</p>
                  <p className="text-2xl font-light font-mono text-rose-800 mt-1">{duplicateCount}</p>
                </div>
              </div>

              {/* Review Table Header & Filter Tabs */}
              <div className="slab-panel overflow-hidden">
                <div className="p-4 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-emerald-50/20">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                      Staged Transactions Review
                    </h3>
                    <span className="text-xs font-mono text-slate-500">
                      ({filteredTransactions.length} showing)
                    </span>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                    {[
                      { key: 'ALL', label: `All (${totalCount})` },
                      { key: 'STAGED', label: `Staged (${stagedCount})` },
                      { key: 'CONFIRMED', label: `Confirmed (${confirmedCount})` },
                      { key: 'IGNORED', label: `Ignored (${ignoredCount})` },
                      { key: 'DUPLICATES', label: `Duplicates (${duplicateCount})` }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setFilterStatus(tab.key)}
                        className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                          filterStatus === tab.key
                            ? 'bg-slate-950 text-[#35D6A2] shadow-sm'
                            : 'bg-white border border-emerald-200 text-slate-600 hover:bg-emerald-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-emerald-50/40 text-slate-600 uppercase font-mono font-bold text-[11px] border-b border-emerald-100">
                      <tr>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Merchant / Narration</th>
                        <th className="py-3 px-4">Category & Confidence</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100/60 font-mono">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-12 text-center text-slate-400 font-sans">
                            No transactions found for the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx) => {
                          const isEditing = editingId === tx._id;
                          const confidencePercent = Math.round((tx.confidence || 0.5) * 100);

                          let confBadgeColor = 'bg-slate-100 text-slate-700';
                          if (confidencePercent >= 80) confBadgeColor = 'bg-emerald-100 text-emerald-800';
                          else if (confidencePercent >= 50) confBadgeColor = 'bg-amber-100 text-amber-800';
                          else confBadgeColor = 'bg-rose-100 text-rose-800';

                          return (
                            <tr
                              key={tx._id}
                              className={`hover:bg-emerald-50/30 transition-colors ${
                                tx.isDuplicate ? 'bg-rose-50/30' : ''
                              } ${tx.status === 'confirmed' ? 'bg-emerald-50/20' : ''} ${
                                tx.status === 'ignored' ? 'opacity-50' : ''
                              }`}
                            >
                              {/* Status */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    tx.status === 'confirmed'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : tx.status === 'ignored'
                                      ? 'bg-slate-200 text-slate-700'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {tx.status}
                                </span>
                                {tx.isDuplicate && (
                                  <span
                                    className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200"
                                    title="Potential duplicate of an existing transaction"
                                  >
                                    Dup
                                  </span>
                                )}
                              </td>

                              {/* Date */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                {isEditing ? (
                                  <input
                                    type="date"
                                    value={editFormData.date}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, date: e.target.value })
                                    }
                                    className="px-2 py-1 border border-emerald-200 rounded-lg text-xs w-28 bg-white"
                                  />
                                ) : (
                                  <span className="text-slate-700">
                                    {new Date(tx.transactionDate || tx.date || Date.now()).toLocaleDateString()}
                                  </span>
                                )}
                              </td>

                              {/* Merchant / Narration */}
                              <td className="py-3 px-4 max-w-xs font-sans">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editFormData.merchant}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, merchant: e.target.value })
                                    }
                                    className="px-2 py-1 border border-emerald-200 rounded-lg text-xs w-full bg-white font-sans"
                                  />
                                ) : (
                                  <div>
                                    <p className="font-bold text-slate-900 truncate">
                                      {tx.merchant || tx.description || 'Unknown'}
                                    </p>
                                    {tx.sourceReference && (
                                      <p className="text-[10px] font-mono text-slate-400 truncate">
                                        Ref: {tx.sourceReference}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Category & Confidence */}
                              <td className="py-3 px-4 whitespace-nowrap font-sans">
                                {isEditing ? (
                                  <select
                                    value={editFormData.category}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, category: e.target.value })
                                    }
                                    className="px-2 py-1 border border-emerald-200 rounded-lg text-xs bg-white"
                                  >
                                    {categories.map((c) => (
                                      <option key={c} value={c}>
                                        {c}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700">{tx.category}</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${confBadgeColor}`}
                                      title={`AI categorization confidence: ${confidencePercent}%`}
                                    >
                                      {confidencePercent}%
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Type */}
                              <td className="py-3 px-4 whitespace-nowrap font-sans">
                                {isEditing ? (
                                  <select
                                    value={editFormData.type}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, type: e.target.value })
                                    }
                                    className="px-2 py-1 border border-emerald-200 rounded-lg text-xs bg-white"
                                  >
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                                      tx.type === 'income'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {tx.type}
                                  </span>
                                )}
                              </td>

                              {/* Amount */}
                              <td className="py-3 px-4 whitespace-nowrap text-right">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editFormData.amount}
                                    onChange={(e) =>
                                      setEditFormData({
                                        ...editFormData,
                                        amount: parseFloat(e.target.value) || 0
                                      })
                                    }
                                    className="px-2 py-1 border border-emerald-200 rounded-lg text-xs w-24 text-right bg-white font-mono"
                                  />
                                ) : (
                                  <span
                                    className={`font-mono font-bold ${
                                      tx.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                                    }`}
                                  >
                                    {tx.type === 'income' ? '+' : '-'}₹
                                    {Number(tx.amount || 0).toLocaleString('en-IN', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 whitespace-nowrap text-center font-sans">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleSaveEdit(tx._id)}
                                      className="px-2.5 py-1 bg-gradient-to-r from-[#35D6A2] to-teal-500 text-slate-950 font-bold rounded-lg text-[11px]"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="px-2 py-1 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-[11px]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    {tx.status !== 'confirmed' && (
                                      <button
                                        onClick={() => handleConfirmSingle(tx._id)}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg font-semibold text-[11px] transition"
                                        title="Confirm transaction to active ledger"
                                      >
                                        <Icons.Check className="w-3 h-3" />
                                        <span>Confirm</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleStartEdit(tx)}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-semibold text-[11px] transition"
                                      title="Edit details"
                                    >
                                      <Icons.Edit className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                    {tx.status !== 'ignored' ? (
                                      <button
                                        onClick={() => handleIgnoreSingle(tx._id)}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg font-semibold text-[11px] transition"
                                        title="Ignore transaction"
                                      >
                                        <Icons.X className="w-3 h-3" />
                                        <span>Ignore</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleConfirmSingle(tx._id)}
                                        className="px-2 py-1 text-slate-500 hover:text-slate-700 text-[11px] font-semibold"
                                        title="Restore & Confirm"
                                      >
                                        Restore
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="slab-panel p-12 text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center mx-auto mb-3">
                <Icons.FileText className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">No batch selected</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Upload a bank statement or paste SMS transaction alerts above to begin reviewing and staging into your ledger.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Imports;
