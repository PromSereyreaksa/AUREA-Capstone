import { useState, useCallback } from 'react';
import type { FeeEstimatorState, ProjectInformation, DeliverableItem, TimeComplexity } from '../types';

const initialProjectInfo: ProjectInformation = {
  name: '',
  description: '',
  uploadMethod: null,
  pdfFile: undefined
};

const initialTimeComplexity: TimeComplexity = {
  duration: 0,
  difficulty: null,
  difficultyMultiplier: 1,
  licensing: {
    commercialRights: 'personal',
    projectLicensing: 'one-time',
    customLicensing: undefined
  }
};

const initialState: FeeEstimatorState = {
  mode: null,
  step: 1,
  projectInfo: initialProjectInfo,
  deliverables: [],
  timeComplexity: initialTimeComplexity,
  isAuthenticated: false,
  pdfExtracted: false
};

export const useFeeEstimator = () => {
  const [state, setState] = useState<FeeEstimatorState>(initialState);

  const setMode = useCallback((mode: 'project-based' | 'hourly') => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, step: prev.step + 1 }));
  }, []);

  const previousStep = useCallback(() => {
    setState(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const updateProjectInfo = useCallback((projectInfo: Partial<ProjectInformation>) => {
    setState(prev => ({
      ...prev,
      projectInfo: { ...prev.projectInfo, ...projectInfo }
    }));
  }, []);

  const updateDeliverables = useCallback((deliverables: DeliverableItem[]) => {
    setState(prev => ({ ...prev, deliverables }));
  }, []);

  const updateTimeComplexity = useCallback((timeComplexity: Partial<TimeComplexity>) => {
    setState(prev => ({
      ...prev,
      timeComplexity: { ...prev.timeComplexity, ...timeComplexity }
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const canProceedToNextStep = useCallback(() => {
    switch (state.step) {
      case 1:
        return state.mode !== null;
      case 2:
        return state.projectInfo.name.trim() !== '' && state.projectInfo.description.trim() !== '';
      case 3:
        return state.deliverables.length > 0;
      case 4:
        return state.timeComplexity.duration > 0 && state.timeComplexity.difficulty !== null;
      default:
        return true;
    }
  }, [state]);

  return {
    state,
    setMode,
    nextStep,
    previousStep,
    goToStep,
    updateProjectInfo,
    updateDeliverables,
    updateTimeComplexity,
    reset,
    canProceedToNextStep
  };
};