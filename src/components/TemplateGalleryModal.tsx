import React, { useEffect } from 'react';
import { X, ShoppingBag, Landmark, Users, Stethoscope, ArrowRight, Check } from 'lucide-react';
import { generateKeywordFallbackSchema } from '../utils/keywordTemplates';
import type { GeneratedAiSchemaResponse } from '../utils/keywordTemplates';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (schema: GeneratedAiSchemaResponse) => void;
}

const TEMPLATES = [
  {
    id: 'ecommerce',
    title: 'E-Commerce & Online Store',
    category: 'Retail & Marketplace',
    icon: ShoppingBag,
    color: 'from-amber-500/20 to-orange-500/20 text-orange-400 border-orange-500/30',
    description: 'Relational database with Customers, Product Catalog, Orders, and Order Items with referential integrity.',
    tables: ['customers (1,000)', 'products (200)', 'orders (5,000)'],
    highlights: ['UUID primary keys', 'Tiered customer categories', 'Currency precision amounts', 'Foreign key references'],
    prompt: 'online store with 1000 customers and 5000 orders',
  },
  {
    id: 'banking',
    title: 'Fintech & Core Banking',
    category: 'Financial Services',
    icon: Landmark,
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    description: 'Financial ledger system with Accounts, Balances, Multi-type Transactions, and Fraud detection flags.',
    tables: ['accounts (500)', 'transactions (3,000)'],
    highlights: ['Debit/credit transaction weights', 'Float balances', 'Fraud classification boolean', 'Account foreign keys'],
    prompt: 'banking system with 500 accounts and 3000 transactions',
  },
  {
    id: 'hr',
    title: 'HR & Workforce Management',
    category: 'Enterprise SaaS',
    icon: Users,
    color: 'from-blue-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/30',
    description: 'Enterprise organizational workforce with Departments, Department Budgets, Employee profiles, and Salaries.',
    tables: ['departments (8)', 'employees (250)'],
    highlights: ['Corporate email generation', 'Annual salary ranges', 'Performance ratings', 'Department foreign keys'],
    prompt: 'hr workforce with 250 employees and company departments',
  },
  {
    id: 'healthcare',
    title: 'Healthcare & Patient Encounters',
    category: 'Clinical Health',
    icon: Stethoscope,
    color: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30',
    description: 'Clinical health system with Patient demographics, Blood groups, Clinical Encounters, and Hospital vitals.',
    tables: ['patients (300)', 'clinical_encounters (1,200)'],
    highlights: ['Realistic blood type distribution', 'Vital signs (BP, HR)', 'Billing charges', 'Patient MRN references'],
    prompt: 'hospital management with 300 patients and 1200 visits',
  },
];

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePick = (prompt: string) => {
    const schema = generateKeywordFallbackSchema(prompt);
    onSelectTemplate(schema);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-gallery-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-4xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <h2 id="template-gallery-title" className="text-base font-bold text-[var(--text-primary)]">Template Gallery</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Production-tested relational databases and multi-table schemas ready to generate
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <div
                key={tmpl.id}
                className="p-5 rounded-xl border flex flex-col justify-between transition-all hover:border-[var(--accent-primary)] group cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
                onClick={() => handlePick(tmpl.prompt)}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${tmpl.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                      {tmpl.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors mb-1.5">
                    {tmpl.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                    {tmpl.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {tmpl.tables.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md border text-[var(--text-primary)] font-medium"
                        style={{
                          backgroundColor: 'var(--bg-surface-subtle)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1 mb-4">
                    {tmpl.highlights.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePick(tmpl.prompt);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--accent-foreground)] transition-all cursor-pointer border"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <span>Load Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)' }}>
          <span className="text-xs text-[var(--text-muted)]">
            Want something custom? Use the <strong>"Describe It"</strong> AI Architect.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
