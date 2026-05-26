import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import { Plus, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoleDashboard from '../components/ProdDashboard';

const API_URL = '/api/tasks';

const Dashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user && isAdmin) {
      fetchTasks();
    }
  }, [user, authLoading, navigate, isAdmin]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(API_URL);
      setTasks(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tasks", error);
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    try {
      const res = await axios.post(API_URL, {
        title: newTaskTitle,
        description: newTaskDesc,
        stage: 'Production'
      });
      setTasks([...tasks, res.data]);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowAddForm(false);
    } catch (error) {
      console.error("Error creating task", error);
    }
  };

  const handleMoveTask = async (id, newStage) => {
    try {
      const res = await axios.put(`${API_URL}/${id}`, { stage: newStage });
      setTasks(tasks.map(t => t._id === id ? res.data : t));
    } catch (error) {
      console.error("Error updating task", error);
    }
  };

  if (authLoading || (loading && isAdmin)) {
    return <div className="container flex items-center justify-center" style={{ height: '80vh' }}><Loader className="animate-spin text-indigo-500" size={48} /></div>;
  }

  // Render dedicated Role Dashboard for non-admin operational users
  const hasOperationalRole = user?.roles?.some(r => ['production', 'qa', 'qc', 'delivery'].includes(r)) || ['production', 'qa', 'qc', 'delivery'].includes(user?.role);
  if (!isAdmin && hasOperationalRole) {
    return <RoleDashboard user={user} />;
  }

  const productionTasks = tasks.filter(t => t.stage === 'Production' || t.currentStage === 'Production');
  const qaTasks = tasks.filter(t => t.stage === 'QA' || t.currentStage === 'QA');
  const qcTasks = tasks.filter(t => t.stage === 'QC' || t.currentStage === 'QC');
  const deliveryTasks = tasks.filter(t => t.stage === 'Delivery' || t.currentStage === 'Delivery');

  // If user is not admin, only show tasks assigned to them (fallback logic)
  const filterByRole = (taskList) => {
    if (isAdmin) return taskList;
    return taskList.filter(t => String(t.assignedTo) === String(user?._id));
  };

  const prodCol = filterByRole(productionTasks);
  const qaCol = filterByRole(qaTasks);
  const qcCol = filterByRole(qcTasks);
  const delivCol = filterByRole(deliveryTasks);

  return (
    <div className="dashboard">
      <div className="flex justify-between items-center" style={{ marginTop: '2rem' }}>
        <h2>Task Board {(!isAdmin) && '(Assigned to You)'}</h2>

      </div>

      {/* Debug Info for missing tasks */}
      {(!isAdmin && user) && (
        <div style={{ padding: '1rem', backgroundColor: '#333', color: '#fff', marginBottom: '1rem', borderRadius: '4px', fontSize: '0.8rem' }}>
          <strong>Debug Info:</strong><br />
          User ID: {user._id}<br />
          Total Tasks from API: {tasks.length}<br />
          Tasks Assigned to You: {tasks.filter(t => String(t.assignedTo) === String(user._id)).length}<br />
          Tasks Assigned to Anyone: {tasks.filter(t => t.assignedTo).length}<br />
          Sample Task AssignedTo Field: {tasks.find(t => t.assignedTo)?.assignedTo || 'None'}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleCreateTask} className="task-card" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--accent-primary)' }}>
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="Task Title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <textarea
              className="form-input"
              placeholder="Task Description"
              rows="2"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
            ></textarea>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-primary" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create Task</button>
          </div>
        </form>
      )}

      <div className="board">
        <div className="column">
          <div className="column-header">
            <span style={{ color: 'var(--stage-production)' }}>●</span> Production
            <span className="badge" style={{ marginLeft: 'auto', backgroundColor: 'var(--bg-card)' }}>{prodCol.length}</span>
          </div>
          {prodCol.map(task => (
            <TaskCard key={task._id} task={task} onMoveTask={handleMoveTask} />
          ))}
          {prodCol.length === 0 && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No tasks</div>}
        </div>

        <div className="column">
          <div className="column-header">
            <span style={{ color: 'var(--stage-qc)' }}>●</span> Quality Control
            <span className="badge" style={{ marginLeft: 'auto', backgroundColor: 'var(--bg-card)' }}>{qcCol.length}</span>
          </div>
          {qcCol.map(task => (
            <TaskCard key={task._id} task={task} onMoveTask={handleMoveTask} />
          ))}
          {qcCol.length === 0 && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No tasks</div>}
        </div>

        <div className="column">
          <div className="column-header">
            <span style={{ color: 'var(--stage-qa)' }}>●</span> Quality Assurance
            <span className="badge" style={{ marginLeft: 'auto', backgroundColor: 'var(--bg-card)' }}>{qaCol.length}</span>
          </div>
          {qaCol.map(task => (
            <TaskCard key={task._id} task={task} onMoveTask={handleMoveTask} />
          ))}
          {qaCol.length === 0 && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No tasks</div>}
        </div>

        <div className="column">
          <div className="column-header">
            <span style={{ color: 'var(--stage-delivery)' }}>●</span> Delivery
            <span className="badge" style={{ marginLeft: 'auto', backgroundColor: 'var(--bg-card)' }}>{delivCol.length}</span>
          </div>
          {delivCol.map(task => (
            <TaskCard key={task._id} task={task} onMoveTask={handleMoveTask} />
          ))}
          {delivCol.length === 0 && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No tasks</div>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
