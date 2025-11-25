/**
 * WebXR Domain Pack
 *
 * Implements pack-webxr-001 §3.1 (WebXR Domain Pack).
 * Provides WebXR knowledge, patterns, and guidance for RAG.
 *
 * Features:
 * - WebXR API documentation
 * - Cross-platform patterns
 * - Performance optimization guides
 * - Troubleshooting knowledge
 *
 * @see pack-webxr-001 for domain mapping
 */

import { db } from '@/lib/db';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { webxrKnowledge, type WebxrKnowledge } from '@/db/schema/webxr';

// ============================================================================
// TYPES
// ============================================================================

export type DocumentType =
  | 'concept'
  | 'api'
  | 'tutorial'
  | 'pattern'
  | 'troubleshooting'
  | 'optimization'
  | 'compatibility'
  | 'best_practice';

export type Category =
  | 'fundamentals'
  | 'session_management'
  | 'rendering'
  | 'input'
  | 'spatial'
  | 'performance'
  | 'cross_platform'
  | 'ar_specific'
  | 'vr_specific';

export interface KnowledgeQuery {
  query: string;
  categories?: Category[];
  documentTypes?: DocumentType[];
  limit?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'development' | 'troubleshooting' | 'optimization' | 'learning';
}

// ============================================================================
// CORE KNOWLEDGE BASE
// ============================================================================

/**
 * Foundational WebXR knowledge documents
 */
