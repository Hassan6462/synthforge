import React, { useState } from 'react';
import { Sparkles, Database, GitMerge, FileSpreadsheet, ShieldAlert, BarChart3, ChevronRight, ChevronLeft, X, Check } from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

const TOUR_STEPS = [
  {
    title: 'Welcome to SynthForge',
    subtitle: 'Enterprise-grade synthetic data generation engine',
    description: 'SynthForge creates high-fidelity synthetic data for tabular schemas, relational databases with parent-child integrity, and multi-region complex documents.',
    icon: Sparkles,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    targetTab: 'home',
  },
  {
    title: 'Tabular Synthesis & Privacy Engine',
    subtitle: 'Zero-leakage data generation with differential privacy',
    description: 'Define columns with realistic distributions, apply column-level privacy (none, mask first letters, or SHA-256 hash), and add calibrated Laplace noise with an epsilon privacy budget.',
    icon: Database,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    targetTab: 'tabular',
  },
  {
    title: 'Edge Case Stress-Testing',
    subtitle: 'Uncover edge vulnerabilities before production',
    description: 'Turn on "Inject edge cases" with tunable intensity (Low, Medium, High) to test your pipelines against unexpected nulls, extreme values, duplicates, unicode/emoji strings, and malformed inputs.',
    icon: ShieldAlert,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    targetTab: 'tabular',
  },
  {
    title: 'Relational Graph & Interactive ERD',
    subtitle: '100% referential integrity guaranteed',
    description: 'Model foreign key hierarchies (1:1, 1:N, N:N) and computed aggregation columns with real-time interactive ER diagrams. Export as relational ZIP CSVs or full SQL dumps.',
    icon: GitMerge,
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    targetTab: 'relational',
  },
  {
    title: 'Data Sources & Browser Profiling',
    subtitle: 'Import real datasets directly into IndexedDB',
    description: 'Drag & drop CSV, JSON, or Excel (XLSX) spreadsheets. SynthForge parses them client-side in seconds and stores them locally with zero server upload.',
    icon: FileSpreadsheet,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    targetTab: 'datasources',
  },
  {
    title: 'Exploratory Data Analysis (EDA) & Synthetic Cloning',
    subtitle: 'Web Worker analytics and PII vulnerability scanner',
    description: 'Inspect row/column counts, missing ratios, IQR outlier detection, histograms, correlation heatmaps, and automatic PII detection. Click "Generate synthetic version" to clone any dataset!',
    icon: BarChart3,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    targetTab: 'eda',
  },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextIndex = currentStep + 1;
      setCurrentStep(nextIndex);
      onNavigateTab(TOUR_STEPS[nextIndex].targetTab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevIndex = currentStep - 1;
      setCurrentStep(prevIndex);
      onNavigateTab(TOUR_STEPS[prevIndex].targetTab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Step Indicator & Close */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep
                    ? 'w-6 bg-[var(--accent-primary)]'
                    : i < currentStep
                    ? 'w-2 bg-[var(--text-secondary)]'
                    : 'w-2 bg-[var(--border-subtle)]'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${step.color}`}>
            <Icon className="w-7 h-7" />
          </div>

          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </span>

          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">{step.title}</h3>
          <p className="text-xs font-semibold text-[var(--accent-primary)] mb-3">{step.subtitle}</p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{step.description}</p>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)' }}>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium cursor-pointer"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg text-[var(--accent-foreground)] shadow-xs transition-transform active:scale-95 cursor-pointer hover:brightness-105"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>
                  <span>Get Started</span>
                  <Check className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
