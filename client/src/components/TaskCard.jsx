import React from 'react';
import { MoreVertical, Clock, CheckCircle } from 'lucide-react';

const TaskCard = ({ task, onMoveTask }) => {
  const getBadgeClass = (stage) => {
    switch (stage) {
      case 'Production': return 'badge production';
      case 'QA': return 'badge qa';
      case 'QC': return 'badge qc';
      case 'Delivery': return 'badge delivery';
      default: return 'badge';
    }
  };

  const currentStage = task.currentStage || task.stage || 'Production';
  const stageClass = currentStage.toLowerCase();

  return (
    <div className={`task-card ${stageClass}`}>
      <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
        <span className={getBadgeClass(currentStage)}>{currentStage}</span>
        <button className="icon-btn">
          <MoreVertical size={16} />
        </button>
      </div>
      
      <h3 className="task-title">{task.title || `Task #${task._id.substring(18)}`}</h3>
      {task.description ? (
        <p className="task-desc">{task.description}</p>
      ) : task.documentName || task.receivedFrom ? (
        <div className="task-desc flex-col" style={{ gap: '0.25rem', marginTop: '0.5rem' }}>
          {task.documentName && <div><strong>Doc:</strong> {task.documentName}</div>}
          {task.receivedFrom && <div><strong>From:</strong> {task.receivedFrom}</div>}
        </div>
      ) : (
        <p className="task-desc" style={{ fontStyle: 'italic', opacity: 0.5 }}>No description</p>
      )}
      
      <div className="task-footer">
        <div className="flex items-center" style={{ gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
          <Clock size={14} />
          <span>{new Date(task.createdAt || Date.now()).toLocaleDateString()}</span>
        </div>
        
        <div className="task-actions">
          {currentStage === 'Delivery' && (
            <span style={{ color: 'var(--stage-delivery)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle size={16} /> Done
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
