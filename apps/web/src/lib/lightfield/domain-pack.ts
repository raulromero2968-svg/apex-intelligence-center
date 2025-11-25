/**
 * Light Field Display Domain Pack
 *
 * Implements pack-lfd-001 §5 (RAG Domain Pack).
 * Provides holographic display knowledge, prompt templates, and guidance.
 *
 * Features:
 * - Core holographic concepts documentation
 * - Display-specific optimization guidance
 * - Prompt templates for light field tasks
 * - Troubleshooting knowledge base
 *
 * @see pack-lfd-001 for domain mapping
 */

import { db } from '@/lib/db';
import { eq, and, inArray, sql, desc } from 'drizzle-orm';
import { lightFieldKnowledge, type LightFieldKnowledge } from '@/db/schema/lightfield';

// ============================================================================
// TYPES
// ============================================================================

export type DocumentType = 'principle' | 'technique' | 'hardware' | 'optimization' | 'troubleshooting' | 'example';
export type Domain = 'rendering' | 'hardware' | 'calibration' | 'performance' | 'design' | 'general';

export interface KnowledgeQuery {
  query: string;
  domains?: Domain[];
  documentTypes?: DocumentType[];
  limit?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'generation' | 'optimization' | 'troubleshooting' | 'explanation';
}

// ============================================================================
// CORE KNOWLEDGE BASE
// ============================================================================

/**
 * Foundational holographic display knowledge
 */