export const CORE_KNOWLEDGE: Array<Omit<WebxrKnowledge, 'id' | 'createdAt' | 'updatedAt'>> = [
  // Fundamentals
  {
    documentType: 'concept',
    title: 'WebXR API Overview',
    content: `WebXR is a W3C standard API for creating immersive VR and AR experiences in web browsers.

**Key Concepts:**

1. **XR Session**: The core interface for XR experiences
   - \`immersive-vr\`: Full VR headset takeover
   - \`immersive-ar\`: AR with camera passthrough
   - \`inline\`: Non-immersive, within page

2. **Reference Spaces**: Define coordinate systems
   - \`viewer\`: Head-locked content
   - \`local\`: Seated experience
   - \`local-floor\`: Standing, floor-relative
   - \`bounded-floor\`: Room-scale with boundaries
   - \`unbounded\`: Large-scale AR tracking

3. **XR Frame**: Per-frame rendering data
   - Viewer pose (position + orientation)
   - View matrices for each eye
   - Projection matrices

4. **Input Sources**: Controllers, hands, gaze
   - Gamepad API for buttons/axes
   - Hand tracking for finger poses
   - Gaze/eye tracking

**Browser Support:**
- Chrome/Edge: Full WebXR support
- Firefox: WebXR support
- Safari: WebXR on Vision Pro (visionOS 2+)
- Mobile: Chrome Android, WebXR Viewer iOS

**Security Requirements:**
- HTTPS required (secure context)
- User gesture required to start session
- Permissions for camera/sensors`,
    category: 'fundamentals',
    topics: ['api', 'overview', 'sessions'],
    tags: ['webxr', 'api', 'fundamentals'],
    sourceRef: 'pack-webxr-001 §1',
    relatedApis: ['XRSystem', 'XRSession', 'XRFrame', 'XRReferenceSpace'],
    deviceCompatibility: {
      quest: true,
      visionPro: true,
      mobileAR: true,
      desktopVR: true,
    },
    metadata: { reliability: 1.0 },
  },

  // Session Management
  {
    documentType: 'api',
    title: 'Starting an XR Session',
    content: `Guide to requesting and managing WebXR sessions.

**Checking Support:**
\`\`\`javascript
if (navigator.xr) {
  const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
  const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
}
\`\`\`

**Requesting Session:**
\`\`\`javascript
const session = await navigator.xr.requestSession('immersive-vr', {
  requiredFeatures: ['local-floor'],
  optionalFeatures: ['hand-tracking', 'bounded-floor']
});
\`\`\`

**Session Lifecycle:**
1. Request session (user gesture required)
2. Set up render loop with \`setAnimationLoop\`
3. Handle \`end\` event for cleanup
4. Call \`session.end()\` when done

**Error Handling:**
- \`NotSupportedError\`: Feature not available
- \`SecurityError\`: Not secure context
- \`InvalidStateError\`: Session already active

**Best Practices:**
- Always check support before requesting
- Handle session end gracefully
- Store session state for restoration
- Test with emulators before hardware`,
    category: 'session_management',
    topics: ['sessions', 'initialization', 'lifecycle'],
    tags: ['session', 'api', 'setup'],
    sourceRef: 'pack-webxr-001 §2',
    codeExamples: [
      {
        language: 'typescript',
        code: `async function startXR(renderer: THREE.WebGLRenderer) {
  if (!navigator.xr) throw new Error('WebXR not supported');

  const supported = await navigator.xr.isSessionSupported('immersive-vr');
  if (!supported) throw new Error('VR not supported');

  const session = await navigator.xr.requestSession('immersive-vr', {
    requiredFeatures: ['local-floor'],
    optionalFeatures: ['hand-tracking']
  });

  renderer.xr.setSession(session);

  session.addEventListener('end', () => {
    console.log('XR session ended');
  });

  return session;
}`,
        description: 'Basic XR session initialization with Three.js',
      },
    ],
    relatedApis: ['XRSystem.requestSession', 'XRSession'],
    metadata: { reliability: 1.0 },
  },

  // Rendering
  {
    documentType: 'pattern',
    title: 'WebXR Rendering with Three.js',
    content: `Patterns for rendering WebXR scenes with Three.js.

**Setup:**
\`\`\`javascript
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.xr.enabled = true;
renderer.setAnimationLoop(render);
\`\`\`

**VR Button:**
\`\`\`javascript
import { VRButton } from 'three/addons/webxr/VRButton.js';
document.body.appendChild(VRButton.createButton(renderer));
\`\`\`

**AR Button:**
\`\`\`javascript
import { ARButton } from 'three/addons/webxr/ARButton.js';
document.body.appendChild(ARButton.createButton(renderer, {
  requiredFeatures: ['hit-test']
}));
\`\`\`

**Render Loop:**
\`\`\`javascript
function render(time, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const pose = frame.getViewerPose(referenceSpace);
    // Use pose for rendering
  }
  renderer.render(scene, camera);
}
\`\`\`

**Stereo Rendering:**
- Three.js handles stereo automatically
- Use \`renderer.xr.getCamera()\` for XR camera
- Set correct IPD in device settings

**Performance Tips:**
- Use instanced meshes for repeated objects
- Implement LOD for complex models
- Keep draw calls under 100 for mobile VR
- Target 72+ FPS for comfort`,
    category: 'rendering',
    topics: ['threejs', 'rendering', 'stereo'],
    tags: ['rendering', 'threejs', 'stereo'],
    sourceRef: 'pack-webxr-001 §3',
    codeExamples: [
      {
        language: 'typescript',
        code: `import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

renderer.setAnimationLoop((time, frame) => {
  renderer.render(scene, camera);
});`,
        description: 'Complete Three.js WebXR setup',
      },
    ],
    relatedLibraries: ['three', 'three/addons/webxr'],
    metadata: { reliability: 1.0 },
  },

  // Input
  {
    documentType: 'tutorial',
    title: 'WebXR Input Handling',
    content: `Comprehensive guide to handling XR input devices.

**Controller Input:**
\`\`\`javascript
session.addEventListener('inputsourceschange', (event) => {
  event.added.forEach(source => {
    console.log('Input added:', source.targetRayMode);
  });
});

// In render loop
for (const source of session.inputSources) {
  const gamepad = source.gamepad;
  if (gamepad) {
    const trigger = gamepad.buttons[0].value; // 0-1
    const grip = gamepad.buttons[1].value;
    const thumbstick = [gamepad.axes[2], gamepad.axes[3]];
  }
}
\`\`\`

**Hand Tracking:**
\`\`\`javascript
const session = await navigator.xr.requestSession('immersive-vr', {
  optionalFeatures: ['hand-tracking']
});

// In render loop
for (const source of session.inputSources) {
  if (source.hand) {
    for (const joint of source.hand.values()) {
      const pose = frame.getJointPose(joint, referenceSpace);
      // Use joint.jointName and pose
    }
  }
}
\`\`\`

**Target Ray Modes:**
- \`gaze\`: Eye/head gaze direction
- \`tracked-pointer\`: Controller ray
- \`screen\`: Touch screen tap

**Common Gestures:**
- Pinch: Thumb tip near index tip
- Grab: All fingers curled
- Point: Index extended, others curled
- Open palm: All fingers extended

**Three.js Integration:**
\`\`\`javascript
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

const controller = renderer.xr.getController(0);
scene.add(controller);

const controllerGrip = renderer.xr.getControllerGrip(0);
const factory = new XRControllerModelFactory();
controllerGrip.add(factory.createControllerModel(controllerGrip));
scene.add(controllerGrip);
\`\`\``,
    category: 'input',
    topics: ['controllers', 'hand-tracking', 'gestures'],
    tags: ['input', 'controllers', 'hands'],
    sourceRef: 'pack-webxr-001 §4',
    relatedApis: ['XRInputSource', 'XRHand', 'Gamepad'],
    metadata: { reliability: 0.95 },
  },

  // AR Features
  {
    documentType: 'tutorial',
    title: 'WebXR AR Features',
    content: `Guide to AR-specific WebXR features.

**Hit Testing:**
\`\`\`javascript
const session = await navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: ['hit-test']
});

const hitTestSource = await session.requestHitTestSource({
  space: viewerSpace
});

// In render loop
const results = frame.getHitTestResults(hitTestSource);
if (results.length > 0) {
  const pose = results[0].getPose(referenceSpace);
  // Place object at pose.transform
}
\`\`\`

**Plane Detection:**
\`\`\`javascript
const session = await navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: ['plane-detection']
});

// In render loop
const planes = frame.detectedPlanes;
planes.forEach(plane => {
  const pose = frame.getPose(plane.planeSpace, referenceSpace);
  const polygon = plane.polygon; // Array of DOMPointReadOnly
});
\`\`\`

**Anchors:**
\`\`\`javascript
const anchor = await frame.createAnchor(pose, referenceSpace);

// Later, get anchor pose
const anchorPose = frame.getPose(anchor.anchorSpace, referenceSpace);
\`\`\`

**Light Estimation:**
\`\`\`javascript
const lightProbe = await session.requestLightProbe();
const lighting = frame.getLightEstimate(lightProbe);
// Use lighting.sphericalHarmonicsCoefficients
\`\`\`

**Depth Sensing:**
\`\`\`javascript
const session = await navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: ['depth-sensing'],
  depthSensing: {
    usagePreference: ['cpu-optimized'],
    dataFormatPreference: ['luminance-alpha']
  }
});
\`\`\``,
    category: 'ar_specific',
    topics: ['ar', 'hit-test', 'planes', 'anchors'],
    tags: ['ar', 'augmented-reality', 'spatial'],
    sourceRef: 'pack-webxr-001 §5',
    relatedApis: ['XRHitTestSource', 'XRPlane', 'XRAnchor', 'XRLightProbe'],
    deviceCompatibility: {
      quest: true,
      visionPro: true,
      mobileAR: true,
      desktopVR: false,
    },
    metadata: { reliability: 0.9 },
  },

  // Performance
  {
    documentType: 'optimization',
    title: 'WebXR Performance Optimization',
    content: `Best practices for optimal XR performance.

**Target Metrics:**
- Quest 2/3: 72-120 FPS
- Vision Pro: 90-100 FPS
- Mobile AR: 60 FPS
- Frame time budget: ~11-14ms

**Rendering Optimizations:**

1. **Reduce Draw Calls**
   - Use instanced rendering
   - Merge static meshes
   - Texture atlases
   - Target: <100 for mobile VR

2. **Triangle Budget**
   - Quest 2: ~750K triangles
   - Quest 3: ~1.5M triangles
   - Vision Pro: ~3M triangles

3. **LOD (Level of Detail)**
   - Multiple mesh resolutions
   - Distance-based switching
   - Use LODGroup in Three.js

4. **Frustum Culling**
   - Automatic in Three.js
   - Use bounding spheres
   - Spatial partitioning (octree)

5. **Shadows**
   - Baked lightmaps preferred
   - Single shadow-casting light
   - Lower shadow map resolution

**Memory Management:**
- Dispose unused geometries/textures
- Use compressed textures (KTX2/Basis)
- Limit texture sizes (2K for mobile)
- Pool frequently created objects

**Monitoring:**
\`\`\`javascript
// Request timing info
const timing = frame.session.renderState.inlineVerticalFieldOfView;

// Use renderer.info
console.log(renderer.info.render.calls);
console.log(renderer.info.render.triangles);
\`\`\`

**Testing Tools:**
- Chrome DevTools XR panel
- Quest performance overlay
- Meta XR Performance Profiler`,
    category: 'performance',
    topics: ['optimization', 'fps', 'rendering'],
    tags: ['performance', 'optimization', 'fps'],
    sourceRef: 'pack-webxr-001 §6',
    metadata: { reliability: 0.95 },
  },

  // Cross-Platform
  {
    documentType: 'best_practice',
    title: 'Cross-Platform WebXR Development',
    content: `Strategies for building XR experiences across devices.

**Progressive Enhancement:**
1. Start with inline (2D) fallback
2. Add VR support for headsets
3. Add AR support where available
4. Graceful degradation for unsupported features

**Feature Detection:**
\`\`\`javascript
async function detectCapabilities() {
  const caps = {
    vr: false, ar: false, handTracking: false
  };

  if (navigator.xr) {
    caps.vr = await navigator.xr.isSessionSupported('immersive-vr');
    caps.ar = await navigator.xr.isSessionSupported('immersive-ar');
  }

  return caps;
}
\`\`\`

**Adaptive Quality:**
- Detect device type from user agent
- Load device-appropriate assets
- Adjust render settings dynamically
- Use performance profiling

**Input Abstraction:**
\`\`\`javascript
interface XRInput {
  select(): boolean;
  grab(): boolean;
  getRay(): Ray;
  getPosition(): Vector3;
}

// Implement for controllers, hands, gaze
\`\`\`

**Asset Pipeline:**
- glTF/GLB for 3D models
- Multiple LOD levels
- Compressed textures (KTX2)
- Draco mesh compression

**Testing Matrix:**
| Device | Session | Features |
|--------|---------|----------|
| Quest 2 | VR | Controllers, Hands |
| Quest 3 | VR/AR | Controllers, Hands, Passthrough |
| Vision Pro | VR | Hands, Eye Tracking |
| Mobile | AR | Touch, Hit Test |
| Desktop | Inline | Mouse, Keyboard |

**Polyfills:**
- WebXR Polyfill for older browsers
- WebXR Emulator extension for development`,
    category: 'cross_platform',
    topics: ['cross-platform', 'compatibility', 'progressive'],
    tags: ['cross-platform', 'compatibility', 'devices'],
    sourceRef: 'pack-webxr-001 §7',
    deviceCompatibility: {
      quest: true,
      visionPro: true,
      mobileAR: true,
      desktopVR: true,
      browser: ['Chrome', 'Firefox', 'Edge', 'Safari'],
    },
    metadata: { reliability: 0.95 },
  },

  // Troubleshooting
  {
    documentType: 'troubleshooting',
    title: 'Common WebXR Issues and Solutions',
    content: `Troubleshooting guide for WebXR development.

**"WebXR not available"**
- *Cause*: Browser doesn't support WebXR
- *Fix*: Use Chrome 79+, Firefox 98+, or Safari 17+
- *Workaround*: WebXR Polyfill

**"Session request failed"**
- *Cause*: No user gesture, already active session
- *Fix*: Request from click/tap handler
- *Fix*: End existing session first

**"Feature not supported"**
- *Cause*: Device doesn't support requested feature
- *Fix*: Use optional features instead of required
- *Fix*: Check support before requesting

**Controller not detected**
- *Cause*: Controllers not paired/tracking lost
- *Fix*: Re-pair controllers in device settings
- *Fix*: Check inputsourceschange events

**Hand tracking not working**
- *Cause*: Feature not requested, device limitation
- *Fix*: Add 'hand-tracking' to optionalFeatures
- *Fix*: Ensure good lighting for hand tracking

**Performance issues / low FPS**
- *Cause*: Too many draw calls, high poly count
- *Fix*: Profile with renderer.info
- *Fix*: Implement LOD, reduce shadows
- *Fix*: Use compressed textures

**AR hit test fails**
- *Cause*: No surfaces detected, bad lighting
- *Fix*: Wait for plane detection
- *Fix*: Ensure good lighting and textured surfaces

**Black screen in VR**
- *Cause*: Camera inside object, render error
- *Fix*: Check camera position
- *Fix*: Check console for WebGL errors

**Jittery tracking**
- *Cause*: Low FPS, tracking issues
- *Fix*: Optimize scene for consistent frame rate
- *Fix*: Check device tracking environment

**CORS errors loading assets**
- *Cause*: Cross-origin resource blocking
- *Fix*: Configure CORS headers on server
- *Fix*: Use same-origin assets or proxy`,
    category: 'fundamentals',
    topics: ['troubleshooting', 'debugging', 'errors'],
    tags: ['troubleshooting', 'debugging', 'errors'],
    sourceRef: 'pack-webxr-001 §8',
    metadata: { reliability: 0.95 },
  },
];

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'xr-scene-setup',
    name: 'XR Scene Setup',
    description: 'Generate code for setting up a WebXR scene',
    template: `Create a WebXR scene with the following requirements:

**Scene Type:**
{{sceneType}}

**Target Devices:**
{{targetDevices}}

**Features Needed:**
{{features}}

**3D Library:**
{{library}}

Provide:
1. Complete setup code
2. Session configuration
3. Input handling
4. Performance considerations`,
    variables: ['sceneType', 'targetDevices', 'features', 'library'],
    category: 'development',
  },
  {
    id: 'xr-troubleshoot',
    name: 'Troubleshoot XR Issue',
    description: 'Diagnose and fix WebXR problems',
    template: `Troubleshoot this WebXR issue:

**Problem Description:**
{{problemDescription}}

**Error Message (if any):**
{{errorMessage}}

**Device/Browser:**
{{deviceBrowser}}

**Code Context:**
{{codeContext}}

Diagnose the issue and provide solutions.`,
    variables: ['problemDescription', 'errorMessage', 'deviceBrowser', 'codeContext'],
    category: 'troubleshooting',
  },
  {
    id: 'xr-optimize',
    name: 'Optimize XR Performance',
    description: 'Get performance optimization recommendations',
    template: `Optimize this WebXR scene for better performance:

**Current Metrics:**
- FPS: {{currentFps}}
- Draw Calls: {{drawCalls}}
- Triangles: {{triangleCount}}

**Target Device:**
{{targetDevice}}

**Scene Description:**
{{sceneDescription}}

Provide specific optimization recommendations.`,
    variables: ['currentFps', 'drawCalls', 'triangleCount', 'targetDevice', 'sceneDescription'],
    category: 'optimization',
  },
  {
    id: 'xr-concept',
    name: 'Explain XR Concept',
    description: 'Get explanation of WebXR concepts',
    template: `Explain the following WebXR concept:

**Concept:**
{{concept}}

**Context:**
{{context}}

**Experience Level:**
{{experienceLevel}}

Provide a clear explanation with code examples.`,
    variables: ['concept', 'context', 'experienceLevel'],
    category: 'learning',
  },
];

