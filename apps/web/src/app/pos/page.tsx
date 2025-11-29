/**
 * Personal Operating System (POS) Dashboard
 *
 * A living architecture for cognitive, relational, and emotional systems.
 * Stress-tested through use and refined via feedback loops.
 *
 * Core Modules:
 * - Vulnerability Drills: Engineered exposure for resilience
 * - BRAVING Scanner: Multi-factor trust authentication
 * - Emotion Dashboard: Real-time tracking with HRV integration
 * - Bias Calibration: Model audit for pattern validation
 * - Resource Optimizer: Shield mode management
 * - Escape Hatch: Reactivity prevention scripts
 *
 * @see master-plan-personal-operating-system
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Shield,
  Heart,
  Activity,
  Search,
  Gauge,
  LifeBuoy,
  Key,
  Target,
  Zap,
  Moon,
  Settings,
  ChevronRight,
} from 'lucide-react';

// Import POS Components
import { VulnerabilityDrills } from '@/components/pos/VulnerabilityDrills';
import { BravingScanner } from '@/components/pos/BravingScanner';
import { EmotionDashboard } from '@/components/pos/EmotionDashboard';
import { BiasCalibration } from '@/components/pos/BiasCalibration';
import { ResourceOptimizer } from '@/components/pos/ResourceOptimizer';
import { EscapeHatch } from '@/components/pos/EscapeHatch';

// ============================================================================
// TYPES
// ============================================================================

type Module =
  | 'overview'
  | 'vulnerability'
  | 'braving'
  | 'emotion'
  | 'bias'
  | 'resource'
  | 'escape';

interface ModuleConfig {
  id: Module;
  name: string;
  shortName: string;
  description: string;
  icon: React.ElementType;
  color: string;
  component?: React.ComponentType<{ userId?: string; className?: string }>;
}

// ============================================================================
// MODULE CONFIGURATIONS
// ============================================================================

const MODULES: ModuleConfig[] = [
  {
    id: 'overview',
    name: 'System Overview',
    shortName: 'Overview',
    description: 'Personal Operating System status and quick actions',
    icon: Brain,
    color: 'cyan',
  },
  {
    id: 'vulnerability',
    name: 'Vulnerability Drills',
    shortName: 'Drills',
    description: 'Engineered exposure for resilience building',
    icon: Shield,
    color: 'green',
    component: VulnerabilityDrills,
  },
  {
    id: 'braving',
    name: 'BRAVING Scanner',
    shortName: 'Trust',
    description: 'Multi-factor authentication for relational integrity',
    icon: Key,
    color: 'purple',
    component: BravingScanner,
  },
  {
    id: 'emotion',
    name: 'Emotion Dashboard',
    shortName: 'Emotion',
    description: 'Real-time tracking with HRV integration',
    icon: Activity,
    color: 'pink',
    component: EmotionDashboard,
  },
  {
    id: 'bias',
    name: 'Bias Calibration',
    shortName: 'Calibrate',
    description: 'Model audit for pattern validation',
    icon: Search,
    color: 'yellow',
    component: BiasCalibration,
  },
  {
    id: 'resource',
    name: 'Resource Optimizer',
    shortName: 'Resources',
    description: 'Shield mode management and burnout prevention',
    icon: Gauge,
    color: 'blue',
    component: ResourceOptimizer,
  },
  {
    id: 'escape',
    name: 'Escape Hatch',
    shortName: 'Escape',
    description: 'Reactivity prevention scripts',
    icon: LifeBuoy,
    color: 'orange',
    component: EscapeHatch,
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function POSDashboard() {
  const [activeModule, setActiveModule] = useState<Module>('overview');
  const currentModule = MODULES.find(m => m.id === activeModule);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-cyan-500/20 bg-black/30 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-wide">
                    Personal Operating System
                  </h1>
                  <p className="text-xs text-gray-500">
                    Living architecture for cognitive, relational, and emotional systems
                  </p>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="hidden md:flex items-center gap-4">
                <StatusPill label="Shield Mode" value="Balanced" color="green" />
                <StatusPill label="Burnout Risk" value="35%" color="yellow" />
                <StatusPill label="Trust Score" value="78" color="cyan" />
              </div>
            </div>

            {/* Module Navigation */}
            <nav className="mt-4 -mb-px flex gap-1 overflow-x-auto pb-px">
              {MODULES.map(module => {
                const Icon = module.icon;
                const isActive = activeModule === module.id;
                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? `bg-${module.color}-500/10 text-${module.color}-400 border-b-2 border-${module.color}-400`
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{module.shortName}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            {activeModule === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <OverviewDashboard onModuleSelect={setActiveModule} />
              </motion.div>
            ) : currentModule?.component ? (
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <currentModule.component className="max-w-4xl mx-auto" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatusPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-${color}-500/10 border border-${color}-500/30`}>
      <span className={`w-2 h-2 rounded-full bg-${color}-400`} />
      <span className="text-xs text-gray-500">{label}:</span>
      <span className={`text-xs font-medium text-${color}-400`}>{value}</span>
    </div>
  );
}

function OverviewDashboard({
  onModuleSelect,
}: {
  onModuleSelect: (module: Module) => void;
}) {
  return (
    <div className="space-y-8">
      {/* System Status */}
      <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Zap className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">System Status: Operational</h2>
            <p className="text-gray-400">
              All modules functioning. Ready for iteration and refinement.
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickStat label="Drills Completed" value="8/15" color="green" icon={Shield} />
          <QuickStat label="Trust Entities" value="4" color="purple" icon={Key} />
          <QuickStat label="Audit Streak" value="6 weeks" color="yellow" icon={Search} />
          <QuickStat label="Escape Uses" value="20" color="orange" icon={LifeBuoy} />
        </div>
      </div>

      {/* Core Axioms */}
      <div className="p-6 bg-gray-800/30 border border-gray-700/50 rounded-xl">
        <h3 className="text-lg font-bold text-white mb-4">Core Axioms</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <AxiomCard
            title="Probabilistic Reality"
            description="All conclusions are probability-weighted, not binary truths."
            icon={Target}
          />
          <AxiomCard
            title="Bayesian Trust"
            description="Trust updates incrementally based on evidence, not leaps of faith."
            icon={Activity}
          />
          <AxiomCard
            title="Anti-Fragile Design"
            description="Stress-testing strengthens the system rather than breaking it."
            icon={Shield}
          />
        </div>
      </div>

      {/* Module Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Modules</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.filter(m => m.id !== 'overview').map(module => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => onModuleSelect(module.id)}
                className={`p-4 text-left rounded-xl border bg-gray-800/30 border-gray-700/50 hover:border-${module.color}-500/50 hover:bg-${module.color}-500/5 transition-colors group`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-${module.color}-500/10 border border-${module.color}-500/30 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${module.color}-400`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium text-white group-hover:text-${module.color}-400 transition-colors`}>
                      {module.name}
                    </h4>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-600 group-hover:text-${module.color}-400 group-hover:translate-x-1 transition-all`} />
                </div>
                <p className="text-sm text-gray-500">{module.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <QuickAction
          title="Start Vulnerability Drill"
          description="Schedule your weekly exposure training"
          icon={Shield}
          color="green"
          onClick={() => onModuleSelect('vulnerability')}
        />
        <QuickAction
          title="Run BRAVING Scan"
          description="Evaluate trust in a key relationship"
          icon={Key}
          color="purple"
          onClick={() => onModuleSelect('braving')}
        />
        <QuickAction
          title="Log Emotion State"
          description="Track current emotional snapshot"
          icon={Activity}
          color="pink"
          onClick={() => onModuleSelect('emotion')}
        />
      </div>

      {/* Protocol Reminder */}
      <div className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl">
        <h3 className="text-lg font-bold text-purple-400 mb-3">Ethical Guardrail</h3>
        <p className="text-gray-400">
          Always query: &quot;Does this update empower without deceiving?&quot; For relationships,
          this means transparent meta-communication. Share your protocols openly—
          authenticity strengthens connection.
        </p>
      </div>

      {/* Next Steps */}
      <div className="p-6 bg-gray-800/30 border border-gray-700/50 rounded-xl">
        <h3 className="text-lg font-bold text-white mb-4">Operationalization Checklist</h3>
        <div className="space-y-3">
          <ChecklistItem checked>Create POS database schema</ChecklistItem>
          <ChecklistItem checked>Implement vulnerability drills module</ChecklistItem>
          <ChecklistItem checked>Build BRAVING trust scanner</ChecklistItem>
          <ChecklistItem checked>Integrate emotion tracking with HRV hooks</ChecklistItem>
          <ChecklistItem checked>Add bias calibration protocol</ChecklistItem>
          <ChecklistItem checked>Configure resource allocation optimizer</ChecklistItem>
          <ChecklistItem>Complete first weekly model audit</ChecklistItem>
          <ChecklistItem>Run 7-day iteration cycle</ChecklistItem>
          <ChecklistItem>Scale to group dynamics (Apex teams)</ChecklistItem>
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="p-4 bg-black/30 rounded-lg border border-gray-700/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 text-${color}-400`} />
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-bold text-${color}-400`}>{value}</div>
    </div>
  );
}

function AxiomCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="p-4 bg-black/30 rounded-lg border border-gray-700/50">
      <Icon className="w-6 h-6 text-cyan-400 mb-3" />
      <h4 className="font-medium text-white mb-1">{title}</h4>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

function QuickAction({
  title,
  description,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 text-left rounded-xl border bg-${color}-500/10 border-${color}-500/30 hover:bg-${color}-500/20 transition-colors group`}
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-6 h-6 text-${color}-400`} />
        <h4 className={`font-medium text-${color}-400`}>{title}</h4>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </button>
  );
}

function ChecklistItem({
  checked,
  children,
}: {
  checked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
        checked
          ? 'bg-green-500/20 border-green-500/50'
          : 'border-gray-600'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={checked ? 'text-gray-500 line-through' : 'text-gray-300'}>
        {children}
      </span>
    </div>
  );
}