export const CORE_KNOWLEDGE: Array<Omit<LightFieldKnowledge, 'id' | 'createdAt' | 'updatedAt'>> = [
  // Principles
  {
    documentType: 'principle',
    title: 'Light Field Display Fundamentals',
    content: `Light field displays create glasses-free 3D imagery by emitting light rays in multiple directions simultaneously. Unlike traditional displays that emit the same image to all viewers, light field displays emit different images at different angles, mimicking how light behaves in the real world.

Key concepts:
- **Parallax**: The apparent shift of objects based on viewing angle
- **Vergence-Accommodation**: Natural focus response to depth cues
- **View Synthesis**: Generating intermediate views between captured perspectives
- **Quilt Rendering**: Pre-rendering multiple views into a texture atlas`,
    domain: 'general',
    tags: ['fundamentals', 'theory', 'light-field'],
    sourceRef: 'pack-lfd-001 §1',
    metadata: { reliability: 1.0 },
  },
  {
    documentType: 'principle',
    title: 'Quilt Texture Architecture',
    content: `A quilt is a 2D texture atlas containing multiple perspective views arranged in a grid. When displayed on a lenticular or parallax barrier display, each view is directed to different viewing angles.

Quilt specifications:
- **View Count**: 45-100 views typical (more = smoother parallax)
- **Grid Layout**: Views arranged in rows/columns (e.g., 8x6 = 48 views)
- **View Resolution**: Individual view size (e.g., 420x560 pixels)
- **Total Resolution**: Full quilt size (e.g., 3360x3360 pixels)
- **View Cone**: Angular range covered (40-53 degrees typical)

The quilt is processed by shader code that samples the appropriate view based on screen position and lenticular properties.`,
    domain: 'rendering',
    tags: ['quilt', 'texture', 'rendering'],
    sourceRef: 'pack-lfd-001 §2.1',
    metadata: { reliability: 1.0 },
  },
  {
    documentType: 'principle',
    title: 'Depth and Focus in Holographic Content',
    content: `Effective holographic content requires careful depth management:

**Focus Plane**: The zero-parallax plane where content appears at screen depth
- Objects at focus plane: No eye strain, sharpest appearance
- Objects in front: "Pop out" effect, moderate parallax
- Objects behind: "Window" effect into the scene

**Depth Budget**: Recommended depth limits
- Portrait display: ±2cm from focus plane
- Large displays (32"+): ±5-10cm from focus plane
- Exceeding limits causes eye strain and ghosting

**Depthiness Factor**: Multiplier for depth effect (0.5-2.0)
- 1.0 = Natural depth
- <1.0 = Compressed depth (safer, less dramatic)
- >1.0 = Exaggerated depth (more dramatic, risk of artifacts)`,
    domain: 'design',
    tags: ['depth', 'focus', 'content-design'],
    sourceRef: 'pack-lfd-001 §2.2',
    metadata: { reliability: 1.0 },
  },

  // Hardware
  {
    documentType: 'hardware',
    title: 'Looking Glass Portrait Specifications',
    content: `The Looking Glass Portrait is a 7.9" light field display designed for desktop use.

Specifications:
- Screen: 7.9" diagonal, 1536x2048 resolution
- Aspect Ratio: 3:4 (portrait orientation)
- View Count: 45-100 views
- View Cone: ~40 degrees
- Optimal Viewing Distance: 50cm
- Lenticular Pitch: 0.152mm

Best practices:
- Content should be designed for single viewer
- Focus plane at screen center for card/portrait content
- High detail models work well at this size
- Low ambient light improves depth perception`,
    domain: 'hardware',
    tags: ['portrait', 'looking-glass', 'specifications'],
    sourceRef: 'pack-lfd-001 §3.1',
    metadata: { hardwareRelevant: ['portrait'], reliability: 1.0 },
  },
  {
    documentType: 'hardware',
    title: 'Looking Glass 16" and 32" Specifications',
    content: `Mid-size Looking Glass displays for professional and commercial use.

16" Display:
- Resolution: 2560x1440
- View Count: 48-60 views
- View Cone: ~50 degrees
- Optimal Distance: 60cm

32" Display:
- Resolution: 3840x2160
- View Count: 60-100 views
- View Cone: ~53 degrees
- Optimal Distance: 100cm

Best practices:
- Support 2-3 simultaneous viewers
- Wider view cone allows group viewing
- Higher resolution enables more detailed content
- Consider performance impact of increased view count`,
    domain: 'hardware',
    tags: ['lg-16', 'lg-32', 'looking-glass', 'specifications'],
    sourceRef: 'pack-lfd-001 §3.2',
    metadata: { hardwareRelevant: ['lg_16', 'lg_32'], reliability: 1.0 },
  },
  {
    documentType: 'hardware',
    title: 'Looking Glass 65" and 86" Specifications',
    content: `Large-format Looking Glass displays for immersive installations.

65" Display:
- Resolution: 7680x4320 (8K)
- View Count: 100+ views
- View Cone: ~53 degrees
- Optimal Distance: 200cm

86" Display:
- Resolution: 7680x4320 (8K)
- View Count: 100+ views
- View Cone: ~53 degrees
- Optimal Distance: 300cm

Best practices:
- Support 5-10+ simultaneous viewers
- Require high-performance GPU (RTX 3080+)
- Content should be designed for room-scale viewing
- Consider progressive loading for complex scenes`,
    domain: 'hardware',
    tags: ['lg-65', 'lg-86', 'looking-glass', 'large-format'],
    sourceRef: 'pack-lfd-001 §3.3',
    metadata: { hardwareRelevant: ['lg_65', 'lg_86'], reliability: 1.0 },
  },

  // Techniques
  {
    documentType: 'technique',
    title: 'Real-Time Quilt Rendering with Three.js',
    content: `Rendering quilts in real-time using Three.js and WebGL:

1. **Multi-Camera Setup**: Create an array of cameras with offset positions
   - Calculate camera positions along a horizontal arc
   - Each camera renders one view of the quilt

2. **Render Target Array**: Use WebGLArrayRenderTarget for efficiency
   - Single draw call for all views (with instancing)
   - Or sequential rendering to quilt regions

3. **Quilt Composition**: Combine views into final quilt texture
   - Use shader to sample from view array
   - Apply interlacing pattern for display

4. **Performance Tips**:
   - Use lower resolution for dynamic content
   - Cache static views when possible
   - Consider temporal reprojection for motion`,
    domain: 'rendering',
    tags: ['three-js', 'webgl', 'real-time', 'technique'],
    sourceRef: 'pack-lfd-001 §4.1',
    metadata: { reliability: 0.9 },
  },
  {
    documentType: 'technique',
    title: 'Depth-Based Quilt Generation',
    content: `Generating quilts from 2D images with depth maps:

1. **Depth Estimation**: Use ML models (MiDaS, DPT) to estimate depth
   - Higher quality with stereo input
   - Single image depth is approximate

2. **View Synthesis**: Generate novel views using depth
   - Reproject pixels based on depth and view offset
   - Inpaint disoccluded regions (areas revealed from new angle)

3. **Artifact Mitigation**:
   - Use soft depth edges to reduce stretching
   - Apply edge-aware filtering
   - Consider multiple depth layers for complex scenes

4. **Hybrid Approach**: Combine with 3D reconstruction
   - Generate point cloud from depth
   - Render point cloud from multiple angles`,
    domain: 'rendering',
    tags: ['depth', 'view-synthesis', 'ml', 'technique'],
    sourceRef: 'pack-lfd-001 §4.2',
    metadata: { reliability: 0.85 },
  },

  // Optimization
  {
    documentType: 'optimization',
    title: 'GPU Memory Optimization for Quilts',
    content: `Managing GPU memory for light field rendering:

**Memory Requirements** (approximate):
- Portrait (45 views @ 512x680): ~60MB
- 32" (60 views @ 640x360): ~50MB
- 65" (100 views @ 768x432): ~130MB

**Optimization Strategies**:

1. **Texture Compression**: Use KTX2/Basis for 4:1 compression
2. **View Count Reduction**: 32 views acceptable for static content
3. **Resolution Scaling**: Dynamic resolution based on frame rate
4. **Streaming**: Load high-res views progressively

**Quality Presets**:
- Low: 32 views, 0.5x resolution (~15MB)
- Medium: 45 views, 0.75x resolution (~35MB)
- High: 60 views, 1.0x resolution (~60MB)
- Ultra: 100 views, 1.0x resolution (~100MB)`,
    domain: 'performance',
    tags: ['gpu', 'memory', 'optimization'],
    sourceRef: 'pack-lfd-001 §5.1',
    metadata: { reliability: 0.9 },
  },
  {
    documentType: 'optimization',
    title: 'Frame Rate Optimization',
    content: `Maintaining smooth frame rates for holographic content:

**Target Frame Rates**:
- Interactive content: 30+ FPS
- Video playback: 24-30 FPS
- Smooth animation: 60 FPS

**Optimization Techniques**:

1. **Adaptive Quality**: Reduce view count/resolution dynamically
2. **LOD System**: Lower detail models for distant views
3. **Occlusion Culling**: Skip rendering hidden objects
4. **View Caching**: Cache unchanged views between frames
5. **Temporal Reprojection**: Reuse previous frame data

**Benchmarking**:
- Monitor GPU utilization and frame times
- Profile shader complexity per view
- Track texture upload time for dynamic content`,
    domain: 'performance',
    tags: ['framerate', 'fps', 'optimization'],
    sourceRef: 'pack-lfd-001 §5.2',
    metadata: { reliability: 0.9 },
  },

  // Troubleshooting
  {
    documentType: 'troubleshooting',
    title: 'Common Holographic Artifacts and Solutions',
    content: `Diagnosing and fixing common light field display issues:

**Ghosting** (faint duplicate images):
- Cause: Views bleeding into adjacent angles
- Fix: Increase view count, adjust calibration pitch

**Depth Reversal** (objects appear inverted):
- Cause: Incorrect view order in quilt
- Fix: Reverse view arrangement or flip depth values

**Seam Lines** (visible grid in quilt):
- Cause: Misaligned view boundaries
- Fix: Check quilt dimensions match display config

**Eye Strain**:
- Cause: Excessive depth, vergence-accommodation conflict
- Fix: Reduce depthiness factor, keep content near focus plane

**Flickering/Shimmer**:
- Cause: Temporal aliasing between views
- Fix: Apply temporal smoothing, reduce high-frequency detail`,
    domain: 'calibration',
    tags: ['artifacts', 'troubleshooting', 'quality'],
    sourceRef: 'pack-lfd-001 §6.1',
    metadata: { reliability: 0.95 },
  },
  {
    documentType: 'troubleshooting',
    title: 'Display Calibration Issues',
    content: `Resolving calibration problems:

**Incorrect Viewing Sweet Spot**:
- Symptom: 3D effect only visible from wrong position
- Fix: Adjust centerView and viewOffset parameters

**Stretched/Compressed Depth**:
- Symptom: Objects look too flat or too deep
- Fix: Adjust depthFactor in render params

**Color Fringing**:
- Symptom: Rainbow edges on objects
- Fix: Check subpixel layout matches display (RGB vs BGR)

**Calibration Procedure**:
1. Display test pattern with known depths
2. Adjust pitch until ghosting minimized
3. Adjust slope until horizontal lines are straight
4. Adjust center until primary view is centered
5. Verify across viewing zone`,
    domain: 'calibration',
    tags: ['calibration', 'troubleshooting', 'setup'],
    sourceRef: 'pack-lfd-001 §6.2',
    metadata: { reliability: 0.95 },
  },

  // Examples
  {
    documentType: 'example',
    title: 'TCG Card Holographic Showcase',
    content: `Creating holographic TCG card displays:

**Setup**:
- Display: Portrait (ideal for card aspect ratio)
- View Count: 45 views
- Depthiness: 0.8 (subtle depth, comfortable viewing)

**Content Structure**:
- Background: Subtle particle/energy effects at far plane
- Card: Main subject at focus plane
- Effects: Sparkles/auras slightly in front

**Animation**:
- Gentle rotation: ±15 degrees on Y-axis
- Floating effect: ±2mm on Z-axis
- Card flip: Smooth 180-degree rotation

**Performance Target**:
- 30 FPS minimum for smooth parallax
- Preload card assets for instant switching`,
    domain: 'design',
    tags: ['tcg', 'cards', 'example', 'showcase'],
    sourceRef: 'pack-lfd-001 §7.1',
    metadata: { reliability: 0.9 },
  },
  {
    documentType: 'example',
    title: 'Market Dashboard Holographic Visualization',
    content: `Creating holographic market/financial dashboards:

**Setup**:
- Display: 32" or larger for multi-viewer
- View Count: 60 views
- Depthiness: 1.2 (enhanced depth for data separation)

**Content Layers**:
- Background (far): Historical context, legends
- Mid-ground: Main charts, data visualizations
- Foreground: Alerts, key metrics, live data

**3D Chart Types**:
- Layered line charts with depth separation
- 3D bar charts with perspective
- Volume visualization for market depth
- Network graphs with spatial clustering

**Interaction**:
- Gesture-based rotation (with hand tracking)
- Focus-follows-gaze for detail panels
- Time-scrubbing through depth axis`,
    domain: 'design',
    tags: ['dashboard', 'market', 'visualization', 'example'],
    sourceRef: 'pack-lfd-001 §7.2',
    metadata: { reliability: 0.9 },
  },
];

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * Pre-built prompt templates for common light field tasks
 */
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'generate-quilt-config',
    name: 'Generate Quilt Configuration',
    description: 'Generate optimal quilt settings for a given display and content type',
    template: `Given the following parameters:
- Display Model: {{displayModel}}
- Content Type: {{contentType}}
- Target Frame Rate: {{targetFps}} FPS
- GPU Memory Available: {{gpuMemoryMB}} MB

Recommend optimal quilt configuration including:
1. View count
2. View resolution
3. Quality preset
4. Any specific rendering optimizations

Consider the balance between visual quality and performance.`,
    variables: ['displayModel', 'contentType', 'targetFps', 'gpuMemoryMB'],
    category: 'generation',
  },
  {
    id: 'optimize-depth',
    name: 'Optimize Depth Settings',
    description: 'Optimize depth parameters for comfortable viewing',
    template: `Analyze the following 3D scene for holographic display:
- Scene Description: {{sceneDescription}}
- Object Depths: {{objectDepths}}
- Display Size: {{displaySize}}
- Viewing Distance: {{viewingDistance}}

Provide recommendations for:
1. Optimal focus plane position
2. Depthiness factor
3. Near/far clip planes
4. Any content adjustments for comfort`,
    variables: ['sceneDescription', 'objectDepths', 'displaySize', 'viewingDistance'],
    category: 'optimization',
  },
  {
    id: 'troubleshoot-artifact',
    name: 'Troubleshoot Display Artifact',
    description: 'Diagnose and fix holographic display issues',
    template: `User is experiencing the following issue:
- Artifact Description: {{artifactDescription}}
- Display Model: {{displayModel}}
- Current Settings: {{currentSettings}}
- When It Occurs: {{occurrencePattern}}

Diagnose the likely cause and provide step-by-step solution.`,
    variables: ['artifactDescription', 'displayModel', 'currentSettings', 'occurrencePattern'],
    category: 'troubleshooting',
  },
  {
    id: 'explain-concept',
    name: 'Explain Holographic Concept',
    description: 'Explain a light field display concept for the given audience',
    template: `Explain the following concept for {{audience}} audience:
- Concept: {{concept}}
- Context: {{context}}
- Technical Depth: {{technicalDepth}}

Include relevant analogies and practical implications.`,
    variables: ['concept', 'audience', 'context', 'technicalDepth'],
    category: 'explanation',
  },
];

