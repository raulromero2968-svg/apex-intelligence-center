/**
 * Foundational Literature Database (Prehistory to 1870)
 *
 * Curated collection of ~25 foundational works that shaped human thought,
 * civilization, ethics, science, and culture. These are "useful" based on
 * influence (philosophical foundations, scientific breakthroughs, religious/moral
 * frameworks, historical records).
 *
 * Categories:
 * - Religion/Mythology: Moral/ethical foundations
 * - Philosophy: Logical/existential thinking
 * - Literature: Narrative/cultural insights
 * - History/Science: Empirical knowledge
 *
 * Why useful for AI training:
 * - Ethics in Vedas/Bible for moral alignment
 * - Logic in Aristotle for reasoning frameworks
 * - Evolution in Darwin for scientific method
 * - Epic narratives as "simulated realities" for TCG predictions
 *
 * Trade-offs:
 * - GOOD: Timeless insights for ethical AI training
 * - BAD: Old texts may bias modern ethics—filter with corrigibility checks
 *
 * @module data/foundational-literature
 */

export interface FoundationalWork {
  id: string;
  title: string;
  author: string;
  dateApprox: string;
  category: 'religion' | 'philosophy' | 'literature' | 'history' | 'science';
  description: string;
  keyThemes: string[];
  ethicsScore: number;
  corrigibilityFlag: boolean;
  relevanceToApex: string;
}

/**
 * Religion/Mythology - Moral/Ethical Foundations
 */
const religionMythology: FoundationalWork[] = [
  {
    id: 'gilgamesh',
    title: 'Epic of Gilgamesh',
    author: 'Anonymous (Mesopotamian)',
    dateApprox: '~2100 BCE',
    category: 'religion',
    description:
      'The oldest surviving great work of literature. A Mesopotamian epic exploring mortality, friendship, and the quest for immortality. King Gilgamesh learns that true legacy lies in deeds, not eternal life.',
    keyThemes: ['mortality', 'friendship', 'hubris', 'quest', 'human condition'],
    ethicsScore: 0.75,
    corrigibilityFlag: true,
    relevanceToApex:
      "Provides foundational narratives on human condition and mortality—useful for TCG longevity predictions and simulation modeling of 'immortality seeking' behaviors.",
  },
  {
    id: 'vedas',
    title: 'Vedas',
    author: 'Anonymous (Vedic sages)',
    dateApprox: '~1500-500 BCE',
    category: 'religion',
    description:
      'Ancient Sanskrit scriptures forming the foundation of Hindu philosophy. Contains hymns, cosmology, ritual instructions, and early philosophical speculation on reality (Brahman) and self (Atman).',
    keyThemes: ['cosmology', 'ethics', 'dharma', 'karma', 'consciousness'],
    ethicsScore: 0.85,
    corrigibilityFlag: true,
    relevanceToApex:
      'Eastern philosophical framework for ethics and cosmic order. Dharma/karma concepts useful for AI alignment and consequence modeling in simulations.',
  },
  {
    id: 'torah-bible-ot',
    title: 'Torah / Bible (Old Testament)',
    author: 'Anonymous (multiple authors)',
    dateApprox: '~1000-200 BCE',
    category: 'religion',
    description:
      'Sacred scriptures of Judaism (Torah) and Christianity (Old Testament). Contains creation narratives, moral laws (Ten Commandments), history of Israel, prophetic writings, and wisdom literature.',
    keyThemes: ['moral law', 'covenant', 'justice', 'creation', 'prophecy'],
    ethicsScore: 0.8,
    corrigibilityFlag: true,
    relevanceToApex:
      'Shaped Western ethics and justice systems. Moral law frameworks useful for AI corrigibility (rule-following) and ethical boundary definitions.',
  },
  {
    id: 'quran',
    title: 'Quran',
    author: 'Muhammad (prophet)',
    dateApprox: '~610-632 CE',
    category: 'religion',
    description:
      'Central religious text of Islam. Contains divine revelations on guidance, justice, compassion, and submission to God. Emphasizes social welfare, justice, and ethical conduct.',
    keyThemes: ['guidance', 'justice', 'compassion', 'submission', 'social ethics'],
    ethicsScore: 0.8,
    corrigibilityFlag: true,
    relevanceToApex:
      'Global ethical framework with emphasis on justice and social responsibility. Useful for AI training on fair treatment and social welfare considerations.',
  },
  {
    id: 'analects',
    title: 'Analects',
    author: 'Confucius',
    dateApprox: '~500 BCE',
    category: 'religion',
    description:
      'Collection of sayings attributed to Confucius on ethics, governance, and social harmony. Emphasizes filial piety, ritual propriety, benevolence (ren), and the ideal of the junzi (gentleman).',
    keyThemes: ['harmony', 'governance', 'virtue', 'filial piety', 'benevolence'],
    ethicsScore: 0.85,
    corrigibilityFlag: true,
    relevanceToApex:
      'Practical social ethics and governance models. Useful for AI training on hierarchical respect, social harmony, and benevolent leadership in simulations.',
  },
];

