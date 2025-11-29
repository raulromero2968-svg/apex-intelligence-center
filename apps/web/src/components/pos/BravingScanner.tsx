/**
 * BRAVING Trust Framework Scanner Component
 *
 * Brené Brown's trust algorithm deconstructed into verifiable components.
 * Trust is entropy reduction - lowering uncertainty in human systems.
 * This provides multi-factor authentication for relational integrity.
 *
 * BRAVING Elements:
 * - B: Boundaries - Define explicit edges
 * - R: Reliability - Consistency as proof
 * - A: Accountability - Own errors without deflection
 * - V: Vault - Confidentiality as data security
 * - I: Integrity - Alignment of values/actions
 * - N: Non-Judgment - Safe space for vulnerability
 * - G: Generosity - Assume best intent
 *
 * @see master-plan-personal-operating-system
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Lock,
  RefreshCw,
  UserCheck,
  Key,
  Heart,
  Scale,
  Gift,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Plus,
  History,
  Target,
  CheckCircle,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface BravingScannerProps {
  userId?: string;
  className?: string;
}

type BravingElement = 'boundaries' | 'reliability' | 'accountability' | 'vault' | 'integrity' | 'nonJudgment' | 'generosity';

interface BravingScore {
  score: number;
  notes: string;
}

interface BravingScores {
  boundaries: BravingScore;
  reliability: BravingScore;
  accountability: BravingScore;
  vault: BravingScore;
  integrity: BravingScore;
  nonJudgment: BravingScore;
  generosity: BravingScore;
}

interface TrustEntity {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'system';
  overallScore: number;
  trustLevel: 'minimal' | 'cautious' | 'developing' | 'established' | 'deep';
  bravingScores: {
    boundaries: number;
    reliability: number;
    accountability: number;
    vault: number;
    integrity: number;
    nonJudgment: number;
    generosity: number;
  };
  lastScan?: string;
  trend?: 'improving' | 'stable' | 'declining';
}

interface ActionItem {
  element: BravingElement;
  action: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

interface ScanResult {
  scores: BravingScores;
  overallScore: number;
  lowestElement: BravingElement;
  actionItems: ActionItem[];
  trend?: string;
  deltaFromPrevious?: number;
}

// ============================================================================
// BRAVING ELEMENT DEFINITIONS
// ============================================================================

const BRAVING_ELEMENTS: Record<BravingElement, {
  letter: string;
  name: string;
  icon: React.ElementType;
  description: string;
  questions: string[];
  color: string;
}> = {
  boundaries: {
    letter: 'B',
    name: 'Boundaries',
    icon: Shield,
    description: 'Respect for defined edges. Mutual contract of dos and don\'ts.',
    questions: [
      'Are your boundaries clearly communicated?',
      'Does this person respect your stated limits?',
      'Do they communicate their own boundaries clearly?',
      'Is there version control on boundaries (regular review)?',
    ],
    color: 'cyan',
  },
  reliability: {
    letter: 'R',
    name: 'Reliability',
    icon: RefreshCw,
    description: 'Consistency as proof. Does action match word?',
    questions: [
      'Do they follow through on commitments?',
      'Can you count on them in difficult times?',
      'Is their behavior consistent over time?',
      'What is their fulfillment rate (% of promises kept)?',
    ],
    color: 'green',
  },
  accountability: {
    letter: 'A',
    name: 'Accountability',
    icon: UserCheck,
    description: 'Own errors without deflection. Acknowledge + Apologize + Amend.',
    questions: [
      'Do they own their mistakes?',
      'Do they apologize without qualifiers?',
      'Do they take action to repair?',
      'Are repair scripts predefined for common issues?',
    ],
    color: 'yellow',
  },
  vault: {
    letter: 'V',
    name: 'Vault',
    icon: Lock,
    description: 'Confidentiality as data security. Information shared stays secure.',
    questions: [
      'Do they keep your confidences?',
      'Do they share others\' information with you inappropriately?',
      'Would you trust them with sensitive information?',
      'Has there ever been a breach?',
    ],
    color: 'purple',
  },
  integrity: {
    letter: 'I',
    name: 'Integrity',
    icon: Scale,
    description: 'Alignment of values and actions. Walking the talk.',
    questions: [
      'Do their actions align with their stated values?',
      'Do they choose courage over comfort?',
      'Do they practice what they preach?',
      'Does "playful" teasing respect your seriousness?',
    ],
    color: 'blue',
  },
  nonJudgment: {
    letter: 'N',
    name: 'Non-Judgment',
    icon: Heart,
    description: 'Safe space for vulnerability. No "too serious" labels during shares.',
    questions: [
      'Can you share struggles without judgment?',
      'Do they make you feel safe being vulnerable?',
      'Do they listen without immediately fixing?',
      'Are your quirks accepted or criticized?',
    ],
    color: 'pink',
  },
  generosity: {
    letter: 'G',
    name: 'Generosity',
    icon: Gift,
    description: 'Assume best intent. Default to benevolent hypothesis when ambiguous.',
    questions: [
      'Do they give you the benefit of the doubt?',
      'Do you extend the same generosity to them?',
      'When things go wrong, do they assume positive intent?',
      'Is the default interpretation charitable?',
    ],
    color: 'orange',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function BravingScanner({ userId, className = '' }: BravingScannerProps) {
  const [entities, setEntities] = useState<TrustEntity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<TrustEntity | null>(null);
  const [activeTab, setActiveTab] = useState<'entities' | 'scan' | 'history' | 'actions'>('entities');
  const [scanMode, setScanMode] = useState<'quick' | 'detailed'>('quick');
  const [currentElement, setCurrentElement] = useState<BravingElement>('boundaries');
  const [scores, setScores] = useState<BravingScores>({
    boundaries: { score: 5, notes: '' },
    reliability: { score: 5, notes: '' },
    accountability: { score: 5, notes: '' },
    vault: { score: 5, notes: '' },
    integrity: { score: 5, notes: '' },
    nonJudgment: { score: 5, notes: '' },
    generosity: { score: 5, notes: '' },
  });
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<'person' | 'organization' | 'system'>('person');

  // Load mock data
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    const mockEntities: TrustEntity[] = [
      {
        id: '1',
        name: 'Partner',
        type: 'person',
        overallScore: 78,
        trustLevel: 'established',
        bravingScores: {
          boundaries: 8,
          reliability: 9,
          accountability: 7,
          vault: 9,
          integrity: 8,
          nonJudgment: 6,
          generosity: 8,
        },
        lastScan: new Date(Date.now() - 7 * 86400000).toISOString(),
        trend: 'improving',
      },
      {
        id: '2',
        name: 'Work Team',
        type: 'organization',
        overallScore: 65,
        trustLevel: 'developing',
        bravingScores: {
          boundaries: 7,
          reliability: 7,
          accountability: 6,
          vault: 6,
          integrity: 7,
          nonJudgment: 5,
          generosity: 6,
        },
        lastScan: new Date(Date.now() - 14 * 86400000).toISOString(),
        trend: 'stable',
      },
    ];
    setEntities(mockEntities);
  };

  const startScan = (entity: TrustEntity) => {
    setSelectedEntity(entity);
    setCurrentElement('boundaries');
    setScores({
      boundaries: { score: entity.bravingScores.boundaries, notes: '' },
      reliability: { score: entity.bravingScores.reliability, notes: '' },
      accountability: { score: entity.bravingScores.accountability, notes: '' },
      vault: { score: entity.bravingScores.vault, notes: '' },
      integrity: { score: entity.bravingScores.integrity, notes: '' },
      nonJudgment: { score: entity.bravingScores.nonJudgment, notes: '' },
      generosity: { score: entity.bravingScores.generosity, notes: '' },
    });
    setScanResult(null);
    setActiveTab('scan');
  };

  const completeScan = () => {
    if (!selectedEntity) return;

    const elementScores = Object.values(scores).map(s => s.score);
    const overallScore = elementScores.reduce((a, b) => a + b, 0) / 7 * 10;

    // Find lowest element
    let lowestElement: BravingElement = 'boundaries';
    let lowestScore = 10;
    (Object.entries(scores) as [BravingElement, BravingScore][]).forEach(([key, val]) => {
      if (val.score < lowestScore) {
        lowestScore = val.score;
        lowestElement = key;
      }
    });

    // Generate action items for low scores
    const actionItems: ActionItem[] = [];
    (Object.entries(scores) as [BravingElement, BravingScore][]).forEach(([key, val]) => {
      if (val.score < 7) {
        actionItems.push({
          element: key,
          action: generateActionForElement(key, val.score),
          priority: val.score < 5 ? 'high' : 'medium',
          completed: false,
        });
      }
    });

    const delta = overallScore - selectedEntity.overallScore;
    const trend = delta > 5 ? 'improving' : delta < -5 ? 'declining' : 'stable';

    setScanResult({
      scores,
      overallScore,
      lowestElement,
      actionItems,
      trend,
      deltaFromPrevious: delta,
    });

    // Update entity
    setEntities(entities.map(e =>
      e.id === selectedEntity.id
        ? {
            ...e,
            overallScore,
            bravingScores: {
              boundaries: scores.boundaries.score,
              reliability: scores.reliability.score,
              accountability: scores.accountability.score,
              vault: scores.vault.score,
              integrity: scores.integrity.score,
              nonJudgment: scores.nonJudgment.score,
              generosity: scores.generosity.score,
            },
            lastScan: new Date().toISOString(),
            trend: trend as 'improving' | 'stable' | 'declining',
          }
        : e
    ));
  };

  const generateActionForElement = (element: BravingElement, score: number): string => {
    const actions: Record<BravingElement, string[]> = {
      boundaries: [
        'Schedule a boundary review conversation',
        'Create a written list of key boundaries',
        'Practice stating a boundary this week',
      ],
      reliability: [
        'Track promise fulfillment for 1 week',
        'Discuss reliability expectations explicitly',
        'Create accountability checkpoints',
      ],
      accountability: [
        'Predefine repair scripts for common issues',
        'Practice the Acknowledge-Apologize-Amend pattern',
        'Review recent conflicts for ownership gaps',
      ],
      vault: [
        'Conduct a low-stakes confidentiality test',
        'Discuss information sharing expectations',
        'Review what should be kept private',
      ],
      integrity: [
        'Map stated values vs observed actions',
        'Discuss value alignment openly',
        'Identify areas of misalignment for review',
      ],
      nonJudgment: [
        'Practice vulnerability drill with this entity',
        'Discuss judgment-free communication',
        'Identify triggering topics for extra care',
      ],
      generosity: [
        'Practice generous interpretation for 1 week',
        'Discuss default assumptions in conflict',
        'Create a benevolent hypothesis habit',
      ],
    };
    return actions[element][Math.floor(Math.random() * actions[element].length)];
  };

  const addEntity = () => {
    if (!newEntityName.trim()) return;

    const newEntity: TrustEntity = {
      id: Date.now().toString(),
      name: newEntityName,
      type: newEntityType,
      overallScore: 50,
      trustLevel: 'minimal',
      bravingScores: {
        boundaries: 5,
        reliability: 5,
        accountability: 5,
        vault: 5,
        integrity: 5,
        nonJudgment: 5,
        generosity: 5,
      },
    };

    setEntities([...entities, newEntity]);
    setNewEntityName('');
    setShowAddEntity(false);
  };

  const getElementColor = (element: BravingElement) => {
    const colors: Record<string, string> = {
      cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      green: 'text-green-400 bg-green-500/10 border-green-500/30',
      yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      pink: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    };
    return colors[BRAVING_ELEMENTS[element].color];
  };

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'deep': return 'text-green-400 bg-green-500/10';
      case 'established': return 'text-cyan-400 bg-cyan-500/10';
      case 'developing': return 'text-yellow-400 bg-yellow-500/10';
      case 'cautious': return 'text-orange-400 bg-orange-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const elements = Object.keys(BRAVING_ELEMENTS) as BravingElement[];
  const currentElementIndex = elements.indexOf(currentElement);

  return (
    <div className={`braving-scanner ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Key className="w-8 h-8 text-cyan-400" />
          <h2 className="text-2xl font-bold text-cyan-400 tracking-wider">
            BRAVING TRUST SCANNER
          </h2>
        </div>
        <p className="text-gray-400 text-sm">
          Multi-factor authentication for relational integrity. Trust as entropy reduction.
        </p>

        {/* BRAVING Legend */}
        <div className="mt-4 flex flex-wrap gap-2">
          {elements.map(el => {
            const def = BRAVING_ELEMENTS[el];
            const Icon = def.icon;
            return (
              <div
                key={el}
                className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${getElementColor(el)}`}
              >
                <span className="font-bold">{def.letter}</span>
                <span className="opacity-70">{def.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-2 mb-6">
        {(['entities', 'scan', 'history', 'actions'] as const).map(tab => (
          <TabButton
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            disabled={tab === 'scan' && !selectedEntity}
          >
            {tab === 'entities' && 'Trust Entities'}
            {tab === 'scan' && 'Active Scan'}
            {tab === 'history' && 'Scan History'}
            {tab === 'actions' && 'Action Items'}
          </TabButton>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Entities List */}
        {activeTab === 'entities' && (
          <motion.div
            key="entities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {entities.map(entity => (
              <EntityCard
                key={entity.id}
                entity={entity}
                onScan={() => startScan(entity)}
                getTrustLevelColor={getTrustLevelColor}
              />
            ))}

            {/* Add Entity */}
            {showAddEntity ? (
              <div className="p-4 bg-gray-800/30 border border-cyan-500/30 rounded-lg">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    placeholder="Entity name (e.g., Partner, Team, Friend)"
                    className="w-full bg-black/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex gap-2">
                    {(['person', 'organization', 'system'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setNewEntityType(type)}
                        className={`px-3 py-1 text-xs rounded border transition-colors capitalize ${
                          newEntityType === type
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                            : 'bg-gray-800/50 border-gray-700/50 text-gray-400'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addEntity}
                      className="flex-1 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded text-cyan-400 text-sm"
                    >
                      Add Entity
                    </button>
                    <button
                      onClick={() => setShowAddEntity(false)}
                      className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded text-gray-400 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddEntity(true)}
                className="w-full py-3 border border-dashed border-gray-700/50 rounded-lg text-gray-500 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Trust Entity
              </button>
            )}
          </motion.div>
        )}

        {/* Active Scan */}
        {activeTab === 'scan' && selectedEntity && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {!scanResult ? (
              <>
                {/* Scan Progress */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-400">
                    Scanning: <span className="text-white font-medium">{selectedEntity.name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentElementIndex + 1} / {elements.length}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentElementIndex + 1) / elements.length) * 100}%` }}
                  />
                </div>

                {/* Current Element Scan */}
                <ElementScan
                  element={currentElement}
                  definition={BRAVING_ELEMENTS[currentElement]}
                  score={scores[currentElement]}
                  setScore={(newScore) => setScores({ ...scores, [currentElement]: newScore })}
                  getElementColor={getElementColor}
                />

                {/* Navigation */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const prevIndex = currentElementIndex - 1;
                      if (prevIndex >= 0) setCurrentElement(elements[prevIndex]);
                    }}
                    disabled={currentElementIndex === 0}
                    className="flex-1 py-2 bg-gray-800/50 border border-gray-700/50 rounded text-gray-400 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {currentElementIndex < elements.length - 1 ? (
                    <button
                      onClick={() => setCurrentElement(elements[currentElementIndex + 1])}
                      className="flex-1 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded text-cyan-400 text-sm"
                    >
                      Next Element
                    </button>
                  ) : (
                    <button
                      onClick={completeScan}
                      className="flex-1 py-2 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-sm"
                    >
                      Complete Scan
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Scan Results */
              <ScanResults
                entity={selectedEntity}
                result={scanResult}
                getElementColor={getElementColor}
                onNewScan={() => {
                  setScanResult(null);
                  setActiveTab('entities');
                }}
              />
            )}
          </motion.div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {entities.filter(e => e.lastScan).map(entity => (
              <div key={entity.id} className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-white">{entity.name}</h4>
                    <div className="text-xs text-gray-500">
                      Last scan: {entity.lastScan ? new Date(entity.lastScan).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entity.trend === 'improving' && <TrendingUp className="w-4 h-4 text-green-400" />}
                    {entity.trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
                    {entity.trend === 'declining' && <TrendingDown className="w-4 h-4 text-red-400" />}
                    <span className={`text-2xl font-bold ${
                      entity.overallScore >= 70 ? 'text-green-400' :
                      entity.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {entity.overallScore.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Mini BRAVING Chart */}
                <div className="grid grid-cols-7 gap-1">
                  {elements.map(el => (
                    <div
                      key={el}
                      className={`text-center p-2 rounded ${getElementColor(el)}`}
                    >
                      <div className="text-xs font-bold">{BRAVING_ELEMENTS[el].letter}</div>
                      <div className="text-sm">{entity.bravingScores[el]}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Action Items */}
        {activeTab === 'actions' && (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {scanResult?.actionItems && scanResult.actionItems.length > 0 ? (
              scanResult.actionItems.map((item, i) => (
                <ActionItemCard
                  key={i}
                  item={item}
                  getElementColor={getElementColor}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl text-gray-400 mb-2">No Action Items</h3>
                <p className="text-gray-500 text-sm">
                  Complete a BRAVING scan to generate action items for improvement.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TabButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
        active
          ? 'text-cyan-400 border-b-2 border-cyan-400'
          : disabled
          ? 'text-gray-600 cursor-not-allowed'
          : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function EntityCard({
  entity,
  onScan,
  getTrustLevelColor,
}: {
  entity: TrustEntity;
  onScan: () => void;
  getTrustLevelColor: (level: string) => string;
}) {
  return (
    <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg hover:border-cyan-500/30 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-lg font-medium text-white">{entity.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 capitalize">{entity.type}</span>
            <span className={`px-2 py-0.5 text-xs rounded ${getTrustLevelColor(entity.trustLevel)}`}>
              {entity.trustLevel}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${
            entity.overallScore >= 70 ? 'text-green-400' :
            entity.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {entity.overallScore.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500">Trust Score</div>
        </div>
      </div>

      {/* BRAVING Mini Scores */}
      <div className="flex gap-1 mb-3">
        {(Object.keys(BRAVING_ELEMENTS) as BravingElement[]).map(el => (
          <div
            key={el}
            className="flex-1 text-center py-1 bg-gray-900/50 rounded text-xs"
            title={BRAVING_ELEMENTS[el].name}
          >
            <div className="font-bold text-gray-400">{BRAVING_ELEMENTS[el].letter}</div>
            <div className={
              entity.bravingScores[el] >= 7 ? 'text-green-400' :
              entity.bravingScores[el] >= 5 ? 'text-yellow-400' : 'text-red-400'
            }>
              {entity.bravingScores[el]}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        {entity.lastScan && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <History className="w-3 h-3" />
            Last scan: {new Date(entity.lastScan).toLocaleDateString()}
          </div>
        )}
        <button
          onClick={onScan}
          className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded text-cyan-400 text-sm flex items-center gap-2"
        >
          <Target className="w-4 h-4" />
          Scan Now
        </button>
      </div>
    </div>
  );
}

function ElementScan({
  element,
  definition,
  score,
  setScore,
  getElementColor,
}: {
  element: BravingElement;
  definition: typeof BRAVING_ELEMENTS[BravingElement];
  score: BravingScore;
  setScore: (s: BravingScore) => void;
  getElementColor: (el: BravingElement) => string;
}) {
  const Icon = definition.icon;

  return (
    <div className={`p-6 rounded-lg border ${getElementColor(element)}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-current/10 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold">{definition.letter}: {definition.name}</h3>
          <p className="text-sm opacity-70">{definition.description}</p>
        </div>
      </div>

      {/* Rating Slider */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="opacity-70">Score</span>
          <span className="font-bold">{score.score}/10</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={score.score}
          onChange={(e) => setScore({ ...score, score: parseInt(e.target.value) })}
          className="w-full accent-current"
        />
        <div className="flex justify-between text-xs opacity-50 mt-1">
          <span>Low Trust</span>
          <span>High Trust</span>
        </div>
      </div>

      {/* Guide Questions */}
      <div className="mb-4">
        <div className="text-sm font-medium mb-2 opacity-80">Assessment Questions:</div>
        <ul className="space-y-2">
          {definition.questions.map((q, i) => (
            <li key={i} className="text-sm opacity-70 flex items-start gap-2">
              <ChevronRight className="w-4 h-4 shrink-0 mt-0.5" />
              {q}
            </li>
          ))}
        </ul>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm opacity-70 mb-2 block">Notes (optional)</label>
        <textarea
          value={score.notes}
          onChange={(e) => setScore({ ...score, notes: e.target.value })}
          placeholder="Observations, evidence, context..."
          className="w-full bg-black/30 border border-current/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-current resize-none"
          rows={2}
        />
      </div>
    </div>
  );
}

function ScanResults({
  entity,
  result,
  getElementColor,
  onNewScan,
}: {
  entity: TrustEntity;
  result: ScanResult;
  getElementColor: (el: BravingElement) => string;
  onNewScan: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg text-center">
        <h3 className="text-lg text-gray-400 mb-2">BRAVING Score for {entity.name}</h3>
        <div className={`text-6xl font-bold mb-2 ${
          result.overallScore >= 70 ? 'text-green-400' :
          result.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {result.overallScore.toFixed(0)}
        </div>
        {result.deltaFromPrevious !== undefined && (
          <div className={`flex items-center justify-center gap-1 text-sm ${
            result.deltaFromPrevious > 0 ? 'text-green-400' :
            result.deltaFromPrevious < 0 ? 'text-red-400' : 'text-gray-400'
          }`}>
            {result.deltaFromPrevious > 0 ? <TrendingUp className="w-4 h-4" /> :
             result.deltaFromPrevious < 0 ? <TrendingDown className="w-4 h-4" /> :
             <Minus className="w-4 h-4" />}
            {result.deltaFromPrevious > 0 ? '+' : ''}{result.deltaFromPrevious.toFixed(1)} from last scan
          </div>
        )}
      </div>

      {/* Element Breakdown */}
      <div className="grid grid-cols-1 gap-3">
        {(Object.entries(result.scores) as [BravingElement, BravingScore][]).map(([el, score]) => (
          <div
            key={el}
            className={`p-3 rounded-lg border flex items-center gap-3 ${getElementColor(el)}`}
          >
            <div className="w-8 h-8 rounded-full bg-current/10 flex items-center justify-center text-sm font-bold">
              {BRAVING_ELEMENTS[el].letter}
            </div>
            <div className="flex-1">
              <div className="font-medium">{BRAVING_ELEMENTS[el].name}</div>
              {score.notes && <div className="text-xs opacity-70">{score.notes}</div>}
            </div>
            <div className={`text-2xl font-bold ${
              score.score >= 7 ? 'text-green-400' :
              score.score >= 5 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {score.score}
            </div>
          </div>
        ))}
      </div>

      {/* Lowest Element Alert */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-400 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Area for Growth</span>
        </div>
        <p className="text-sm text-gray-300">
          <strong>{BRAVING_ELEMENTS[result.lowestElement].name}</strong> scored lowest at{' '}
          {result.scores[result.lowestElement].score}/10. Consider focusing improvement efforts here.
        </p>
      </div>

      {/* Action Items Preview */}
      {result.actionItems.length > 0 && (
        <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Generated Action Items
          </h4>
          <div className="space-y-2">
            {result.actionItems.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 text-xs rounded ${
                  item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {item.priority}
                </span>
                <span className="text-gray-300">{item.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onNewScan}
        className="w-full py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 font-medium transition-colors"
      >
        Return to Entities
      </button>
    </div>
  );
}

function ActionItemCard({
  item,
  getElementColor,
}: {
  item: ActionItem;
  getElementColor: (el: BravingElement) => string;
}) {
  const [completed, setCompleted] = useState(item.completed);

  return (
    <div className={`p-4 rounded-lg border ${getElementColor(item.element)} ${completed ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => setCompleted(!completed)}
          className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 transition-colors ${
            completed ? 'bg-green-500/20 border-green-500/50' : 'border-current/50'
          }`}
        >
          {completed && <CheckCircle className="w-4 h-4 text-green-400" />}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold">{BRAVING_ELEMENTS[item.element].letter}</span>
            <span className="font-medium">{BRAVING_ELEMENTS[item.element].name}</span>
            <span className={`px-2 py-0.5 text-xs rounded ${
              item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
              item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {item.priority}
            </span>
          </div>
          <p className={`text-sm ${completed ? 'line-through' : ''}`}>{item.action}</p>
        </div>
      </div>
    </div>
  );
}

export default BravingScanner;
