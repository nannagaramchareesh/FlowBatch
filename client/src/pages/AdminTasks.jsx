import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Search, Filter, Loader, AlertCircle } from 'lucide-react';

const API_TASKS = '/api/tasks';
const API_BATCHES = '/api/batches';

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 100;
  
  // Custom Select
  const [customSelectCount, setCustomSelectCount] = useState('');
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [stageFilter, statusFilter]);
  
  // Selection
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(API_TASKS);
      setTasks(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Error fetching tasks');
      setLoading(false);
    }
  };

  const toggleSelection = (id) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTasks(newSelection);
  };

  const handleSelectAll = (filteredList) => {
    const unbatchedTasks = filteredList.filter(t => !t.batchId);
    if (selectedTasks.size === unbatchedTasks.length && unbatchedTasks.length > 0) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(unbatchedTasks.map(t => t._id)));
    }
  };

  const handleQuickSelect = (count) => {
    // Get unbatched tasks from the ENTIRE filtered list (ignoring pagination)
    const unbatchedTasks = filteredTasks.filter(t => !t.batchId);
    const selected = unbatchedTasks.slice(0, count).map(t => t._id);
    setSelectedTasks(new Set(selected));
  };

  const handleCreateBatch = async () => {
    if (selectedTasks.size === 0) return;
    
    setBatchLoading(true);
    setError('');
    try {
      const res = await axios.post(API_BATCHES, { taskIds: Array.from(selectedTasks) });
      setSuccess(`Successfully created batch ${res.data.batchId} with ${selectedTasks.size} tasks.`);
      setSelectedTasks(new Set());
      fetchTasks(); // Refresh list to show updated batch IDs
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error creating batch');
    } finally {
      setBatchLoading(false);
    }
  };

  if (loading) {
    return <div className="container flex items-center justify-center" style={{ height: '80vh' }}><Loader className="animate-spin text-indigo-500" size={48} /></div>;
  }

  const filteredTasks = tasks.filter(task => {
    if (stageFilter && task.currentStage !== stageFilter) return false;
    if (statusFilter && task.status !== statusFilter) return false;
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const displayedTasks = filteredTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

  return (
    <div style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
      <div className="flex-header" style={{ marginBottom: '2rem' }}>
        <h2>All Tasks</h2>
        
        <div className="flex items-center flex-wrap" style={{ gap: '1rem', justifyContent: 'center' }}>
          <div className="flex items-center flex-wrap quick-select-panel" style={{ gap: '0.5rem', marginRight: '1rem', borderRight: '1px solid var(--border-color)', paddingRight: '1.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quick Select:</span>
            <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} onClick={() => handleQuickSelect(20)}>20</button>
            <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} onClick={() => handleQuickSelect(30)}>30</button>
            <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} onClick={() => handleQuickSelect(50)}>50</button>
            <div style={{ display: 'flex', marginLeft: '0.5rem' }}>
              <input 
                type="number" 
                min="1"
                className="form-input" 
                style={{ width: '70px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', borderRadius: '4px 0 0 4px', borderRight: 'none', backgroundColor: 'var(--bg-card)' }}
                placeholder="Custom"
                value={customSelectCount}
                onChange={(e) => setCustomSelectCount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customSelectCount) {
                    handleQuickSelect(parseInt(customSelectCount, 10));
                  }
                }}
              />
              <button 
                className="btn-primary" 
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderRadius: '0 4px 4px 0' }}
                onClick={() => {
                  if (customSelectCount) handleQuickSelect(parseInt(customSelectCount, 10));
                }}
              >
                Go
              </button>
            </div>
          </div>
          
          {selectedTasks.size > 0 && (
            <button 
              className="btn-primary flex items-center" 
              style={{ gap: '0.5rem', backgroundColor: 'var(--accent-hover)' }}
              onClick={handleCreateBatch}
              disabled={batchLoading}
            >
              {batchLoading ? <Loader size={18} className="animate-spin" /> : <Layers size={18} />}
              Create Batch ({selectedTasks.size})
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="task-card flex items-center flex-wrap" style={{ gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="flex items-center" style={{ gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Filter size={18} />
          <span style={{ fontWeight: 500 }}>Filters:</span>
        </div>
        
        <select 
          className="form-select" 
          style={{ width: 'auto', padding: '0.5rem' }}
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          <option value="">All Stages</option>
          <option value="Inventory">Inventory</option>
          <option value="Production">Production</option>
          <option value="QC">QC</option>
          <option value="QA">QA</option>
          <option value="Delivery">Delivery</option>
        </select>

        <select 
          className="form-select" 
          style={{ width: 'auto', padding: '0.5rem' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
        </select>
        
        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Showing {displayedTasks.length > 0 ? (currentPage - 1) * tasksPerPage + 1 : 0}-{Math.min(currentPage * tasksPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
        </span>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input 
                  type="checkbox" 
                  checked={selectedTasks.size > 0 && selectedTasks.size === displayedTasks.filter(t => !t.batchId).length}
                  onChange={() => handleSelectAll(displayedTasks)}
                  disabled={displayedTasks.filter(t => !t.batchId).length === 0}
                />
              </th>
              <th>Document</th>
              <th>Stage</th>
              <th>Status</th>
              <th>Received</th>
              <th>Batch</th>
            </tr>
          </thead>
          <tbody>
            {displayedTasks.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No tasks found matching filters.
                </td>
              </tr>
            ) : (
              displayedTasks.map(task => {
                const isBatched = !!task.batchId;
                return (
                  <tr 
                    key={task._id} 
                    style={{ 
                      opacity: isBatched ? 0.6 : 1, 
                      cursor: isBatched ? 'default' : 'pointer',
                      backgroundColor: selectedTasks.has(task._id) ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                    }}
                    onClick={() => {
                      if (!isBatched) toggleSelection(task._id);
                    }}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedTasks.has(task._id)}
                        onChange={() => toggleSelection(task._id)}
                        disabled={isBatched}
                        style={{ cursor: isBatched ? 'default' : 'pointer' }}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{task.documentName || task.title}</div>
                      {task.receivedFrom && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>from {task.receivedFrom}</div>}
                    </td>
                    <td>
                      <span className={`badge ${task.currentStage ? task.currentStage.toLowerCase() : 'inventory'}`}>
                        {task.currentStage}
                      </span>
                    </td>
                    <td>{task.status}</td>
                    <td>{task.receivedDate ? new Date(task.receivedDate).toLocaleDateString() : '-'}</td>
                    <td>
                      {isBatched ? (
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                          {task.batchId.batchId}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Unbatched</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center" style={{ marginTop: '1.5rem' }}>
          <button 
            className="btn-primary" 
            style={{ backgroundColor: 'var(--bg-secondary)', color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)', opacity: currentPage === 1 ? 0.5 : 1, padding: '0.5rem 1rem' }}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            className="btn-primary" 
            style={{ backgroundColor: 'var(--bg-secondary)', color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)', opacity: currentPage === totalPages ? 0.5 : 1, padding: '0.5rem 1rem' }}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminTasks;
