/**
 * visionOS Domain Pack
 *
 * Implements pack-visionos-001 §3.1 (VisionOS Domain Pack).
 * Provides spatial computing knowledge, prompt templates, and guidance for RAG.
 *
 * Features:
 * - Framework documentation (SwiftUI, RealityKit, ARKit)
 * - Spatial computing concepts
 * - iOS → visionOS porting guides
 * - Troubleshooting knowledge base
 *
 * @see pack-visionos-001 for domain mapping
 */

import { db } from '@/lib/db';
import { eq, and, inArray, sql, desc } from 'drizzle-orm';
import { visionosKnowledge, type VisionOSKnowledge } from '@/db/schema/visionos';

// ============================================================================
// TYPES
// ============================================================================

export type DocumentType =
  | 'framework'
  | 'concept'
  | 'pattern'
  | 'api'
  | 'tutorial'
  | 'troubleshooting'
  | 'optimization'
  | 'porting'
  | 'accessibility';

export type Framework = 'swiftui' | 'realitykit' | 'arkit' | 'metal' | 'avfoundation' | 'general';

export interface KnowledgeQuery {
  query: string;
  frameworks?: Framework[];
  documentTypes?: DocumentType[];
  limit?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'explanation' | 'porting' | 'troubleshooting' | 'optimization';
}

// ============================================================================
// CORE KNOWLEDGE BASE
// ============================================================================

/**
 * Foundational visionOS knowledge documents
 */
