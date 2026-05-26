import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { User as UserIcon, Lock, Save, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_PROFILE = '/api/auth/profile';

const Profile = () => {
  const { user, updateUserSession } = useContext(AuthContext); // Use to update global user state and token
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    if (formData.newPassword && !formData.oldPassword) {
      setErrorMsg('Please enter your current password to set a new one');
      return;
    }

    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const payload = {
        name: formData.name,
        email: formData.email,
        ...(formData.newPassword && {
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        })
      };

      const res = await axios.put(API_PROFILE, payload, config);
      
      // Update global auth context safely
      updateUserSession(res.data);
      
      setSuccessMsg('Profile updated successfully!');
      setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error updating profile');
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ marginTop: '2rem', paddingBottom: '3rem', maxWidth: '600px', margin: '2rem auto' }}>
      <div className="flex-header" style={{ marginBottom: '2rem' }}>
        <h2 className="flex items-center gap-2"><UserIcon className="text-accent-primary" /> Account Settings</h2>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #10b981' }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #ef4444' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="task-card" style={{ padding: '2rem' }}>
        
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserIcon size={18} /> Basic Info
        </h3>
        
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            name="name" 
            className="form-input" 
            value={formData.name} 
            onChange={handleChange} 
            required 
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label">Email Address (Username)</label>
          <input 
            type="email" 
            name="email" 
            className="form-input" 
            value={formData.email} 
            onChange={handleChange} 
            required 
          />
        </div>

        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={18} /> Change Password (Optional)
        </h3>

        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input 
            type="password" 
            name="oldPassword" 
            className="form-input" 
            value={formData.oldPassword} 
            onChange={handleChange} 
            placeholder="Leave blank if not changing"
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input 
              type="password" 
              name="newPassword" 
              className="form-input" 
              value={formData.newPassword} 
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input 
              type="password" 
              name="confirmPassword" 
              className="form-input" 
              value={formData.confirmPassword} 
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
            {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
