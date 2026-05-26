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
  const [deliveryFiles, setDeliveryFiles] = useState({});

  // Filter States
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedAssignee, setSelectedAssignee] = useState('All');

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
    const file = deliveryFiles[batchId];
    if (!file) {
      setError('An Excel file upload is mandatory before marking a batch as Delivered.');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await axios.put(`${API_BATCHES}/${batchId}/force-deliver`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setDeliveryFiles(prev => {
        const newState = { ...prev };
        delete newState[batchId];
        return newState;
      });
      fetchBatches();
    } catch (err) {
      console.error(err);
      setError('Error completing delivery');
    }
  };

  const filteredBatches = batches.filter(batch => {
    // Filter by stage
    if (selectedStage !== 'All' && batch.stage !== selectedStage) {
      return false;
    }
    
    // Filter by assignee
    if (selectedAssignee === 'Unassigned') {
      if (batch.assignedTo) return false;
    } else if (selectedAssignee === 'Assigned') {
      if (!batch.assignedTo) return false;
    } else if (selectedAssignee !== 'All') {
      // Specific user ID
      if (!batch.assignedTo || batch.assignedTo._id !== selectedAssignee) {
        return false;
      }
    }
    
    return true;
  });

  if (loading) {
    return <div className="container flex items-center justify-center" style={{ height: '80vh' }}><Loader className="animate-spin text-indigo-500" size={48} /></div>;
  }

  return (
    <div style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
      <div className="flex-header" style={{ marginBottom: '2rem' }}>
        <h2>Batch Summaries</h2>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {batches.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '160px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Stage</label>
            <select 
              className="form-select" 
              style={{ padding: '0.4rem', fontSize: '0.85rem' }}
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
            >
              <option value="All">All Stages</option>
              <option value="Production">Production</option>
              <option value="QC">QC</option>
              <option value="QA">QA</option>
              <option value="Delivery">Delivery</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '200px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Assignee</label>
            <select 
              className="form-select" 
              style={{ padding: '0.4rem', fontSize: '0.85rem' }}
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
            >
              <option value="All">All Batches</option>
              <option value="Unassigned">Unassigned Only</option>
              <option value="Assigned">Assigned (Any User)</option>
              <optgroup label="Specific Team Members">
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({(u.roles || [u.role]).join(', ')})</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      )}

      {batches.length === 0 ? (
        <div className="task-card flex flex-col items-center justify-center" style={{ padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <Layers size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No Batches Found</h3>
          <p>Go to All Tasks to group some tasks into a batch.</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="task-card flex flex-col items-center justify-center" style={{ padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <Layers size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No Batches Match Filters</h3>
          <p>Try adjusting your filter options above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredBatches.map(batch => {
            const assignedUserName = batch.assignedTo?.name || (batch.assignedTo ? 'User' : '');
            const isDeliveryFileSelected = !!deliveryFiles[batch._id];

            return (
              <div 
                key={batch._id} 
                className="task-card" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '1rem 1.5rem', 
                  gap: '1.5rem', 
                  borderLeft: '4px solid var(--accent-primary)', 
                  borderTop: 'none', 
                  margin: 0,
                  flexWrap: 'wrap'
                }}
              >
                {/* Batch ID & Created Date */}
                <div style={{ flex: '1', minWidth: '160px' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} className="text-accent-primary" />
                    {batch.batchId}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Created: {new Date(batch.createdAt).toLocaleDateString()} • {batch.taskIds.length} Tasks
                  </span>
                </div>

                {/* Current Stage Badge */}
                <div style={{ width: '120px', display: 'flex', alignItems: 'center' }}>
                  <span 
                    className={`badge ${batch.stage.toLowerCase()}`}
                    style={{ display: 'inline-block', width: '100px', textAlign: 'center', fontWeight: 600 }}
                  >
                    {batch.stage}
                  </span>
                </div>

                {/* Assign / Delivery Actions */}
                <div style={{ flex: '2', minWidth: '240px', display: 'flex', alignItems: 'center' }}>
                  {batch.stage === 'Delivery' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        onChange={(e) => setDeliveryFiles(prev => ({ ...prev, [batch._id]: e.target.files[0] }))}
                        style={{ fontSize: '0.75rem', maxWidth: '150px' }}
                      />
                      <button 
                        className="btn-primary" 
                        style={{ 
                          padding: '0.4rem 0.8rem', 
                          fontSize: '0.75rem', 
                          backgroundColor: isDeliveryFileSelected ? 'var(--stage-delivery)' : 'var(--bg-card)', 
                          opacity: isDeliveryFileSelected ? 1 : 0.5 
                        }} 
                        disabled={!isDeliveryFileSelected}
                        onClick={() => handleDeliverBatch(batch._id)}
                      >
                        Deliver
                      </button>
                    </div>
                  ) : batch.stage === 'Done' ? (
                    <div style={{ fontSize: '0.875rem', color: `var(--stage-done)`, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--stage-done)15', borderRadius: '4px' }}>Batch Fully Completed</span>
                    </div>
                  ) : batch.assignedTo ? (
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Assigned to <strong style={{ color: `var(--stage-${batch.stage.toLowerCase()})` }}>{assignedUserName}</strong>
                    </div>
                  ) : (
                    <select 
                      className="form-select" 
                      style={{ padding: '0.4rem', fontSize: '0.85rem', width: '100%', maxWidth: '220px' }}
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
                  )}
                </div>

                {/* Audit Trail / History */}
                <div style={{ width: '90px', display: 'flex', justifyContent: 'flex-end' }}>
                  {batch.history && batch.history.length > 0 && (
                    <button 
                      className="btn-primary" 
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        fontSize: '0.75rem', 
                        backgroundColor: 'var(--bg-secondary)', 
                        color: 'var(--text-primary)', 
                        border: '1px solid var(--border-color)' 
                      }}
                      onClick={() => {
                        setSelectedHistoryBatch(batch);
                        setShowHistoryModal(true);
                      }}
                    >
                      History
                    </button>
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