// ============================================================================
// KNOWLEDGE RETRIEVAL
// ============================================================================

/**
 * Initialize knowledge base with core documents
 */
export async function initializeWebxrKnowledge(): Promise<number> {
  const [existing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(webxrKnowledge)
    .execute();

  if (existing.count > 0) {
    return existing.count;
  }

  await db.insert(webxrKnowledge).values(CORE_KNOWLEDGE).execute();

  return CORE_KNOWLEDGE.length;
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(query: KnowledgeQuery): Promise<WebxrKnowledge[]> {
  const { categories, documentTypes, limit = 10 } = query;

  const conditions = [];

  if (categories && categories.length > 0) {
    conditions.push(inArray(webxrKnowledge.category, categories));
  }

  if (documentTypes && documentTypes.length > 0) {
    conditions.push(inArray(webxrKnowledge.documentType, documentTypes));
  }

  const results = await db
    .select()
    .from(webxrKnowledge)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .execute();

  // Simple keyword scoring
  const queryWords = query.query.toLowerCase().split(/\s+/);
  const scored = results.map((doc) => {
    const text = `${doc.title} ${doc.content}`.toLowerCase();
    const score = queryWords.reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0);
    return { doc, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.doc);
}

/**
 * Get knowledge by category
 */
export async function getKnowledgeByCategory(
  category: Category,
  limit: number = 20
): Promise<WebxrKnowledge[]> {
  return db
    .select()
    .from(webxrKnowledge)
    .where(eq(webxrKnowledge.category, category))
    .limit(limit)
    .execute();
}

/**
 * Get knowledge by document type
 */
export async function getKnowledgeByType(
  documentType: DocumentType,
  limit: number = 20
): Promise<WebxrKnowledge[]> {
  return db
    .select()
    .from(webxrKnowledge)
    .where(eq(webxrKnowledge.documentType, documentType))
    .limit(limit)
    .execute();
}

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
 * Generate context-aware prompt for WebXR task
 */
export async function generateWebxrPrompt(
  task: string,
  context: {
    category?: Category;
    deviceType?: string;
    library?: string;
    additionalContext?: string;
  }
): Promise<string> {
  const relevantDocs = await searchKnowledge({
    query: task,
    categories: context.category ? [context.category] : undefined,
    limit: 3,
  });

  const knowledgeContext = relevantDocs
    .map((doc) => `### ${doc.title}\n${doc.content.slice(0, 500)}...`)
    .join('\n\n');

  return `You are an expert in WebXR development and immersive web experiences.

## Relevant Knowledge
${knowledgeContext}

## Task Context
- Category: ${context.category ?? 'General'}
- Target Device: ${context.deviceType ?? 'Cross-platform'}
- Library: ${context.library ?? 'Three.js'}
${context.additionalContext ? `- Additional: ${context.additionalContext}` : ''}

## Task
${task}

Provide a detailed, actionable response with code examples where applicable.`;
}
