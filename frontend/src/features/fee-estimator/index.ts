// Fee Estimator Feature - Public API

// Types
export type { FeeEstimatorState, ProjectInformation, DeliverableItem, TimeComplexity, ProgressStep } from './shared/types';

// Pages
export { FeeEstimatorPage } from './pages/FeeEstimatorPage';
export { default as BREstimationPage } from './pages/base-rate/BREstimationPage';
export { default as PBEstimationPage } from './pages/portfolio-based/PBEstimationPage';
export { default as PJEstimationPage } from './pages/project-based/PJEstimationPage';

// Hooks
export { useFeeEstimator } from './shared/hooks/useFeeEstimator';