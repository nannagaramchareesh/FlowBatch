import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Loader, Calendar, FileText, Download, FileSpreadsheet } from 'lucide-react';

const API_BATCHES = '/api/batches';

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryBatch, setSelectedHistoryBatch] = useState(null);
  const [deliveryFile, setDeliveryFile] = useState(null);

  useEffect(() => {
    fetchBatches();
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get('/api/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await axios.get(API_BATCHES);
      setBatches(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Error fetching batches');
      setLoading(false);
    }
  };

  const handleAssign = async (batchId, e) => {
    const userId = e.target.value;
    const userName = e.target.options[e.target.selectedIndex].text;
    
    if (!userId) return;

    if (!window.confirm(`Are you sure you want to assign this batch to ${userName}?`)) {
      e.target.value = ""; // Reset dropdown to default
      return;
    }

    try {
      await axios.put(`${API_BATCHES}/${batchId}/assign`, { userId });
      fetchBatches(); // Refresh batches to reflect new assignment
    } catch (err) {
      console.error(err);
      setError('Error assigning batch');
    }
  };

  const handleDeliverBatch = async (batchId) => {
    if (!deliveryFile) {
      setError('An Excel file upload is mandatory before marking a batch as Delivered.');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', deliveryFile);
      
      await axios.put(`${API_BATCHES}/${batchId}/force-deliver`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setDeliveryFile(null);
      fetchBatches();
    } catch (err) {
      console.error(err);
      setError('Error completing delivery');
    }
  };

  if (loading) {
    return <div className="container flex items-center justify-center" style={{ height: '80vh' }}><Loader className="animate-spin text-indigo-500" size={48} /></div>;
  }

  return (
    <div style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h2>Batch Summaries</h2>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {batches.length === 0 ? (
        <div className="task-card flex flex-col items-center justify-center" style={{ padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <Layers size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No Batches Found</h3>
          <p>Go to All Tasks to group some tasks into a batch.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {batches.map(batch => {
            // Calculate status breakdown from populated taskIds
            const taskStatuses = batch.taskIds.reduce((acc, t) => {
              acc[t.status] = (acc[t.status] || 0) + 1;
              return acc;
            }, {});

            return (
              <div key={batch._id} className="task-card" style={{ borderTop: '4px solid var(--accent-primary)' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{batch.batchId}</h3>
                  <div className="flex gap-2 items-center">
                    {batch.history && batch.history.length > 0 && (
                      <button 
                        className="btn-primary" 
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                        onClick={() => {
                          setSelectedHistoryBatch(batch);
                          setShowHistoryModal(true);
                        }}
                      >
                        History
                      </button>
                    )}
                    <span className={`badge ${batch.stage.toLowerCase()}`}>{batch.stage}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div className="flex items-center text-secondary" style={{ gap: '0.5rem', fontSize: '0.875rem' }}>
                    <Calendar size={16} />
                    <span>Created: {new Date(batch.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-secondary" style={{ gap: '0.5rem', fontSize: '0.875rem' }}>
                    <FileText size={16} />
                    <span>{batch.taskIds.length} Tasks Included</span>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status Breakdown
                  </div>
                  {Object.keys(taskStatuses).length === 0 ? (
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No tasks</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {Object.entries(taskStatuses).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center" style={{ fontSize: '0.875rem' }}>
                          <span style={{ color: 'var(--text-primary)' }}>{status}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  {batch.stage === 'Delivery' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#ef4444' }}>*</span> Upload Final Delivery Excel:
                        </div>
                        <input 
                          type="file" 
                          accept=".xlsx, .xls, .csv" 
                          onChange={(e) => setDeliveryFile(e.target.files[0])}
                          style={{ fontSize: '0.75rem', width: '100%' }}
                        />
                      </div>
                      <button 
                        className="btn-primary flex items-center justify-center gap-2" 
                        style={{ width: '100%', backgroundColor: deliveryFile ? 'var(--stage-delivery)' : 'var(--bg-card)', opacity: deliveryFile ? 1 : 0.5 }} 
                        disabled={!deliveryFile}
                        onClick={() => handleDeliverBatch(batch._id)}
                      >
                        <Layers size={18} /> Mark Delivered & Complete
                      </button>
                    </div>
                  ) : batch.stage === 'Done' ? (
                    <div style={{ fontSize: '0.875rem', color: `var(--stage-done)`, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <span style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--stage-done)20', borderRadius: '4px', width: '100%', textAlign: 'center' }}>Batch Fully Completed</span>
                    </div>
                  ) : batch.assignedTo ? (
                    <div style={{ fontSize: '0.875rem', color: `var(--stage-${batch.stage.toLowerCase()})`, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>Assigned to {batch.stage} User</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select 
                        className="form-select" 
                        style={{ padding: '0.5rem', flex: 1 }}
                        onChange={(e) => handleAssign(batch._id, e)}
                        defaultValue=""
                      >
                        <option value="" disabled>Assign to {batch.stage} User...</option>
                        {users.filter(u => {
                          const rolesArray = (u.roles && u.roles.length > 0) ? u.roles : (u.role ? [u.role] : []);
                          return rolesArray.some(r => r.toLowerCase() === batch.stage.toLowerCase());
                        }).map(u => (
                          <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedHistoryBatch && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} className="text-accent-primary" />
                Audit Trail: {selectedHistoryBatch.batchId}
              </h3>
              <button className="icon-btn" onClick={() => setShowHistoryModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="timeline">
                {selectedHistoryBatch.history.map((entry, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                        <span 
                          className={`badge ${entry.stage.toLowerCase().replace(' (returned)', '')}`} 
                          style={entry.stage.includes('Returned') ? { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' } : {}}
                        >
                          {entry.stage.includes('Returned') ? entry.stage : `${entry.stage} Completed`}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(entry.completedAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        <strong>User:</strong> {entry.assignedTo ? entry.assignedTo.name : 'Unknown User'}
                      </div>
                      
                      {entry.fileName && (
                        <a 
                          href={`${entry.fileUrl}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="badge" 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem', 
                            backgroundColor: 'rgba(255,255,255,0.05)', 
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            marginTop: '0.25rem'
                          }}
                        >
                          <FileSpreadsheet size={14} className="text-accent-primary" />
                          {entry.fileName} <Download size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batches;
