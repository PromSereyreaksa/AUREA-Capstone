import React, { useState } from 'react';
import type { ProjectInformation, DeliverableItem, TimeComplexity } from '../shared/types';
import { PricingClient } from '../../../shared/api/pricingClient';
import type { ProjectRateResponse } from '../../../shared/api/pricingClient';

interface ProjectSummaryProps {
  projectInfo: ProjectInformation;
  deliverables: DeliverableItem[];
  timeComplexity: TimeComplexity;
  userId: number;
  onEdit: (step: number) => void;
  onComplete: () => void;
}

const pricingClient = new PricingClient();

const LICENSING_MULTIPLIERS: Record<string, number> = {
  'one-time': 1.0,
  'limited': 1.2,
  'exclusive': 1.5,
};

export const ProjectSummary: React.FC<ProjectSummaryProps> = ({
  projectInfo,
  deliverables,
  timeComplexity,
  userId,
  onEdit,
  onComplete
}) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProjectRateResponse['data'] | null>(null);

  const handleCalculate = async () => {
    if (!timeComplexity.client_type || !timeComplexity.client_region) {
      setError('Please go back and set the client type and region.');
      return;
    }
    setIsCalculating(true);
    setError(null);
    try {
      const response = await pricingClient.calculateProjectRate({
        user_id: userId,
        client_type: timeComplexity.client_type,
        client_region: timeComplexity.client_region,
      });
      setResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const licensingMultiplier = LICENSING_MULTIPLIERS[timeComplexity.licensing.projectLicensing] ?? 1.0;
  const totalProjectPrice = result
    ? Math.round(result.project_rate * timeComplexity.duration * timeComplexity.difficultyMultiplier * licensingMultiplier)
    : null;
  const formatDifficulty = (difficulty: string | null) => {
    if (!difficulty) return 'Not specified';
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const formatCommercialRights = (rights: string) => {
    switch (rights) {
      case 'personal': return 'Personal Use';
      case 'small-business': return 'Small Business';
      case 'large-corporation': return 'Large Corporation';
      case 'full-commercial': return 'Full Commercial Right';
      case 'other': return 'Other';
      default: return rights;
    }
  };

  const formatProjectLicensing = (licensing: string) => {
    switch (licensing) {
      case 'one-time': return 'One-Time Used';
      case 'limited': return 'Limited Used';
      case 'exclusive': return 'Exclusive License';
      default: return licensing;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="fee-estimator-header">
        <h1 className="fee-estimator-title">Project Based Estimator</h1>
      </div>

      <div className="fee-estimator-body">
      <div className="form-section">
        <h2 className="form-section-title">Project Summary</h2>

        {/* Project Information */}
        <div style={{ 
          background: 'white', 
          border: '2px solid #000000', 
          borderRadius: '0.75rem', 
          padding: '1.5rem', 
          marginBottom: '1.5rem',
          boxShadow: '2px 2px 0 rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h3 style={{ 
              color: '#000000', 
              fontSize: '1rem', 
              fontWeight: '700', 
              margin: 0, 
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Project Name:
            </h3>
            <button 
              onClick={() => onEdit(2)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FB8500',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                textDecoration: 'underline'
              }}
            >
              Edit
            </button>
          </div>
          <p style={{ color: '#000000', margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
            {projectInfo.name}
          </p>
          
          <h4 style={{ 
            color: '#000000', 
            fontSize: '0.875rem', 
            fontWeight: '700', 
            margin: '0 0 0.5rem 0',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}>
            Project Description:
          </h4>
          <p style={{ color: '#666666', margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
            {projectInfo.description}
          </p>
        </div>

        {/* Scope and Deliverable */}
        <div style={{ 
          background: 'white', 
          border: '2px solid #000000', 
          borderRadius: '0.75rem', 
          padding: '1.5rem', 
          marginBottom: '1.5rem',
          boxShadow: '2px 2px 0 rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ 
              color: '#FB8500', 
              fontSize: '1rem', 
              fontWeight: '700', 
              margin: 0, 
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Scope and Deliverable
            </h3>
            <button 
              onClick={() => onEdit(3)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FB8500',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                textDecoration: 'underline'
              }}
            >
              Edit
            </button>
          </div>
          
          <div style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '1rem' }}>
            Project Deliverable
          </div>
          
          {deliverables.filter(item => item.quantity > 0).map((item, index) => (
            <div key={item.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.5rem 0',
              borderBottom: index < deliverables.filter(d => d.quantity > 0).length - 1 ? '1px solid #E5E5E5' : 'none'
            }}>
              <span style={{ color: '#000000', fontWeight: '600' }}>
                {item.type}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#000000', fontWeight: '600' }}>{item.quantity}</span>
                <span style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Quantity
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Time and Complexity */}
        <div style={{ 
          background: 'white', 
          border: '2px solid #000000', 
          borderRadius: '0.75rem', 
          padding: '1.5rem', 
          marginBottom: '1.5rem',
          boxShadow: '2px 2px 0 rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ 
              color: '#FB8500', 
              fontSize: '1rem', 
              fontWeight: '700', 
              margin: 0, 
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Time and Complexity
            </h3>
            <button 
              onClick={() => onEdit(4)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FB8500',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                textDecoration: 'underline'
              }}
            >
              Edit
            </button>
          </div>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#000000', fontWeight: '600' }}>
                Project Duration Estimation
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#000000', fontWeight: '600' }}>{timeComplexity.duration}</span>
                <span style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Hours
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#000000', fontWeight: '600' }}>
                Project Difficulty
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#000000', fontWeight: '600' }}>
                  {formatDifficulty(timeComplexity.difficulty)}
                </span>
                <span style={{ color: '#666666', fontSize: '0.75rem' }}>
                  Multiplier: 
                </span>
                <div style={{
                  padding: '0.125rem 0.5rem',
                  background: '#FFE8DC',
                  border: '1px solid #FB8500',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#FB8500'
                }}>
                  x{timeComplexity.difficultyMultiplier}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#000000', fontWeight: '600' }}>Client Type</span>
              <span style={{ color: '#000000', fontWeight: '600' }}>
                {timeComplexity.client_type
                  ? { startup: 'Startup', sme: 'SME', corporate: 'Corporate', ngo: 'NGO / Non-Profit', government: 'Government' }[timeComplexity.client_type]
                  : 'Not specified'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#000000', fontWeight: '600' }}>Client Region</span>
              <span style={{ color: '#000000', fontWeight: '600' }}>
                {timeComplexity.client_region
                  ? { cambodia: 'Cambodia', southeast_asia: 'Southeast Asia', global: 'Global' }[timeComplexity.client_region]
                  : 'Not specified'}
              </span>
            </div>
          </div>
        </div>

        {/* License and Rights */}
        <div style={{ 
          background: 'white', 
          border: '2px solid #000000', 
          borderRadius: '0.75rem', 
          padding: '1.5rem', 
          marginBottom: '2rem',
          boxShadow: '2px 2px 0 rgba(0, 0, 0, 0.2)'
        }}>
          <h3 style={{ 
            color: '#FB8500', 
            fontSize: '1rem', 
            fontWeight: '700', 
            margin: '0 0 1rem 0', 
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            License and Rights
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#000000', fontWeight: '600' }}>
                Commercial Usage Rights
              </span>
              <div style={{
                padding: '0.25rem 0.75rem',
                background: '#FFE8DC',
                border: '2px solid #000000',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#000000',
                textTransform: 'uppercase'
              }}>
                {formatCommercialRights(timeComplexity.licensing.commercialRights)}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#000000', fontWeight: '600' }}>
                Project Licensing
              </span>
              <div style={{
                padding: '0.25rem 0.75rem',
                background: '#FFE8DC',
                border: '2px solid #000000',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#000000',
                textTransform: 'uppercase'
              }}>
                {formatProjectLicensing(timeComplexity.licensing.projectLicensing)}
              </div>
            </div>
            
            {timeComplexity.licensing.customLicensing && (
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ color: '#666666', fontSize: '0.875rem' }}>
                  Custom Licensing: {timeComplexity.licensing.customLicensing}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '2px solid #EF4444',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ color: '#DC2626', margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>{error}</p>
          </div>
        )}

        {/* Calculation Result */}
        {result && (
          <div style={{
            background: '#F0FDF4',
            border: '2px solid #000000',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '2px 2px 0 rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{
              color: '#16A34A',
              fontSize: '1rem',
              fontWeight: '700',
              margin: '0 0 1rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Estimated Project Cost
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#000000', fontWeight: '600' }}>Adjusted Hourly Rate</span>
                <span style={{ color: '#16A34A', fontWeight: '700', fontSize: '1.125rem' }}>
                  ${result.project_rate.toFixed(2)}/hr
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666666', fontSize: '0.875rem' }}>Base Hourly Rate</span>
                <span style={{ color: '#666666', fontWeight: '600' }}>${result.base_rate.toFixed(2)}/hr</span>
              </div>
              {result.adjustments && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666666', fontSize: '0.875rem' }}>Client Type Multiplier</span>
                    <span style={{ color: '#666666', fontSize: '0.875rem' }}>×{result.adjustments.client_type_multiplier}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666666', fontSize: '0.875rem' }}>Region Multiplier</span>
                    <span style={{ color: '#666666', fontSize: '0.875rem' }}>×{result.adjustments.region_multiplier}</span>
                  </div>
                </>
              )}
              <div style={{ height: '1px', background: '#D1D5DB', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#000000', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.875rem' }}>
                  Total Project Estimate
                </span>
                <span style={{ color: '#FB8500', fontWeight: '800', fontSize: '1.5rem' }}>
                  ${totalProjectPrice?.toLocaleString()}
                </span>
              </div>
              {result.recommended_price_range && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666666', fontSize: '0.875rem' }}>Market Rate Range</span>
                  <span style={{ color: '#666666', fontSize: '0.875rem' }}>
                    ${result.recommended_price_range.min.toFixed(0)} – ${result.recommended_price_range.max.toFixed(0)}/hr
                  </span>
                </div>
              )}
              {result.market_position && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666666', fontSize: '0.875rem' }}>Market Position</span>
                  <div style={{
                    padding: '0.125rem 0.5rem',
                    background: '#FFE8DC',
                    border: '1px solid #FB8500',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#FB8500'
                  }}>
                    {result.market_position}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="button-container">
        <button className="btn btn-secondary" onClick={() => onEdit(4)}>
          Back
        </button>
        {result ? (
          <button className="btn btn-primary" onClick={onComplete}>
            Done
          </button>
        ) : (
          <button
            className={`btn btn-primary ${isCalculating ? 'disabled' : ''}`}
            onClick={handleCalculate}
            disabled={isCalculating}
          >
            {isCalculating ? 'Calculating...' : 'Calculate'}
          </button>
        )}
      </div>
      </div>
    </div>
  );
};