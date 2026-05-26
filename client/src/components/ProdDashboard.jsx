import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Loader, CheckCircle, PlayCircle, Send, FileSpreadsheet, Download } from 'lucide-react';

const API_BATCHES = '/api/batches';
const API_TASKS = '/api/tasks';

const RoleDashboard = ({ user }) => {
  const [batches, setBatches] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batchFiles, setBatchFiles] = useState({}); // state for uploaded files per batch

  // Debug states
  const [batchesResDataLength, setBatchesResDataLength] = useState(0);
  const [batchesMatchingId, setBatchesMatchingId] = useState(0);
  const [sampleBatchId, setSampleBatchId] = useState('');
  const [sampleBatchStage, setSampleBatchStage] = useState('');
  const [sampleBatchAssignedTo, setSampleBatchAssignedTo] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch both batches and tasks
      const [batchesRes, tasksRes] = await Promise.all([
        axios.get(API_BATCHES),
        axios.get(API_TASKS)
      ]);

      // Filter for batches and tasks assigned to this user in any of their current stages
      const rolesArray = (user.roles && user.roles.length > 0) ? user.roles : (user.role ? [user.role] : []);
      const userRolesLower = rolesArray.map(r => r.toLowerCase());

      const allBatches = batchesRes.data;
      setBatchesResDataLength(allBatches.length);
      setBatchesMatchingId(allBatches.filter(b => String(b.assignedTo) === String(user._id)).length);

      if (allBatches.length > 0) {
        setSampleBatchId(allBatches[0].batchId);
        setSampleBatchStage(allBatches[0].stage);
        setSampleBatchAssignedTo(String(allBatches[0].assignedTo));
      }

      const userBatches = allBatches.filter(b => String(b.assignedTo) === String(user._id) && userRolesLower.includes(String(b.stage).toLowerCase()));
      const userTasks = tasksRes.data.filter(t => String(t.assignedTo) === String(user._id) && userRolesLower.includes(String(t.currentStage).toLowerCase()));

      setBatches(userBatches);
      setTasks(userTasks);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Error fetching dashboard data');
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`${API_TASKS}/${taskId}`, { status: newStatus });
      // Optimistically update local state
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
      setError('Error updating task status');
    }
  };

  const handleFileChange = (batchId, file) => {
    setBatchFiles(prev => ({ ...prev, [batchId]: file }));
  };

  const handleSubmitBatch = async (batchId) => {
    const file = batchFiles[batchId];
    if (!file) {
      setError('An Excel file upload is mandatory before submitting the batch.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.put(`${API_BATCHES}/${batchId}/advance`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Clear file state for this batch
      setBatchFiles(prev => {
        const newState = { ...prev };
        delete newState[batchId];
        return newState;
      });
      
      // Re-fetch data to reflect batch leaving the dashboard
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error advancing batch stage');
    }
  };

  const handleReturnBatch = async (batchId) => {
    const file = batchFiles[batchId];
    if (!file) {
      setError('An Excel file upload is mandatory before returning the batch.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.put(`${API_BATCHES}/${batchId}/return`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setBatchFiles(prev => {
        const newState = { ...prev };
        delete newState[batchId];
        return newState;
      });

      // Re-fetch data
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error returning batch to previous stage');
    }
  };

  const stages = ['Production', 'QC', 'QA', 'Delivery', 'Done'];

  if (loading) {
    return <div className="container flex items-center justify-center" style={{ height: '50vh' }}><Loader className="animate-spin text-indigo-500" size={48} /></div>;
  }

  return (
    <div className="role-dashboard" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Assigned Batches</h2>
        <span style={{ color: 'var(--text-secondary)' }}>Welcome back, {user.name}</span>
      </div>



      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {batches.length === 0 ? (
        <div className="task-card flex flex-col items-center justify-center" style={{ padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <Layers size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No Assigned Batches</h3>
          <p>You currently have no batches assigned to you.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {batches.map(batch => {
            const batchTasks = tasks.filter(t => t.batchId && (t.batchId._id === batch._id || t.batchId === batch._id));
            const allCompleted = batchTasks.length > 0 && batchTasks.every(t => t.status === 'Completed');

            const batchStageIndex = stages.findIndex(s => s.toLowerCase() === batch.stage.toLowerCase());
            const nextStageName = batchStageIndex !== -1 && batchStageIndex < stages.length - 1 ? stages[batchStageIndex + 1] : 'Completed';

            return (
              <div key={batch._id} className="task-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="flex-header" style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layers size={20} className="text-accent-primary" />
                      {batch.batchId}
                    </h3>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {batchTasks.length} Tasks • Assigned on {new Date(batch.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex" style={{ gap: '0.5rem' }}>
                    {batchStageIndex > 0 && (
                      <button
                        className="btn-primary flex items-center"
                        style={{
                          gap: '0.5rem',
                          backgroundColor: 'transparent',
                          border: `1px solid var(--stage-${stages[batchStageIndex - 1].toLowerCase()})`,
                          color: `var(--stage-${stages[batchStageIndex - 1].toLowerCase()})`,
                          opacity: batchFiles[batch._id] ? 1 : 0.5,
                          cursor: batchFiles[batch._id] ? 'pointer' : 'not-allowed'
                        }}
                        disabled={!batchFiles[batch._id]}
                        onClick={() => handleReturnBatch(batch._id)}
                      >
                        Return to {stages[batchStageIndex - 1]}
                      </button>
                    )}

                    <button
                      className="btn-primary flex items-center"
                      style={{
                        gap: '0.5rem',
                        opacity: allCompleted && batchFiles[batch._id] ? 1 : 0.5,
                        cursor: allCompleted && batchFiles[batch._id] ? 'pointer' : 'not-allowed',
                        backgroundColor: allCompleted && batchFiles[batch._id] ? `var(--stage-${nextStageName.toLowerCase()})` : 'var(--bg-card)'
                      }}
                      disabled={!allCompleted || !batchFiles[batch._id]}
                      onClick={() => handleSubmitBatch(batch._id)}
                    >
                      <Send size={18} />
                      Submit to {nextStageName}
                    </button>
                  </div>
                </div>

                {/* File Upload & Previous Files Section */}
                <div style={{ padding: '1rem 1.5rem', backgroundColor: 'rgba(0,0,0,0.1)', borderBottom: '1px solid var(--border-color)' }}>
                  
                  {/* Previous Files */}
                  {(() => {
                    const latestFiles = [];
                    const seenStages = new Set();
                    if (!batch.history) return null;
                    
                    // Loop backwards to get the most recent files first
                    const historyWithFiles = [...batch.history].reverse().filter(h => h.fileName);
                    
                    for (const hist of historyWithFiles) {
                      // Extract base stage name (e.g., "QC (Returned)" -> "QC")
                      const baseStage = hist.stage.split(' ')[0];
                      if (!seenStages.has(baseStage)) {
                        latestFiles.push(hist);
                        seenStages.add(baseStage);
                      }
                    }

                    if (latestFiles.length === 0) return null;

                    return (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Previous Stage Files</h4>
                        <div className="flex" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                          {latestFiles.reverse().map((hist, idx) => (
                            <a 
                              key={idx} 
                              href={`${hist.fileUrl}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="badge" 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.25rem', 
                                backgroundColor: 'var(--bg-card)', 
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                textDecoration: 'none'
                              }}
                              title={`Uploaded at ${new Date(hist.completedAt).toLocaleString()}`}
                            >
                              <FileSpreadsheet size={14} className={`text-${hist.stage.split(' ')[0].toLowerCase()}`} />
                              {hist.stage} Excel <Download size={12} />
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Mandatory Upload for Next Stage / Return */}
                  <div className="flex-header" style={{ gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#ef4444' }}>*</span> Mandatory Excel Upload
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Please upload your Excel sheet to advance or return this batch.
                      </p>
                    </div>
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv" 
                      onChange={(e) => handleFileChange(batch._id, e.target.files[0])}
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div className="table-container" style={{ margin: 0, border: 'none' }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead style={{ backgroundColor: 'var(--bg-card)' }}>
                      <tr>
                        <th>Document</th>
                        <th>Received</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchTasks.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No tasks found in this batch.</td></tr>
                      ) : (
                        batchTasks.map(task => (
                          <tr key={task._id}>
                            <td>
                              <div style={{ fontWeight: 500 }}>{task.documentName || task.title}</div>
                              {task.receivedFrom && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>from {task.receivedFrom}</div>}
                            </td>
                            <td>{task.receivedDate ? new Date(task.receivedDate).toLocaleDateString() : '-'}</td>
                            <td>
                              <span className={`badge ${task.status === 'Completed' ? 'delivery' : task.status === 'In Progress' ? 'production' : 'inventory'}`}>
                                {task.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="flex justify-end gap-2">
                                {task.status === 'Pending' && (
                                  <button
                                    className="btn-primary"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', backgroundColor: 'var(--stage-production)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                    onClick={() => handleUpdateTaskStatus(task._id, 'In Progress')}
                                  >
                                    <PlayCircle size={14} /> Start
                                  </button>
                                )}
                                {(task.status === 'Pending' || task.status === 'In Progress') && (
                                  <button
                                    className="btn-primary"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', backgroundColor: 'var(--stage-delivery)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                    onClick={() => handleUpdateTaskStatus(task._id, 'Completed')}
                                  >
                                    <CheckCircle size={14} /> Complete
                                  </button>
                                )}
                                {task.status === 'Completed' && (
                                  <span style={{ color: 'var(--stage-delivery)', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                    <CheckCircle size={16} /> Done
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoleDashboard;