/**
 * Philosophy - Logical/Existential Thinking
 */
const philosophy: FoundationalWork[] = [
  {
    id: 'republic',
    title: 'Republic',
    author: 'Plato',
    dateApprox: '~380 BCE',
    category: 'philosophy',
    description:
      "Socratic dialogue on justice, the ideal state, and the nature of the soul. Introduces the theory of Forms, the allegory of the cave, and the philosopher-king concept. Foundation of Western political theory.",
    keyThemes: ['justice', 'ideal state', 'forms', 'knowledge', 'philosopher-king'],
    ethicsScore: 0.85,
    corrigibilityFlag: true,
    relevanceToApex:
      'Core political theory for governance simulations. Allegory of the cave relates to simulation hypothesis—distinguishing base reality from perceived reality.',
  },
  {
    id: 'nicomachean-ethics',
    title: 'Nicomachean Ethics',
    author: 'Aristotle',
    dateApprox: '~350 BCE',
    category: 'philosophy',
    description:
      'Systematic treatise on virtue ethics and the good life. Introduces the doctrine of the mean, distinguishes intellectual and moral virtues, and argues that eudaimonia (flourishing) is the highest good.',
    keyThemes: ['virtue', 'happiness', 'flourishing', 'mean', 'practical wisdom'],
    ethicsScore: 0.9,
    corrigibilityFlag: true,
    relevanceToApex:
      'Foundational for moral AI training. Virtue ethics provides framework for balanced decision-making; eudaimonia aligns with FHI longtermist flourishing goals.',
  },
  {
    id: 'meditations',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    dateApprox: '~180 CE',
    category: 'philosophy',
    description:
      'Personal writings of the Roman Emperor on Stoic philosophy. Emphasizes self-discipline, acceptance of fate, duty, and rational reflection as paths to inner peace.',
    keyThemes: ['stoicism', 'resilience', 'duty', 'acceptance', 'rationality'],
    ethicsScore: 0.85,
    corrigibilityFlag: true,
    relevanceToApex:
      'Stoic resilience framework for AI robustness. Useful for modeling agents that maintain ethical consistency under adverse conditions (market crashes, edge cases).',
  },
  {
    id: 'critique-pure-reason',
    title: 'Critique of Pure Reason',
    author: 'Immanuel Kant',
    dateApprox: '1781',
    category: 'philosophy',
    description:
      'Foundational work in modern philosophy examining the limits and possibilities of human knowledge. Introduces the distinction between analytic/synthetic and a priori/a posteriori knowledge.',
    keyThemes: ['epistemology', 'transcendental idealism', 'categories', 'limits of reason'],
    ethicsScore: 0.85,
    corrigibilityFlag: true,
    relevanceToApex:
      'Epistemological foundation for AI knowledge representation. Kantian categories inform how AI should structure and limit claims about reality.',
  },
  {
    id: 'phenomenology-spirit',
    title: 'Phenomenology of Spirit',
    author: 'Georg Wilhelm Friedrich Hegel',
    dateApprox: '1807',
    category: 'philosophy',
    description:
      "Comprehensive account of consciousness's development from sense-certainty to absolute knowledge. Introduces the dialectical method (thesis-antithesis-synthesis) and the master-slave dialectic.",
    keyThemes: ['dialectics', 'consciousness', 'history', 'absolute spirit', 'recognition'],
    ethicsScore: 0.75,
    corrigibilityFlag: true,
    relevanceToApex:
      'Dialectical framework for modeling competing viewpoints in simulations. Master-slave dialectic relevant for AI-human power dynamics analysis.',
  },
];

/**
 * Literature - Narrative/Cultural Insights
 */