export const CORE_KNOWLEDGE: Array<Omit<VisionOSKnowledge, 'id' | 'createdAt' | 'updatedAt'>> = [
  // Framework fundamentals
  {
    documentType: 'framework',
    title: 'visionOS Architecture Overview',
    content: `visionOS is Apple's spatial computing platform for Vision Pro. It builds on familiar Apple frameworks while adding spatial-specific capabilities.

**Core Frameworks:**
- **SwiftUI**: Primary UI framework, extended for 3D with new Views and modifiers
- **RealityKit**: 3D rendering engine with Entity-Component system
- **ARKit**: Spatial tracking, hand tracking, world understanding
- **Metal**: Low-level GPU access for custom rendering

**App Types:**
- **Window-based**: Traditional 2D windows floating in space
- **Volume-based**: 3D content in bounded volumes
- **Full Space**: Immersive experiences taking over the environment

**Key Concepts:**
- Spatial personas for collaborative experiences
- Passthrough for mixed reality
- Hand and eye tracking for input
- Spatial audio for immersive sound`,
    framework: 'general',
    topics: ['architecture', 'overview'],
    tags: ['fundamentals', 'visionos', 'frameworks'],
    sourceRef: 'pack-visionos-001 §1',
    metadata: { reliability: 1.0 },
  },
  {
    documentType: 'framework',
    title: 'SwiftUI for Spatial Computing',
    content: `SwiftUI in visionOS adds spatial capabilities while maintaining familiarity.

**New View Types:**
- \`RealityView\`: Embeds RealityKit content in SwiftUI
- \`Model3D\`: Displays 3D models (USD/USDZ)
- \`ImmersiveSpace\`: Creates full immersive experiences

**Spatial Modifiers:**
- \`.frame(depth:)\`: Adds depth dimension to views
- \`.rotation3DEffect()\`: 3D rotations
- \`.offset(z:)\`: Z-axis positioning
- \`.ornament()\`: Floating UI elements attached to windows

**Windows & Volumes:**
- Windows float in shared space
- Volumes contain bounded 3D content
- Use \`windowStyle(.volumetric)\` for volumes

**Example:**
\`\`\`swift
struct CardView: View {
    var body: some View {
        Model3D(named: "TradingCard") {
            phase in
            switch phase {
            case .success(let model):
                model.resizable()
                    .aspectRatio(contentMode: .fit)
            default:
                ProgressView()
            }
        }
        .frame(depth: 100)
    }
}
\`\`\``,
    framework: 'swiftui',
    topics: ['views', '3d', 'spatial'],
    tags: ['swiftui', 'ui', 'spatial'],
    sourceRef: 'pack-visionos-001 §2',
    codeExamples: [
      {
        language: 'swift',
        code: `@main
struct TCGApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .windowStyle(.volumetric)

        ImmersiveSpace(id: "CardBattle") {
            BattleView()
        }
    }
}`,
        description: 'visionOS app with window and immersive space',
      },
    ],
    metadata: { reliability: 1.0 },
  },
  {
    documentType: 'framework',
    title: 'RealityKit Entity-Component System',
    content: `RealityKit uses an Entity-Component-System (ECS) architecture for 3D content.

**Core Types:**
- \`Entity\`: Base object in scene graph
- \`ModelEntity\`: Entity with visual mesh
- \`AnchorEntity\`: Anchored to real-world features
- \`Component\`: Data attached to entities

**Common Components:**
- \`ModelComponent\`: Visual mesh and materials
- \`Transform\`: Position, rotation, scale
- \`CollisionComponent\`: Physics collision shape
- \`InputTargetComponent\`: Enables gesture input
- \`HoverEffectComponent\`: Visual feedback on gaze

**Materials:**
- \`SimpleMaterial\`: Basic PBR material
- \`UnlitMaterial\`: No lighting calculations
- \`ShaderGraphMaterial\`: Custom shader graph

**Loading Content:**
\`\`\`swift
// From bundle
let entity = try await Entity(named: "Card", in: realityKitContentBundle)

// From URL
let entity = try await ModelEntity(contentsOf: cardURL)
\`\`\``,
    framework: 'realitykit',
    topics: ['ecs', 'entities', 'components'],
    tags: ['realitykit', '3d', 'architecture'],
    sourceRef: 'pack-visionos-001 §3',
    codeExamples: [
      {
        language: 'swift',
        code: `func createCard() async throws -> Entity {
    let card = ModelEntity()

    // Load mesh
    card.model = try await ModelComponent(
        mesh: .generateBox(size: [0.063, 0.088, 0.001]),
        materials: [SimpleMaterial(color: .white, isMetallic: false)]
    )

    // Enable interaction
    card.components.set(InputTargetComponent())
    card.components.set(CollisionComponent(shapes: [.generateBox(size: [0.063, 0.088, 0.001])]))
    card.components.set(HoverEffectComponent())

    return card
}`,
        description: 'Creating an interactive trading card entity',
      },
    ],
    metadata: { reliability: 1.0 },
  },
  {
    documentType: 'framework',
    title: 'ARKit Hand and Eye Tracking',
    content: `ARKit provides hand and eye tracking for natural input on Vision Pro.

**Hand Tracking:**
- Access via \`HandTrackingProvider\`
- Returns \`HandAnchor\` with joint positions
- 27 joints per hand following Apple's skeleton
- Updates at 90Hz

**Eye Tracking:**
- Gaze data through \`GazeProvider\`
- Returns gaze ray origin and direction
- Requires user permission
- Privacy-preserving (no raw eye images)

**Gestures:**
- System handles common gestures automatically
- Use \`SpatialTapGesture\` for tap on 3D content
- Use \`DragGesture\` for manipulating entities
- \`MagnifyGesture\` and \`RotateGesture3D\` for transform

**Best Practices:**
- Don't require constant hand visibility
- Provide visual feedback on gaze targets
- Use hover effects (\`HoverEffectComponent\`)
- Support both hands for accessibility`,
    framework: 'arkit',
    topics: ['hand-tracking', 'eye-tracking', 'input'],
    tags: ['arkit', 'input', 'tracking'],
    sourceRef: 'pack-visionos-001 §4',
    codeExamples: [
      {
        language: 'swift',
        code: `struct CardInteractionView: View {
    var body: some View {
        RealityView { content in
            let card = try! await Entity(named: "Card")
            content.add(card)
        }
        .gesture(
            SpatialTapGesture()
                .targetedToAnyEntity()
                .onEnded { value in
                    // Handle tap on entity
                    selectCard(value.entity)
                }
        )
        .gesture(
            DragGesture()
                .targetedToAnyEntity()
                .onChanged { value in
                    value.entity.position = value.convert(
                        value.location3D,
                        from: .local,
                        to: value.entity.parent!
                    )
                }
        )
    }
}`,
        description: 'Handling spatial gestures on entities',
      },
    ],
    metadata: { reliability: 1.0 },
  },

  // Concepts
  {
    documentType: 'concept',
    title: 'Shared Space vs Full Space',
    content: `visionOS apps can run in two modes: Shared Space and Full Space.

**Shared Space:**
- Default mode for most apps
- Multiple apps visible simultaneously
- Windows float in user's environment
- System chrome (home view, etc.) visible
- Limited immersion but high multitasking

**Full Space (Immersive):**
- Single app takes over
- Can dim or hide passthrough
- Full control of visual environment
- Best for focused experiences
- User can exit via Digital Crown

**Immersion Styles:**
- \`.mixed\`: Content overlays passthrough
- \`.progressive\`: Gradually dims passthrough
- \`.full\`: Completely replaces environment

**When to Use:**
- Shared: Browsing, utilities, widgets
- Full (mixed): AR games, spatial annotations
- Full (progressive/full): Immersive media, VR experiences

**Transitioning:**
\`\`\`swift
// Open immersive space
await openImmersiveSpace(id: "CardBattle")

// Dismiss immersive space
await dismissImmersiveSpace()
\`\`\``,
    framework: 'general',
    topics: ['spaces', 'immersion', 'modes'],
    tags: ['concept', 'spaces', 'immersion'],
    sourceRef: 'pack-visionos-001 §5',
    metadata: { reliability: 1.0 },
  },
  {
    documentType: 'concept',
    title: 'Spatial Audio in visionOS',
    content: `visionOS provides sophisticated spatial audio for immersive experiences.

**Audio Types:**
- **Ambient**: Background audio, not spatialized
- **Spatial**: Positioned in 3D space
- **Channel**: Traditional stereo/surround

**Spatialization:**
- Sound sources attached to entities
- Automatic HRTF processing
- Distance attenuation
- Room modeling with reverb

**Implementation:**
\`\`\`swift
// Add spatial audio to entity
let audioSource = Entity()
audioSource.spatialAudio = SpatialAudioComponent(
    gain: 1.0,
    directivity: .beam(focus: 0.5)
)

let audioResource = try await AudioFileResource(named: "cardFlip")
audioSource.playAudio(audioResource)
\`\`\`

**Best Practices:**
- Use spatial audio for in-scene sounds
- Use ambient for music/narration
- Consider listener fatigue in long sessions
- Test with various head positions`,
    framework: 'realitykit',
    topics: ['audio', 'spatial-audio'],
    tags: ['audio', 'immersion', 'realitykit'],
    sourceRef: 'pack-visionos-001 §6',
    metadata: { reliability: 0.95 },
  },

  // Porting guides
  {
    documentType: 'porting',
    title: 'Porting iOS Apps to visionOS',
    content: `Migrating an iOS app to visionOS follows a progression from compatibility to native.

**Compatibility Modes:**
1. **Designed for iPad**: Run unmodified in a window
2. **Compatible**: Minor adjustments for spatial
3. **Native**: Full spatial experience

**Key Changes:**

**UI Framework:**
- UIKit → SwiftUI (recommended)
- UIKit still works but limited spatial features
- Consider hybrid for large codebases

**Navigation:**
- Tab bars work but consider spatial alternatives
- Navigation stacks for detail views
- Ornaments for contextual actions

**Touch → Gaze/Gesture:**
- Tap gestures map to spatial tap
- Long press → dwell or long pinch
- Pan → drag in 3D space
- Pinch-zoom → two-hand scale

**Considerations:**
- Screen-relative layouts need depth
- Avoid tiny touch targets (44pt → 60pt minimum)
- Reduce text density
- Add depth cues (shadows, layering)

**Testing:**
- Use Simulator for initial development
- Test on device for input accuracy
- Verify in different lighting conditions`,
    framework: 'general',
    topics: ['porting', 'ios', 'migration'],
    tags: ['porting', 'ios', 'migration'],
    sourceRef: 'pack-visionos-001 §7',
    metadata: { reliability: 0.95 },
  },

  // Optimization
  {
    documentType: 'optimization',
    title: 'Performance Optimization for visionOS',
    content: `Vision Pro requires 90fps rendering for comfortable viewing. Optimization is critical.

**Rendering Budget:**
- 90fps = 11ms per frame (both eyes)
- Target 8ms to leave headroom
- Foveated rendering reduces peripheral load

**GPU Optimization:**
- Use LOD (Level of Detail) for distant objects
- Limit draw calls (batch similar materials)
- Use texture atlases
- Reduce shader complexity

**Memory Management:**
- Vision Pro has limited RAM (16GB shared)
- Stream large textures
- Unload invisible entities
- Use compressed textures (ASTC)

**Entity Optimization:**
- Limit entity count (<10,000 visible)
- Use instancing for repeated objects
- Simplify collision shapes
- Disable unused components

**Profiling Tools:**
- Instruments: GPU profiler
- RealityKit Statistics overlay
- Xcode Memory Debugger

**Common Issues:**
- Overdraw from transparent materials
- Excessive bone counts in animations
- Unoptimized USD imports
- Physics simulation overhead`,
    framework: 'general',
    topics: ['performance', 'optimization', 'gpu'],
    tags: ['optimization', 'performance', 'gpu'],
    sourceRef: 'pack-visionos-001 §8',
    metadata: { reliability: 0.9 },
  },

  // Troubleshooting
  {
    documentType: 'troubleshooting',
    title: 'Common visionOS Development Issues',
    content: `Frequently encountered issues when developing for visionOS.

**Entity Not Visible:**
- Check entity is added to scene (\`content.add()\`)
- Verify scale (1 unit = 1 meter)
- Check entity isn't culled (behind camera)
- Ensure materials are assigned

**Gestures Not Working:**
- Add \`InputTargetComponent\` to entity
- Add \`CollisionComponent\` with proper shape
- Verify gesture is attached to correct view
- Check gesture conflicts (priority)

**Performance Drops:**
- Profile with Instruments
- Check for CPU/GPU bottleneck
- Reduce polygon count
- Enable foveated rendering

**Hand Tracking Unreliable:**
- Ensure adequate lighting
- Avoid reflective surfaces
- Check confidence values
- Add smoothing/prediction

**Spatial Audio Not Heard:**
- Verify audio resource loaded
- Check \`SpatialAudioComponent\` attached
- Ensure entity is in scene
- Check volume/gain settings

**App Rejected:**
- Test all accessibility features
- Verify privacy descriptions
- Check for eye strain issues
- Ensure comfortable default distances`,
    framework: 'general',
    topics: ['troubleshooting', 'debugging'],
    tags: ['troubleshooting', 'common-issues', 'debugging'],
    sourceRef: 'pack-visionos-001 §9',
    metadata: { reliability: 0.95 },
  },

  // Accessibility
  {
    documentType: 'accessibility',
    title: 'Accessibility in visionOS Apps',
    content: `visionOS includes comprehensive accessibility features that apps must support.

**Input Alternatives:**
- **Dwell Control**: Activate by looking (no hand gestures)
- **Voice Control**: Voice commands for all actions
- **Pointer Control**: Head movement as pointer
- **Switch Control**: External switch devices

**Visual Accessibility:**
- Support Dynamic Type
- Maintain 4.5:1 contrast ratios
- Don't rely solely on color
- Provide text alternatives for 3D content

**Motion & Comfort:**
- Respect Reduce Motion setting
- Avoid rapid movement
- Provide static alternatives
- Keep content at comfortable distances

**Implementation:**
\`\`\`swift
// VoiceOver label for 3D entity
entity.accessibilityLabel = "Trading Card: Blue Eyes White Dragon"
entity.accessibilityHint = "Double tap to view details"

// Respect reduce motion
@Environment(\\.accessibilityReduceMotion) var reduceMotion

if reduceMotion {
    // Use fade instead of slide animation
}
\`\`\`

**Testing:**
- Test with VoiceOver enabled
- Verify dwell control works
- Check with increased text sizes
- Test with reduced motion`,
    framework: 'general',
    topics: ['accessibility', 'a11y'],
    tags: ['accessibility', 'voiceover', 'inclusive'],
    sourceRef: 'pack-visionos-001 §10',
    metadata: { reliability: 1.0 },
  },

  // TCG-specific
  {
    documentType: 'tutorial',
    title: 'Building a Spatial TCG Card Viewer',
    content: `Step-by-step guide for creating an immersive TCG card viewer.

**1. Project Setup:**
Create visionOS app with RealityKit support.

**2. Card Entity:**
\`\`\`swift
func createCard(imageNamed: String) async throws -> ModelEntity {
    // Create card geometry (standard TCG ratio)
    let mesh = MeshResource.generatePlane(
        width: 0.063, // 63mm
        depth: 0.088  // 88mm
    )

    // Load card image as texture
    let texture = try await TextureResource(named: imageNamed)
    var material = UnlitMaterial()
    material.color = .init(texture: .init(texture))

    let card = ModelEntity(mesh: mesh, materials: [material])

    // Enable interaction
    card.components.set(InputTargetComponent())
    card.components.set(CollisionComponent(shapes: [.generateBox(size: [0.063, 0.088, 0.001])]))
    card.components.set(HoverEffectComponent())

    return card
}
\`\`\`

**3. Card Presentation:**
- Position cards at comfortable viewing distance (1.5m)
- Allow rotation with drag gesture
- Scale on zoom gesture
- Show details panel on selection

**4. Collection View:**
- Arrange cards in 3D grid or carousel
- Support scrolling with hand gestures
- Filter/search with voice or system keyboard

**5. AR Overlay:**
- Use image anchors to recognize physical cards
- Overlay stats and price data
- Show market trends as floating charts`,
    framework: 'realitykit',
    topics: ['tcg', 'cards', 'tutorial'],
    tags: ['tcg', 'tutorial', 'example'],
    sourceRef: 'pack-visionos-001 §11',
    codeExamples: [
      {
        language: 'swift',
        code: `struct CardViewerView: View {
    @State private var selectedCard: Entity?

    var body: some View {
        RealityView { content in
            // Load card collection
            for (index, cardName) in cardNames.enumerated() {
                let card = try! await createCard(imageNamed: cardName)

                // Position in grid
                let row = index / 5
                let col = index % 5
                card.position = [Float(col) * 0.08, Float(row) * -0.1, 0]

                content.add(card)
            }
        }
        .gesture(
            SpatialTapGesture()
                .targetedToAnyEntity()
                .onEnded { value in
                    selectedCard = value.entity
                }
        )
        .sheet(item: $selectedCard) { card in
            CardDetailView(card: card)
        }
    }
}`,
        description: 'Complete card viewer implementation',
      },
    ],
    metadata: { reliability: 0.9 },
  },
];

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * Pre-built prompt templates for visionOS tasks
 */
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'explain-concept',
    name: 'Explain visionOS Concept',
    description: 'Explain a visionOS or spatial computing concept',
    template: `You are an expert in Apple visionOS development.

Explain the following concept for a developer with {{experience}} experience:
- Concept: {{concept}}
- Context: {{context}}

Provide:
1. Clear explanation with analogies
2. Relevant code examples in Swift
3. Best practices and common pitfalls
4. Links to Apple documentation if applicable`,
    variables: ['concept', 'context', 'experience'],
    category: 'explanation',
  },
  {
    id: 'port-ios-feature',
    name: 'Port iOS Feature to visionOS',
    description: 'Guide for porting an iOS feature to visionOS',
    template: `Help port the following iOS feature to visionOS:

**iOS Implementation:**
{{iosCode}}

**Feature Description:**
{{featureDescription}}

**Target Experience:**
{{targetExperience}}

Provide:
1. Analysis of what changes are needed
2. visionOS-native implementation
3. Considerations for spatial UX
4. Fallback for non-spatial contexts`,
    variables: ['iosCode', 'featureDescription', 'targetExperience'],
    category: 'porting',
  },
  {
    id: 'troubleshoot-issue',
    name: 'Troubleshoot visionOS Issue',
    description: 'Diagnose and fix visionOS development issues',
    template: `Troubleshoot the following visionOS development issue:

**Issue Description:**
{{issueDescription}}

**Code Context:**
{{codeContext}}

**Error Messages:**
{{errorMessages}}

**What I've Tried:**
{{attemptedSolutions}}

Provide:
1. Likely cause of the issue
2. Step-by-step fix
3. Verification steps
4. Prevention tips`,
    variables: ['issueDescription', 'codeContext', 'errorMessages', 'attemptedSolutions'],
    category: 'troubleshooting',
  },
  {
    id: 'optimize-performance',
    name: 'Optimize visionOS Performance',
    description: 'Performance optimization recommendations',
    template: `Analyze and optimize visionOS app performance:

**Current Performance:**
- Frame Rate: {{frameRate}} fps
- GPU Time: {{gpuTime}} ms
- Entity Count: {{entityCount}}

**Scene Description:**
{{sceneDescription}}

**Profiling Data:**
{{profilingData}}

Provide:
1. Identified bottlenecks
2. Optimization strategies (prioritized)
3. Code changes needed
4. Expected improvements`,
    variables: ['frameRate', 'gpuTime', 'entityCount', 'sceneDescription', 'profilingData'],
    category: 'optimization',
  },
];