// ============================================================================
// KNOWLEDGE RETRIEVAL
// ============================================================================

/**
 * Initialize knowledge base with core documents
 */
export async function initializeLightFieldKnowledge(): Promise<number> {
  // Check if already initialized
  const [existing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(lightFieldKnowledge)
    .execute();

  if (existing.count > 0) {
    return existing.count;
  }

  // Insert core knowledge
  await db.insert(lightFieldKnowledge).values(CORE_KNOWLEDGE).execute();

  return CORE_KNOWLEDGE.length;
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(query: KnowledgeQuery): Promise<LightFieldKnowledge[]> {
  const { domains, documentTypes, limit = 10 } = query;

  // Build conditions
  const conditions = [];

  if (domains && domains.length > 0) {
    conditions.push(inArray(lightFieldKnowledge.domain, domains));
  }

  if (documentTypes && documentTypes.length > 0) {
    conditions.push(inArray(lightFieldKnowledge.documentType, documentTypes));
  }

  // For now, use simple text search (in production, use vector embeddings)
  const results = await db
    .select()
    .from(lightFieldKnowledge)
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
 * Get knowledge by domain
 */
export async function getKnowledgeByDomain(
  domain: Domain,
  limit: number = 20
): Promise<LightFieldKnowledge[]> {
  return db
    .select()
    .from(lightFieldKnowledge)
    .where(eq(lightFieldKnowledge.domain, domain))
    .limit(limit)
    .execute();
}

/**
 * Get knowledge by document type
 */
export async function getKnowledgeByType(
  documentType: DocumentType,
  limit: number = 20
): Promise<LightFieldKnowledge[]> {
  return db
    .select()
    .from(lightFieldKnowledge)
    .where(eq(lightFieldKnowledge.documentType, documentType))
    .limit(limit)
    .execute();
}

/**
 * Get troubleshooting guides
 */
export async function getTroubleshootingGuides(): Promise<LightFieldKnowledge[]> {
  return db
    .select()
    .from(lightFieldKnowledge)
    .where(eq(lightFieldKnowledge.documentType, 'troubleshooting'))
    .execute();
}

/**
 * Get hardware-specific knowledge
 */
export async function getHardwareKnowledge(
  displayModel: string
): Promise<LightFieldKnowledge[]> {
  // Get general hardware docs and model-specific docs
  const results = await db
    .select()
    .from(lightFieldKnowledge)
    .where(eq(lightFieldKnowledge.domain, 'hardware'))
    .execute();

  // Filter for relevant hardware
  return results.filter((doc) => {
    const hardwareRelevant = doc.metadata?.hardwareRelevant as string[] | undefined;
    return !hardwareRelevant || hardwareRelevant.includes(displayModel);
  });
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
 * Generate context-aware prompt for light field task
 */
export async function generateLightFieldPrompt(
  task: string,
  context: {
    displayModel?: string;
    contentType?: string;
    additionalContext?: string;
  }
): Promise<string> {
  // Search for relevant knowledge
  const relevantDocs = await searchKnowledge({
    query: task,
    limit: 3,
  });

  // Build context section
  const knowledgeContext = relevantDocs
    .map((doc) => `### ${doc.title}\n${doc.content}`)
    .join('\n\n');

  // Build prompt
  return `You are an expert in light field displays and holographic visualization.

## Relevant Knowledge
${knowledgeContext}

## Task Context
- Display: ${context.displayModel ?? 'Not specified'}
- Content Type: ${context.contentType ?? 'General'}
${context.additionalContext ? `- Additional: ${context.additionalContext}` : ''}

## Task
${task}

Provide a detailed, actionable response based on the knowledge above.`;
}
