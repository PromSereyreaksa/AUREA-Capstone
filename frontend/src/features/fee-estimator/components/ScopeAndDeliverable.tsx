import React, { useState } from 'react';
import type { DeliverableItem } from '../types';

interface ScopeAndDeliverableProps {
  deliverables: DeliverableItem[];
  onUpdate: (deliverables: DeliverableItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// Predefined deliverable types with icons
const deliverableTypes = [
  {
    type: 'Logo Design',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    )
  },
  {
    type: 'Poster',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/>
      </svg>
    )
  },
  {
    type: 'Brand Guidelines',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
    )
  },
  {
    type: 'Website Mockup',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    )
  },
  {
    type: 'App Screen',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    )
  }
];

export const ScopeAndDeliverable: React.FC<ScopeAndDeliverableProps> = ({
  deliverables,
  onUpdate,
  onNext,
  onBack
}) => {
  const [newItemName, setNewItemName] = useState('');

  // Initialize deliverables if empty with default values from design
  React.useEffect(() => {
    if (deliverables.length === 0) {
      const defaultDeliverables: DeliverableItem[] = [
        { id: 'logo-design', type: 'Logo Design', quantity: 2 },
        { id: 'poster', type: 'Poster', quantity: 1 },
        { id: 'brand-guidelines', type: 'Brand Guidelines', quantity: 1 },
        { id: 'website-mockup', type: 'Website Mockup', quantity: 1 },
        { id: 'app-screen', type: 'App Screen', quantity: 1 }
      ];
      onUpdate(defaultDeliverables);
    }
  }, [deliverables.length, onUpdate]);

  const updateDeliverableQuantity = (id: string, quantity: number) => {
    const updated = deliverables.map(item => 
      item.id === id ? { ...item, quantity } : item
    );
    onUpdate(updated);
  };

  const removeDeliverable = (id: string) => {
    const updated = deliverables.filter(item => item.id !== id);
    onUpdate(updated);
  };

  const addCustomDeliverable = () => {
    if (newItemName.trim()) {
      const newItem: DeliverableItem = {
        id: `custom-${Date.now()}`,
        type: newItemName.trim(),
        quantity: 1,
        isCustom: true
      };
      onUpdate([...deliverables, newItem]);
      setNewItemName('');
    }
  };

  const getDeliverableIcon = (type: string) => {
    const predefined = deliverableTypes.find(t => t.type === type);
    return predefined?.icon || (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    );
  };

  const canProceed = deliverables.length > 0 && deliverables.some(item => item.quantity > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="fee-estimator-header">
        <h1 className="fee-estimator-title">Project Based Estimator</h1>
      </div>

      <div className="fee-estimator-body">
      <div className="form-section">
        <h2 className="form-section-title">Scope and Deliverable</h2>
        <p style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '1.5rem' }}>
          Project Deliverable
        </p>

        {/* Deliverable Items */}
        <div style={{ marginBottom: '2rem' }}>
          {deliverables.map((item) => (
            <div key={item.id} className="deliverable-item">
              <div className="deliverable-icon">
                {getDeliverableIcon(item.type)}
              </div>
              
              <div className="deliverable-content">
                <h4 className="deliverable-name">{item.type}</h4>
                
                {/* Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', minWidth: '1rem' }}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={item.quantity}
                    onChange={(e) => updateDeliverableQuantity(item.id, parseInt(e.target.value))}
                    className="deliverable-slider"
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', minWidth: '2rem' }}>10+</span>
                  
                  {/* Quantity Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={item.quantity}
                      onChange={(e) => updateDeliverableQuantity(item.id, parseInt(e.target.value) || 0)}
                      className="quantity-input"
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#666666', textTransform: 'uppercase' }}>
                      Quantity
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Remove button for custom items */}
              {item.isCustom && (
                <button
                  onClick={() => removeDeliverable(item.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FF4444',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    padding: '0.5rem'
                  }}
                  title="Remove item"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Item Button */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Enter custom deliverable name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="form-input"
              style={{ flex: 1 }}
              onKeyPress={(e) => e.key === 'Enter' && addCustomDeliverable()}
            />
            <button
              onClick={addCustomDeliverable}
              className="btn btn-primary"
              disabled={!newItemName.trim()}
              style={{ whiteSpace: 'nowrap' }}
            >
              Add Item
            </button>
          </div>
          
          <button className="add-item-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Add Item
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="button-container">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button 
          className={`btn btn-primary ${!canProceed ? 'disabled' : ''}`}
          onClick={onNext}
          disabled={!canProceed}
        >
          Next
        </button>
      </div>
      </div>
    </div>
  );
};