const literature: FoundationalWork[] = [
  {
    id: 'iliad',
    title: 'Iliad',
    author: 'Homer',
    dateApprox: '~800 BCE',
    category: 'literature',
    description:
      'Greek epic poem set during the Trojan War. Explores themes of honor, glory, mortality, and the wrath of Achilles. Foundational for Western literature and heroic archetypes.',
    keyThemes: ['heroism', 'honor', 'mortality', 'wrath', 'fate'],
    ethicsScore: 0.7,
    corrigibilityFlag: true,
    relevanceToApex:
      'Archetypal narratives for storytelling models. Heroic journey patterns useful for TCG narrative modeling and prediction of player behavior archetypes.',
  },
  {
    id: 'odyssey',
    title: 'Odyssey',
    author: 'Homer',
    dateApprox: '~800 BCE',
    category: 'literature',
    description:
      "Greek epic poem following Odysseus's ten-year journey home after the Trojan War. Explores themes of cunning, perseverance, homecoming, and the conflict between civilization and nature.",
    keyThemes: ['journey', 'cunning', 'homecoming', 'loyalty', 'identity'],
    ethicsScore: 0.75,
    corrigibilityFlag: true,
    relevanceToApex:
      'Journey narrative archetype for simulation modeling. Useful for predicting long-term goal pursuit and obstacle navigation in TCG market simulations.',
  },
  {
    id: 'aeneid',
    title: 'Aeneid',
    author: 'Virgil',
    dateApprox: '~19 BCE',
    category: 'literature',
    description:
      "Latin epic poem following Aeneas's journey from Troy to Italy. Explores themes of fate, duty, the cost of empire, and the tension between personal desire and civic responsibility.",
    keyThemes: ['fate', 'duty', 'empire', 'piety', 'sacrifice'],
    ethicsScore: 0.75,
    corrigibilityFlag: true,
    relevanceToApex:
      'Duty vs. desire conflict modeling. Useful for AI training on prioritizing long-term goals (civic duty) over short-term preferences.',
  },
  {
    id: 'divine-comedy',
    title: 'Divine Comedy',
    author: 'Dante Alighieri',
    dateApprox: '1320',
    category: 'literature',
    description:
      'Italian epic poem describing the journey through Hell, Purgatory, and Heaven. Synthesizes medieval theology, classical philosophy, and vernacular poetry into a comprehensive moral cosmology.',
    keyThemes: ['salvation', 'sin', 'redemption', 'moral cosmology', 'divine justice'],
    ethicsScore: 0.8,
    corrigibilityFlag: true,
    relevanceToApex:
      'Moral cosmology framework for ethical hierarchy modeling. Hell/Purgatory/Heaven structure useful for ranking outcomes in prediction markets.',
  },
  {
    id: 'hamlet',
    title: 'Hamlet',
    author: 'William Shakespeare',
    dateApprox: '1603',
    category: 'literature',
    description:
      'Tragedy exploring themes of revenge, mortality, madness, and the nature of action. Hamlet\'s indecision and existential questioning ("To be or not to be") remain iconic explorations of the human psyche.',
    keyThemes: ['revenge', 'mortality', 'madness', 'action', 'existentialism'],
    ethicsScore: 0.75,
    corrigibilityFlag: true,
    relevanceToApex:
      'Decision paralysis modeling. Useful for understanding inaction costs in market simulations and the psychology of uncertainty.',
  },
  {
    id: 'don-quixote',
    title: 'Don Quixote',
    author: 'Miguel de Cervantes',
    dateApprox: '1605',
    category: 'literature',
    description:
      'Spanish novel considered the first modern novel. Satirizes chivalric romances through the misadventures of Don Quixote and Sancho Panza. Explores the tension between idealism and reality.',
    keyThemes: ['idealism', 'reality', 'satire', 'madness', 'adventure'],
    ethicsScore: 0.7,
    corrigibilityFlag: true,
    relevanceToApex:
      'Idealism vs. reality conflict. Useful for modeling irrational market behavior and the disconnect between narrative beliefs and empirical outcomes.',
  },
  {
    id: 'paradise-lost',
    title: 'Paradise Lost',
    author: 'John Milton',
    dateApprox: '1667',
    category: 'literature',
    description:
      'English epic poem retelling the biblical Fall of Man. Explores themes of free will, obedience, rebellion, and the origin of evil. Satan\'s characterization influenced Romantic portrayals of rebels.',
    keyThemes: ['fall', 'free will', 'rebellion', 'redemption', 'evil'],
    ethicsScore: 0.8,
    corrigibilityFlag: true,
    relevanceToApex:
      'Free will and rebellion modeling. Useful for AI corrigibility research—understanding conditions under which agents might resist correction.',
  },
];

/**
 * History/Science - Empirical Knowledge
 */