// ============================================================================
// KNOWLEDGE RETRIEVAL
// ============================================================================

/**
 * Initialize knowledge base with core documents
 */
export async function initializeVisionOSKnowledge(): Promise<number> {
  // Check if already initialized
  const [existing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(visionosKnowledge)
    .execute();

  if (existing.count > 0) {
    return existing.count;
  }

  // Insert core knowledge
  await db.insert(visionosKnowledge).values(CORE_KNOWLEDGE).execute();

  return CORE_KNOWLEDGE.length;
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(query: KnowledgeQuery): Promise<VisionOSKnowledge[]> {
  const { frameworks, documentTypes, limit = 10 } = query;

  // Build conditions
  const conditions = [];

  if (frameworks && frameworks.length > 0) {
    conditions.push(inArray(visionosKnowledge.framework, frameworks));
  }

  if (documentTypes && documentTypes.length > 0) {
    conditions.push(inArray(visionosKnowledge.documentType, documentTypes));
  }

  // Query
  const results = await db
    .select()
    .from(visionosKnowledge)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .execute();

  // Simple relevance scoring based on keyword matching
  const queryWords = query.query.toLowerCase().split(/\s+/);
  const scored = results.map((doc) => {
    const text = `${doc.title} ${doc.content}`.toLowerCase();
    const score = queryWords.reduce((acc, word) => {
      return acc + (text.includes(word) ? 1 : 0);
    }, 0);
    return { doc, score };
  });

  // Sort by score and return
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.doc);
}

/**
 * Get knowledge by framework
 */
export async function getKnowledgeByFramework(
  framework: Framework,
  limit: number = 20
): Promise<VisionOSKnowledge[]> {
  return db
    .select()
    .from(visionosKnowledge)
    .where(eq(visionosKnowledge.framework, framework))
    .limit(limit)
    .execute();
}

/**
 * Get knowledge by document type
 */
export async function getKnowledgeByType(
  documentType: DocumentType,
  limit: number = 20
): Promise<VisionOSKnowledge[]> {
  return db
    .select()
    .from(visionosKnowledge)
    .where(eq(visionosKnowledge.documentType, documentType))
    .limit(limit)
    .execute();
}

/**
 * Get porting guides
 */
export async function getPortingGuides(): Promise<VisionOSKnowledge[]> {
  return db
    .select()
    .from(visionosKnowledge)
    .where(eq(visionosKnowledge.documentType, 'porting'))
    .execute();
}

/**
 * Get troubleshooting guides
 */
export async function getTroubleshootingGuides(): Promise<VisionOSKnowledge[]> {
  return db
    .select()
    .from(visionosKnowledge)
    .where(eq(visionosKnowledge.documentType, 'troubleshooting'))
    .execute();
}

// ============================================================================
// PROMPT GENERATION
// ============================================================================

/**
 * Get prompt template by ID
 */
export function getPromptTemplate(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find((t) => t.id === id);
}

/**
 * Fill prompt template with variables
 */
export function fillPromptTemplate(
  template: PromptTemplate,
  variables: Record<string, string>
): string {
  let result = template.template;

  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return result;
}

/**
 * Generate context-aware prompt for visionOS task
 */
export async function generateVisionOSPrompt(
  task: string,
  context: {
    framework?: Framework;
    appType?: string;
    additionalContext?: string;
  }
): Promise<string> {
  // Search for relevant knowledge
  const relevantDocs = await searchKnowledge({
    query: task,
    frameworks: context.framework ? [context.framework] : undefined,
    limit: 3,
  });

  // Build context section
  const knowledgeContext = relevantDocs
    .map((doc) => `### ${doc.title}\n${doc.content.slice(0, 500)}...`)
    .join('\n\n');

  // Build prompt
  return `You are an expert in Apple visionOS development for spatial computing.

## Relevant Knowledge
${knowledgeContext}

## Task Context
- Framework: ${context.framework ?? 'General'}
- App Type: ${context.appType ?? 'Not specified'}
${context.additionalContext ? `- Additional: ${context.additionalContext}` : ''}

## Task
${task}

Provide a detailed, actionable response with Swift code examples where applicable.`;
}
