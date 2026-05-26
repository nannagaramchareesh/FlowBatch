import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Users as UsersIcon, Plus, Loader, Shield, Edit2, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const API_USERS = '/api/auth/users';
const API_REGISTER = '/api/auth/register';

const Users = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  
  // New user form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roles: ['production']
  });

  const availableRoles = [
    { id: 'admin', label: 'Admin', color: '#ef4444' },
    { id: 'production', label: 'Production', color: '#3b82f6' },
    { id: 'qa', label: 'QA', color: '#8b5cf6' },
    { id: 'qc', label: 'QC', color: '#f59e0b' },
    { id: 'delivery', label: 'Delivery', color: '#10b981' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API_USERS);
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Error fetching users');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRoleToggle = (roleId) => {
    const currentRoles = [...formData.roles];
    if (currentRoles.includes(roleId)) {
      setFormData({ ...formData, roles: currentRoles.filter(r => r !== roleId) });
    } else {
      setFormData({ ...formData, roles: [...currentRoles, roleId] });
    }
  };

  const handleEditClick = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '', // Blank by default, optional on edit
      roles: (u.roles && u.roles.length > 0) ? u.roles : (u.role ? [u.role] : ['production'])
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', roles: ['production'] });
  };

  const handleDelete = async (u) => {
    if (currentUser && currentUser._id === u._id) {
      setError('You cannot delete your own account');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${u.name}"?`)) {
      try {
        await axios.delete(`${API_USERS}/${u._id}`);
        fetchUsers();
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Error deleting user');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.roles.length === 0) {
      setError('At least one role must be selected');
      return;
    }

    try {
      if (editingUser) {
        // Edit mode
        const payload = {
          name: formData.name,
          email: formData.email,
          roles: formData.roles
        };
        // Only include password if it's set
        if (formData.password) {
          payload.password = formData.password;
        }
        await axios.put(`${API_USERS}/${editingUser._id}`, payload);
      } else {
        // Create mode
        if (!formData.password) {
          setError('Password is required when creating a user');
          return;
        }
        await axios.post(API_USERS, formData);
      }
      
      handleCancel();
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || `Error ${editingUser ? 'updating' : 'creating'} user`);
    }
  };

  if (loading) {
    return <div className="container flex items-center justify-center" style={{ height: '80vh' }}><Loader className="animate-spin text-indigo-500" size={48} /></div>;
  }

  return (
    <div style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h2 className="flex items-center gap-2"><UsersIcon /> Team Management</h2>
        <button className="btn-primary flex items-center gap-2" onClick={() => { editingUser ? handleCancel() : setShowAddForm(!showAddForm); }}>
          <Plus size={18} /> Add User
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit} className="task-card" style={{ marginBottom: '2rem', borderTop: '4px solid var(--accent-primary)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>{editingUser ? `Edit User: ${editingUser.name}` : 'Create New User'}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <input type="text" name="name" className="form-input" required value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input type="email" name="email" className="form-input" required value={formData.email} onChange={handleInputChange} />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">{editingUser ? 'New Password (leave blank to keep current)' : 'Temporary Password'}</label>
            <input type="password" name="password" className="form-input" required={!editingUser} value={formData.password} onChange={handleInputChange} style={{ maxWidth: '400px' }} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '1rem' }}>Assign Roles (can select multiple)</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {availableRoles.filter(role => role.id !== 'admin' && role.id !== 'delivery').map(role => (
                <div 
                  key={role.id} 
                  onClick={() => handleRoleToggle(role.id)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',
                    border: `1px solid ${formData.roles.includes(role.id) ? role.color : 'var(--border-color)'}`,
                    backgroundColor: formData.roles.includes(role.id) ? `${role.color}15` : 'var(--bg-secondary)',
                    color: formData.roles.includes(role.id) ? role.color : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                >
                  <Shield size={16} />
                  {role.label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn-primary" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={handleCancel}>Cancel</button>
            <button type="submit" className="btn-primary">{editingUser ? 'Update User' : 'Create User'}</button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email Address</th>
              <th>Assigned Roles</th>
              <th>Joined Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u => {
              const roles = (u.roles && u.roles.length > 0) ? u.roles : (u.role ? [u.role] : []);
              return !roles.includes('admin');
            }).map(u => (
              <tr key={u._id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  {u.name}
                  {currentUser && currentUser._id === u._id && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginLeft: '0.5rem', fontStyle: 'italic' }}>(You)</span>
                  )}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {((u.roles && u.roles.length > 0) ? u.roles : (u.role ? [u.role] : [])).map(roleId => {
                      const roleDef = availableRoles.find(r => r.id === roleId);
                      return (
                        <span 
                          key={roleId}
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: roleDef ? `${roleDef.color}20` : 'var(--bg-secondary)',
                            color: roleDef ? roleDef.color : 'var(--text-secondary)'
                          }}
                        >
                          {roleDef ? roleDef.label : roleId}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleEditClick(u)}
                      className="btn-primary" 
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', backgroundColor: 'var(--stage-qc)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      title="Edit User"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(u)}
                      className="btn-primary" 
                      style={{ 
                        padding: '0.4rem 0.6rem', 
                        fontSize: '0.75rem', 
                        backgroundColor: '#ef4444', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        opacity: currentUser && currentUser._id === u._id ? 0.5 : 1,
                        cursor: currentUser && currentUser._id === u._id ? 'not-allowed' : 'pointer'
                      }}
                      disabled={currentUser && currentUser._id === u._id}
                      title="Delete User"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