const historyScience: FoundationalWork[] = [
  {
    id: 'histories',
    title: 'Histories',
    author: 'Herodotus',
    dateApprox: '~440 BCE',
    category: 'history',
    description:
      'The first great prose work of European literature and the first systematic historical investigation. Documents the Greco-Persian Wars and diverse cultures of the ancient world.',
    keyThemes: ['history', 'inquiry', 'culture', 'war', 'fate'],
    ethicsScore: 0.7,
    corrigibilityFlag: true,
    relevanceToApex:
      'First systematic inquiry methodology. Useful for establishing historical precedent research patterns in simulation modeling.',
  },
  {
    id: 'elements',
    title: 'Elements',
    author: 'Euclid',
    dateApprox: '~300 BCE',
    category: 'science',
    description:
      'Mathematical treatise establishing the axiomatic method. Systematizes geometry through definitions, postulates, and logical proofs. Foundational for mathematical reasoning for over 2000 years.',
    keyThemes: ['geometry', 'axioms', 'proof', 'logic', 'deduction'],
    ethicsScore: 0.9,
    corrigibilityFlag: true,
    relevanceToApex:
      'Axiomatic reasoning foundation. Essential for AI logical consistency and mathematical proof verification in prediction models.',
  },
  {
    id: 'principia-mathematica',
    title: 'Principia Mathematica (Newton)',
    author: 'Isaac Newton',
    dateApprox: '1687',
    category: 'science',
    description:
      'Foundational work of modern physics establishing the laws of motion and universal gravitation. Introduced calculus-based mathematical physics and the concept of absolute space and time.',
    keyThemes: ['motion', 'gravity', 'calculus', 'mechanics', 'universe'],
    ethicsScore: 0.9,
    corrigibilityFlag: true,
    relevanceToApex:
      'Physical law foundation for simulation modeling. Newtonian mechanics as baseline for market momentum and force models.',
  },
  {
    id: 'origin-of-species',
    title: 'On the Origin of Species',
    author: 'Charles Darwin',
    dateApprox: '1859',
    category: 'science',
    description:
      'Revolutionary work establishing the theory of evolution by natural selection. Explains species diversity through variation, inheritance, and differential survival. Transformed biology and influenced philosophy.',
    keyThemes: ['evolution', 'natural selection', 'adaptation', 'variation', 'descent'],
    ethicsScore: 0.85,
    corrigibilityFlag: true,
    relevanceToApex:
      'Evolutionary framework for EGGROLL training methodology. Natural selection principles directly applicable to gradient-free optimization in AI.',
  },
];

/**
 * Complete curated collection of foundational literature
 */
export const FOUNDATIONAL_LITERATURE: FoundationalWork[] = [
  ...religionMythology,
  ...philosophy,
  ...literature,
  ...historyScience,
];

/**
 * Get literature by category
 */
export function getLitByCategory(
  category: 'religion' | 'philosophy' | 'literature' | 'history' | 'science'
): FoundationalWork[] {
  return FOUNDATIONAL_LITERATURE.filter((work) => work.category === category);
}

/**
 * Get literature with high ethics scores (>= threshold)
 */
export function getHighEthicsLit(threshold: number = 0.8): FoundationalWork[] {
  return FOUNDATIONAL_LITERATURE.filter((work) => work.ethicsScore >= threshold);
}

/**
 * Get corrigibility-safe literature
 */
export function getCorrigibleLit(): FoundationalWork[] {
  return FOUNDATIONAL_LITERATURE.filter((work) => work.corrigibilityFlag);
}

/**
 * Search literature by theme
 */
export function searchLitByTheme(theme: string): FoundationalWork[] {
  const lowerTheme = theme.toLowerCase();
  return FOUNDATIONAL_LITERATURE.filter((work) =>
    work.keyThemes.some((t) => t.toLowerCase().includes(lowerTheme))
  );
}

/**
 * Get literature context for RAG queries
 * Returns formatted context string for LLM prompts
 */
export function getLitContextForRAG(workIds: string[]): string {
  const works = FOUNDATIONAL_LITERATURE.filter((w) => workIds.includes(w.id));

  if (works.length === 0) {
    return '';
  }

  return works
    .map(
      (work, i) =>
        `[lit:${i + 1}] "${work.title}" by ${work.author} (${work.dateApprox})
Category: ${work.category}
Description: ${work.description}
Key Themes: ${work.keyThemes.join(', ')}
Relevance to Apex: ${work.relevanceToApex}
Ethics Score: ${work.ethicsScore}/1.0`
    )
    .join('\n\n');
}

/**
 * Literature statistics
 */
export const LITERATURE_STATS = {
  totalWorks: FOUNDATIONAL_LITERATURE.length,
  byCategory: {
    religion: getLitByCategory('religion').length,
    philosophy: getLitByCategory('philosophy').length,
    literature: getLitByCategory('literature').length,
    history: getLitByCategory('history').length,
    science: getLitByCategory('science').length,
  },
  avgEthicsScore:
    FOUNDATIONAL_LITERATURE.reduce((sum, w) => sum + w.ethicsScore, 0) /
    FOUNDATIONAL_LITERATURE.length,
  corrigibleWorks: getCorrigibleLit().length,
  dateRange: {
    earliest: '~2100 BCE',
    latest: '1859',
  },
};
