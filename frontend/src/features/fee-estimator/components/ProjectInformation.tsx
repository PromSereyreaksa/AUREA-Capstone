import React, { useState, useRef } from 'react';
import type { ProjectInformation as ProjectInfoType } from '../types';

interface ProjectInformationProps {
  projectInfo: ProjectInfoType;
  onUpdate: (projectInfo: Partial<ProjectInfoType>) => void;
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
  onNext,
  onBack
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
    setIsUploading(true);
    
    try {
      // TODO: Integrate with backend PDF extraction API
      // For now, just store the file and set upload method
      onUpdate({
        uploadMethod: 'pdf',
        pdfFile: file
      });
      
      // Mock extraction - would be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extracted data - this would come from the backend
      onUpdate({
        name: 'Tech Start Up Branding',
        description: 'This project focuses on creating a complete brand identity for a technology startup. The scope includes brand research, visual identity development, and design execution to establish a strong and consistent brand presence. Key deliverables include logo design, color palette selection, brand guidelines, and business card. The branding will be designed to reflect innovation, professionalism, and scalability, targeting early adopters and potential investors.'
      });
      
    } catch (error) {
      console.error('File upload failed:', error);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="fee-estimator-header">
        <h1 className="fee-estimator-title">Project Based Estimator</h1>
      </div>

      <div className="fee-estimator-body">
        {/* Upload Method Selection */}
        {!projectInfo.uploadMethod && (
        <div className="form-section">
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

          <p style={{ textAlign: 'center', margin: '1rem 0', fontSize: '0.875rem', color: '#666666' }}>
            Drag and Drop your pdf project description here and let our AI extraction fill up the form for you or{' '}
            <span 
              style={{ color: '#FB8500', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={handleManualInput}
            >
              scroll down and fill up the form manually
            </span>
          </p>
        </div>
      )}

      {/* Project Information Form */}
      <div className="form-section">
        <h2 className="form-section-title">Project Information</h2>
        
        <div className="form-group">
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

        <div className="form-group">
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