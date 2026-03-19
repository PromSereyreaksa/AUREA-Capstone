import React, { useState, useRef } from 'react';
import type { DeliverableItem, ProjectInformation as ProjectInfoType, TimeComplexity } from '../shared/types';
import { useAuth } from '../../auth/context/AuthContext';
import { pricingClient } from '../../../shared/api/pricingClient';

interface ProjectInformationProps {
  projectInfo: ProjectInfoType;
  onUpdate: (projectInfo: Partial<ProjectInfoType>) => void;
  onApplyExtraction: (
    extractedProjectInfo: Partial<ProjectInfoType>,
    extractedDeliverables: DeliverableItem[],
    extractedTimeComplexity: Partial<TimeComplexity>
  ) => void;
  onNext: () => void;
  onBack: () => void;
}

// Upload Icon
const UploadIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="12" y1="18" x2="12" y2="12"/>
    <polyline points="9,15 12,12 15,15"/>
  </svg>
);

export const ProjectInformation: React.FC<ProjectInformationProps> = ({
  projectInfo,
  onUpdate,
  onApplyExtraction,
  onNext,
  onBack
}) => {
  const { user } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileUpload(pdfFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user?.user_id) {
      setUploadError('You must be logged in to extract project data from PDF.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    try {
      const extraction = await pricingClient.extractProjectFromPdf(file, user.user_id);
      const extractedProject = extraction.data.project;
      const extractedDeliverables: DeliverableItem[] = (extraction.data.deliverables || []).map((item, index) => ({
        id: `extracted-${item.deliverable_id || index}`,
        type: item.deliverable_type,
        quantity: item.quantity,
      }));

      const difficultyRaw = (extractedProject.difficulty || '').toLowerCase().trim();
      const mappedDifficulty: TimeComplexity['difficulty'] =
        difficultyRaw === 'easy' || difficultyRaw === 'medium' || difficultyRaw === 'hard' || difficultyRaw === 'complex'
          ? difficultyRaw
          : null;

      const licensingRaw = (extractedProject.licensing || '').toLowerCase().trim();
      let mappedProjectLicensing: TimeComplexity['licensing']['projectLicensing'] = 'one-time';
      if (licensingRaw.includes('exclusive')) {
        mappedProjectLicensing = 'exclusive';
      } else if (licensingRaw.includes('limited') || licensingRaw.includes('multi')) {
        mappedProjectLicensing = 'limited';
      }

      const context = extraction.data.clientContext || {};
      const mappedClientType =
        context.client_type === 'startup' ||
        context.client_type === 'sme' ||
        context.client_type === 'corporate' ||
        context.client_type === 'ngo' ||
        context.client_type === 'government'
          ? context.client_type
          : null;
      const mappedClientRegion =
        context.client_region === 'cambodia' ||
        context.client_region === 'southeast_asia' ||
        context.client_region === 'global'
          ? context.client_region
          : null;

      const difficultyMultiplier =
        mappedDifficulty === 'complex' ? 2.5 :
        mappedDifficulty === 'hard' ? 2 :
        mappedDifficulty === 'medium' ? 1.5 : 1;

      onApplyExtraction(
        {
          uploadMethod: 'pdf',
          pdfFile: file,
          name: extractedProject.project_name || extractedProject.title || '',
          description: extractedProject.description || '',
        },
        extractedDeliverables,
        {
          duration: extractedProject.duration || 0,
          difficulty: mappedDifficulty,
          difficultyMultiplier,
          client_type: mappedClientType,
          client_region: mappedClientRegion,
          licensing: {
            commercialRights: 'personal',
            projectLicensing: mappedProjectLicensing,
          },
        }
      );
    } catch (error) {
      console.error('File upload failed:', error);
      setUploadError(error instanceof Error ? error.message : 'PDF extraction failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleManualInput = () => {
    onUpdate({ uploadMethod: 'manual' });
  };

  const handleInputChange = (field: keyof ProjectInfoType, value: string) => {
    onUpdate({ [field]: value });
  };

  const canProceed = projectInfo.name.trim() !== '' && projectInfo.description.trim() !== '';

  return (
    <div className="estimator-shell">
      <div className="fee-estimator-header">
        <h1 className="fee-estimator-title">Project Based Estimator</h1>
      </div>

      <div className="fee-estimator-body">
        {/* Upload Method Selection */}
        {!projectInfo.uploadMethod && (
        <div className="form-section nb-cut-in-up">
          <h2 className="form-section-title">How would you like to provide project information?</h2>
          
          {/* PDF Upload Option */}
          <div
            className={`upload-dropzone ${isDragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClickUpload}
          >
            <UploadIcon />
            <p className="upload-text">
              {isUploading ? 'Processing...' : 'Drag your files and drop it here'}
            </p>
            <p className="upload-subtext">or Choose your files</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <p className="estimator-microcopy estimator-upload-note">
            Drag and Drop your pdf project description here and let our AI extraction fill up the form for you or{' '}
            <button
              type="button"
              className="estimator-link-action"
              onClick={handleManualInput}
            >
              scroll down and fill up the form manually
            </button>
          </p>
        </div>
      )}

      {/* Project Information Form */}
      <div className="form-section nb-cut-in-up">
        <h2 className="form-section-title">Project Information</h2>
        {uploadError && (
          <div className="estimator-alert estimator-alert-error" style={{ marginBottom: '1rem' }}>
            {uploadError}
          </div>
        )}
        
        <div className="form-group estimator-panel estimator-panel-muted">
          <label htmlFor="projectName" className="form-label">Project Name</label>
          <input
            type="text"
            id="projectName"
            className="form-input"
            value={projectInfo.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter project name"
          />
        </div>

        <div className="form-group estimator-panel">
          <label htmlFor="projectDescription" className="form-label">Project Description</label>
          <textarea
            id="projectDescription"
            className="form-textarea"
            value={projectInfo.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your project in detail..."
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="button-container">
        <button className="btn btn-secondary nb-pressable" onClick={onBack}>
          Back
        </button>
        <button 
          className={`btn btn-primary nb-pressable ${!canProceed ? 'disabled' : ''}`}
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
