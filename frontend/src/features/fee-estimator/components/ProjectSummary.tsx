import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  ProjectInformation,
  DeliverableItem,
  TimeComplexity,
} from '../shared/types';
import { PricingClient } from '../../../shared/api/pricingClient';
import type { ProjectRateResponse } from '../../../shared/api/pricingClient';
import { InvoiceModal, invoiceService } from '../../invoice';

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
  limited: 1.2,
  exclusive: 1.5,
};

const USAGE_RIGHTS_LABELS: Record<string, string> = {
  personal: 'Personal Use',
  'small-business': 'Small Business',
  'large-corporation': 'Large Corporation',
  'full-commercial': 'Full Commercial Right',
  other: 'Other',
};

export const ProjectSummary: React.FC<ProjectSummaryProps> = ({
  projectInfo,
  deliverables,
  timeComplexity,
  userId,
  onEdit,
  onComplete,
}) => {
  const navigate = useNavigate();
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProjectRateResponse['data'] | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientLocation, setClientLocation] = useState('');
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const validDeliverables = deliverables.filter((item) => item.quantity > 0);

  const handleCalculate = async () => {
    if (!timeComplexity.client_type || !timeComplexity.client_region) {
      setError('Please go back and set the client type and region.');
      return;
    }

    if (validDeliverables.length === 0) {
      setError('Please add at least one deliverable with quantity above 0.');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      let currentProjectId = projectId;

      if (!currentProjectId) {
        const created = await pricingClient.createManualProject({
          user_id: userId,
          project_name: projectInfo.name,
          title: projectInfo.name,
          description: projectInfo.description,
          duration: timeComplexity.duration,
          difficulty: timeComplexity.difficulty || undefined,
          licensing: timeComplexity.licensing.projectLicensing,
          usage_rights:
            USAGE_RIGHTS_LABELS[timeComplexity.licensing.commercialRights] ||
            'Personal Use',
          deliverables: validDeliverables.map((item) => ({
            deliverable_type: item.type,
            quantity: item.quantity,
            items: [],
          })),
        });

        currentProjectId = created.data.project.project_id;
        setProjectId(currentProjectId);
      }

      const response = await pricingClient.calculateProjectRate({
        user_id: userId,
        project_id: currentProjectId,
        client_type: timeComplexity.client_type,
        client_region: timeComplexity.client_region,
      });

      setResult(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Calculation failed. Please try again.',
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const getAdjustedHourlyRate = (): number | null => {
    if (!result) return null;

    const withLegacy = result as ProjectRateResponse['data'] & {
      project_rate?: number;
      final_hourly_rate?: number;
    };

    if (typeof withLegacy.project_rate === 'number') {
      return withLegacy.project_rate;
    }

    if (typeof withLegacy.final_hourly_rate === 'number') {
      return withLegacy.final_hourly_rate;
    }

    return null;
  };

  const handleGenerateInvoice = async () => {
    if (!projectId) {
      setInvoiceError('Project not saved yet. Please calculate first.');
      return;
    }

    if (!clientName.trim() || !clientEmail.trim() || !clientLocation.trim()) {
      setInvoiceError('Client name, email, and address are required.');
      return;
    }

    setIsGeneratingInvoice(true);
    setInvoiceError(null);

    try {
      const invoice = await invoiceService.createOrGetProjectInvoice(projectId, {
        clientName,
        clientEmail,
        clientLocation,
      });

      // Download is non-critical: the browser may already have started it even if
      // the JS blob step throws. Never let a download error block navigation.
      try {
        await invoiceService.downloadInvoicePdf(
          invoice.invoice_id,
          invoice.invoice_number,
        );
      } catch {
        // swallow — browser has already initiated the download
      }

      setShowInvoiceModal(false);
      navigate('/dashboard');
    } catch (err) {
      setInvoiceError(
        err instanceof Error ? err.message : 'Failed to generate invoice',
      );
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const licensingMultiplier =
    LICENSING_MULTIPLIERS[timeComplexity.licensing.projectLicensing] ?? 1.0;
  const adjustedHourlyRate = getAdjustedHourlyRate();
  const totalProjectPrice = result
    ? Math.round(
        (adjustedHourlyRate || 0) *
          timeComplexity.duration *
          timeComplexity.difficultyMultiplier *
          licensingMultiplier,
      )
    : null;

  const formatDifficulty = (difficulty: string | null) => {
    if (!difficulty) return 'Not specified';
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const formatCommercialRights = (rights: string) => {
    switch (rights) {
      case 'personal':
        return 'Personal Use';
      case 'small-business':
        return 'Small Business';
      case 'large-corporation':
        return 'Large Corporation';
      case 'full-commercial':
        return 'Full Commercial Right';
      case 'other':
        return 'Other';
      default:
        return rights;
    }
  };

  const formatProjectLicensing = (licensing: string) => {
    switch (licensing) {
      case 'one-time':
        return 'One-Time Use';
      case 'limited':
        return 'Limited Use';
      case 'exclusive':
        return 'Exclusive License';
      default:
        return licensing;
    }
  };

  const clientTypeLabel = timeComplexity.client_type
    ? {
        startup: 'Startup',
        sme: 'SME',
        corporate: 'Corporate',
        ngo: 'NGO / Non-Profit',
        government: 'Government',
      }[timeComplexity.client_type]
    : 'Not specified';

  const clientRegionLabel = timeComplexity.client_region
    ? {
        cambodia: 'Cambodia',
        southeast_asia: 'Southeast Asia',
        global: 'Global',
      }[timeComplexity.client_region]
    : 'Not specified';

  return (
    <div className="estimator-shell">
      <div className="fee-estimator-header">
        <h1 className="fee-estimator-title">Project Based Estimator</h1>
      </div>

      <div className="fee-estimator-body">
        <div className="form-section nb-cut-in-up">
          <h2 className="form-section-title">Project Summary</h2>

          <div className="estimator-stack">
            <section className="estimator-panel">
              <div className="estimator-panel-header">
                <div>
                  <p className="estimator-eyebrow">Project Info</p>
                  <h3 className="estimator-kicker">{projectInfo.name}</h3>
                </div>
                <button
                  type="button"
                  className="estimator-edit-btn"
                  onClick={() => onEdit(2)}
                >
                  Edit
                </button>
              </div>
              <p className="estimator-body-copy">
                {projectInfo.description || 'No description added yet.'}
              </p>
            </section>

            <section className="estimator-panel estimator-panel-muted">
              <div className="estimator-panel-header">
                <div>
                  <p className="estimator-eyebrow">Scope</p>
                  <h3 className="estimator-kicker">Deliverables</h3>
                </div>
                <button
                  type="button"
                  className="estimator-edit-btn"
                  onClick={() => onEdit(3)}
                >
                  Edit
                </button>
              </div>
              <div className="estimator-stat-list">
                {validDeliverables.map((item) => (
                  <div key={item.id} className="estimator-stat-row">
                    <span>{item.type}</span>
                    <span className="estimator-badge">{item.quantity} pcs</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="estimator-grid-two">
              <section className="estimator-panel">
                <div className="estimator-panel-header">
                  <div>
                    <p className="estimator-eyebrow">Timing</p>
                    <h3 className="estimator-kicker">Complexity & Context</h3>
                  </div>
                  <button
                    type="button"
                    className="estimator-edit-btn"
                    onClick={() => onEdit(4)}
                  >
                    Edit
                  </button>
                </div>
                <div className="estimator-stat-list">
                  <div className="estimator-stat-row">
                    <span>Project Duration</span>
                    <strong>{timeComplexity.duration} hours</strong>
                  </div>
                  <div className="estimator-stat-row">
                    <span>Project Difficulty</span>
                    <strong>{formatDifficulty(timeComplexity.difficulty)}</strong>
                  </div>
                  <div className="estimator-stat-row">
                    <span>Difficulty Multiplier</span>
                    <strong>x{timeComplexity.difficultyMultiplier}</strong>
                  </div>
                  <div className="estimator-stat-row">
                    <span>Client Type</span>
                    <strong>{clientTypeLabel}</strong>
                  </div>
                  <div className="estimator-stat-row">
                    <span>Client Region</span>
                    <strong>{clientRegionLabel}</strong>
                  </div>
                </div>
              </section>

              <section className="estimator-panel estimator-panel-accent">
                <p className="estimator-eyebrow">Usage</p>
                <h3 className="estimator-kicker">License & Rights</h3>
                <div className="estimator-stat-list" style={{ marginTop: '1rem' }}>
                  <div className="estimator-stat-row">
                    <span>Commercial Rights</span>
                    <span className="estimator-badge">
                      {formatCommercialRights(
                        timeComplexity.licensing.commercialRights,
                      )}
                    </span>
                  </div>
                  <div className="estimator-stat-row">
                    <span>Project Licensing</span>
                    <span className="estimator-badge">
                      {formatProjectLicensing(
                        timeComplexity.licensing.projectLicensing,
                      )}
                    </span>
                  </div>
                  {timeComplexity.licensing.customLicensing && (
                    <div className="estimator-note-card">
                      <p className="estimator-eyebrow">Custom Terms</p>
                      <p className="estimator-body-copy">
                        {timeComplexity.licensing.customLicensing}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {error && (
              <div className="estimator-alert estimator-alert-error">{error}</div>
            )}

            {result && (
              <section className="estimator-panel estimator-panel-strong nb-sticker-slap">
                <div className="estimator-panel-header-wrap">
                  <div>
                    <p className="estimator-eyebrow">Calculated Result</p>
                    <h3 className="estimator-kicker">Estimated Project Cost</h3>
                  </div>
                  <span className="estimator-badge estimator-badge-ink">
                    Ready to invoice
                  </span>
                </div>

                <div
                  className="estimator-kpi-grid"
                  style={{ marginTop: '1rem', marginBottom: '1rem' }}
                >
                  <div className="estimator-kpi">
                    <p className="estimator-kpi-label">Adjusted Hourly Rate</p>
                    <p className="estimator-kpi-number">
                      ${adjustedHourlyRate?.toFixed(2) || '0.00'}/hr
                    </p>
                  </div>
                  <div className="estimator-kpi">
                    <p className="estimator-kpi-label">Base Hourly Rate</p>
                    <p className="estimator-kpi-number">
                      ${result.base_rate.toFixed(2)}/hr
                    </p>
                  </div>
                  <div className="estimator-kpi">
                    <p className="estimator-kpi-label">Licensing Factor</p>
                    <p className="estimator-kpi-number">x{licensingMultiplier}</p>
                  </div>
                </div>

                {(result as ProjectRateResponse['data'] & {
                  adjustments?: {
                    client_type_multiplier?: number;
                    region_multiplier?: number;
                  };
                  recommended_price_range?: {
                    min: number;
                    max: number;
                  };
                }).adjustments && (
                  <div className="estimator-stat-list" style={{ marginBottom: '1rem' }}>
                    <div className="estimator-stat-row estimator-stat-row-accent">
                      <span>Client Type Multiplier</span>
                      <strong>
                        x
                        {(
                          result as ProjectRateResponse['data'] & {
                            adjustments: { client_type_multiplier: number };
                          }
                        ).adjustments.client_type_multiplier}
                      </strong>
                    </div>
                    <div className="estimator-stat-row estimator-stat-row-accent">
                      <span>Region Multiplier</span>
                      <strong>
                        x
                        {(
                          result as ProjectRateResponse['data'] & {
                            adjustments: { region_multiplier: number };
                          }
                        ).adjustments.region_multiplier}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="estimator-summary-total">
                  <div>
                    <p className="estimator-eyebrow">Total Estimate</p>
                    <h4 className="estimator-kicker">
                      Final recommended project price
                    </h4>
                  </div>
                  <span className="estimator-value estimator-value-lg">
                    ${totalProjectPrice?.toLocaleString()}
                  </span>
                </div>

                {(
                  result as ProjectRateResponse['data'] & {
                    recommended_price_range?: { min: number; max: number };
                  }
                ).recommended_price_range && (
                  <p className="estimator-microcopy" style={{ marginTop: '1rem' }}>
                    Market rate range: $
                    {(
                      result as ProjectRateResponse['data'] & {
                        recommended_price_range: { min: number; max: number };
                      }
                    ).recommended_price_range.min.toFixed(0)}
                    {' '}to $
                    {(
                      result as ProjectRateResponse['data'] & {
                        recommended_price_range: { min: number; max: number };
                      }
                    ).recommended_price_range.max.toFixed(0)}
                    /hr
                  </p>
                )}

                {result.market_position && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <span className="estimator-badge">
                      Market Position: {result.market_position}
                    </span>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>

        <div className="button-container">
          <button
            className="btn btn-secondary nb-pressable"
            onClick={() => onEdit(4)}
          >
            Back
          </button>
          {result ? (
            <button
              className="btn btn-primary nb-pressable"
              onClick={() => setShowInvoiceModal(true)}
            >
              Generate Invoice
            </button>
          ) : (
            <button
              className={`btn btn-primary nb-pressable ${
                isCalculating ? 'disabled' : ''
              }`}
              onClick={handleCalculate}
              disabled={isCalculating}
            >
              {isCalculating ? 'Calculating...' : 'Calculate'}
            </button>
          )}
        </div>

        <InvoiceModal
          isOpen={showInvoiceModal}
          clientName={clientName}
          clientEmail={clientEmail}
          clientLocation={clientLocation}
          error={invoiceError}
          isSubmitting={isGeneratingInvoice}
          onClientNameChange={setClientName}
          onClientEmailChange={setClientEmail}
          onClientLocationChange={setClientLocation}
          onCancel={() => {
            setShowInvoiceModal(false);
            setInvoiceError(null);
          }}
          onSubmit={handleGenerateInvoice}
        />
      </div>
    </div>
  );
};
