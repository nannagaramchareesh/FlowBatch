import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, FileSpreadsheet, Check, AlertCircle, X, CheckCircle } from 'lucide-react';

const API_UPLOAD_PREVIEW = '/api/upload/preview';
const API_BATCH_CREATE = '/api/tasks/batch';

const Inventory = () => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        setError('Please upload a valid Excel file (.xlsx, .xls) or CSV');
        return;
      }
      setFile(selectedFile);
      setError('');
      setPreviewData([]);
      setSuccess('');
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(API_UPLOAD_PREVIEW, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(res.data);
    } catch (err) {
      console.error(err);
      setError('Error processing file. Ensure it is a valid Excel format.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const validTasks = previewData.filter(row => row.isValid);
    if (validTasks.length === 0) {
      setError('No valid tasks to import.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(API_BATCH_CREATE, { tasks: validTasks });
      setSuccess(res.data.message);
      setPreviewData([]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error importing tasks.');
    } finally {
      setLoading(false);
    }
  };

  const validCount = previewData.filter(r => r.isValid).length;
  const invalidCount = previewData.length - validCount;

  return (
    <div style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h2>Inventory Upload</h2>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={20} /> {success}
        </div>
      )}

      <div className="task-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div 
          style={{ 
            border: '2px dashed var(--border-color)', 
            borderRadius: '8px', 
            padding: '3rem 2rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => fileInputRef.current.click()}
        >
          <FileSpreadsheet size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Select Excel File</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {file ? file.name : 'Upload .xlsx, .xls, or .csv files'}
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx,.xls,.csv" 
            style={{ display: 'none' }} 
          />
        </div>

        {file && previewData.length === 0 && (
          <button 
            className="btn-primary" 
            style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            onClick={handlePreview}
            disabled={loading}
          >
            {loading ? 'Processing...' : <><Upload size={18} /> Preview Data</>}
          </button>
        )}
      </div>

      {previewData.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <div className="flex justify-between items-center mb-4">
            <h3>Preview Data</h3>
            <div className="flex items-center gap-4">
              <span className="text-success">{validCount} Valid</span>
              {invalidCount > 0 && <span className="text-error">{invalidCount} Invalid</span>}
              <button 
                className="btn-primary"
                onClick={handleImport}
                disabled={loading || validCount === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}
              >
                {loading ? 'Importing...' : <><Check size={18} /> Confirm & Import {validCount} Tasks</>}
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Document Name</th>
                  <th>Received Date</th>
                  <th>Received From</th>
                  <th>Issues</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map(row => (
                  <tr key={row.id} className={row.isValid ? '' : 'row-error'}>
                    <td>
                      {row.isValid ? (
                        <CheckCircle size={16} className="text-success" />
                      ) : (
                        <X size={16} className="text-error" />
                      )}
                    </td>
                    <td>{row.documentName || <span className="text-secondary italic">Missing</span>}</td>
                    <td>{row.receivedDate || <span className="text-secondary italic">Missing</span>}</td>
                    <td>{row.receivedFrom || <span className="text-secondary italic">Missing</span>}</td>
                    <td>
                      {row.errors.length > 0 ? (
                        <span className="text-error" style={{ fontSize: '0.75rem' }}>{row.errors.join(', ')}</span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
