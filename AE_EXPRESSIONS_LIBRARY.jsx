/*
 * AFTER EFFECTS EXPRESSIONS LIBRARY
 * Apex Intelligence 18-Second Cinematic Trailer
 *
 * Copy-paste these expressions into After Effects text/transform properties
 */

// ============================================
// 1. COUNTER ANIMATION (Portfolio Value)
// ============================================
// Apply to: Text Layer > Source Text property
// Usage: Animates number from startValue to endValue

startValue = 127431;
endValue = 428901;
duration = 2.5; // seconds

if (time < duration) {
  currentVal = Math.floor(linear(time, 0, duration, startValue, endValue));
} else {
  currentVal = endValue;
}

// Format with dollar sign and commas
"$" + currentVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");


// ============================================
// 2. TRIM PATHS - GRAPH DRAW-IN
// ============================================
// Apply to: Shape Layer > Trim Paths > End property
// Usage: Animates line drawing from 0% to 100%

duration = 1.2; // seconds
delay = 0; // optional delay before animation starts

if (time < delay) {
  0;
} else if (time >= delay && time < delay + duration) {
  linear(time, delay, delay + duration, 0, 100);
} else {
  100;
}


// ============================================
// 3. SMOOTH CAMERA ZOOM (Push-In)
// ============================================
// Apply to: Transform > Scale property
// Usage: Slow zoom from 110% to 120% with ease

startScale = 110;
endScale = 120;
duration = 3; // seconds

if (time < duration) {
  ease(time, 0, duration, startScale, endScale);
} else {
  endScale;
}


// ============================================
// 4. SMOOTH CAMERA ZOOM (Pull-Out)
// ============================================
// Apply to: Transform > Scale property
// Usage: Slow zoom from 100% to 95% (reveal effect)

startScale = 100;
endScale = 95;
duration = 4; // seconds

if (time < duration) {
  ease(time, 0, duration, startScale, endScale);
} else {
  endScale;
}


// ============================================
// 5. UPWARD DRIFT ANIMATION
// ============================================
// Apply to: Transform > Position property (Y-axis)
// Usage: Subtle upward floating motion

driftAmount = -20; // pixels (negative = up)
duration = 3; // seconds

originalY = thisComp.layer(thisLayer.index).transform.position.value[1];

if (time < duration) {
  yOffset = ease(time, 0, duration, 0, driftAmount);
} else {
  yOffset = driftAmount;
}

[value[0], originalY + yOffset];


// ============================================
// 6. PULSING GLOW ANIMATION
// ============================================
// Apply to: Effect > Glow > Radius property
// Usage: Creates breathing/pulsing glow effect

minRadius = 30;
maxRadius = 50;
pulseSpeed = 2; // cycles per second

currentRadius = minRadius + (maxRadius - minRadius) * (0.5 + 0.5 * Math.sin(time * pulseSpeed * Math.PI * 2));
currentRadius;


// ============================================
// 7. LETTER-BY-LETTER REVEAL (STAGGER)
// ============================================
// Apply to: Text > Animator > Opacity property
// Usage: Text appears one letter at a time

letterDelay = 0.08; // seconds per letter
startTime = 0; // when animation begins

textIndex; // built-in variable (character index)
revealTime = startTime + (textIndex * letterDelay);

if (time >= revealTime) {
  100; // fully visible
} else {
  0; // hidden
}


// ============================================
// 8. SCALE BOUNCE (ELASTIC ENTRANCE)
// ============================================
// Apply to: Transform > Scale property
// Usage: Element bounces in with overshoot

startTime = 0;
duration = 0.5;
overshoot = 1.15; // 115% at peak
finalScale = 100;

if (time < startTime) {
  0;
} else if (time < startTime + duration) {
  t = (time - startTime) / duration;
  // Elastic ease-out formula
  if (t < 0.5) {
    scale = easeOut(t, 0, 0.5, 0, overshoot * finalScale);
  } else {
    scale = easeOut(t, 0.5, 1, overshoot * finalScale, finalScale);
  }
  scale;
} else {
  finalScale;
}


// ============================================
// 9. RGB SPLIT GLITCH (Channel Offset)
// ============================================
// Apply to: Effect > Channel Blur > Red Blurriness
// Usage: Creates RGB separation glitch effect

glitchStart = 7.0; // seconds
glitchDuration = 0.067; // 4 frames at 60fps

if (time >= glitchStart && time < glitchStart + glitchDuration) {
  5; // Red channel offset (pixels)
} else {
  0;
}

// Blue channel version (use negative value):
// Apply to: Effect > Channel Blur > Blue Blurriness
if (time >= glitchStart && time < glitchStart + glitchDuration) {
  -5; // Blue channel offset (pixels)
} else {
  0;
}


// ============================================
// 10. RANDOM WIGGLE (MICRO SHAKE)
// ============================================
// Apply to: Transform > Position
// Usage: Adds subtle camera shake or jitter

frequency = 20; // wiggles per second
amplitude = 3; // pixels

wiggle(frequency, amplitude);


// ============================================
// 11. PARTICLE BURST (RADIAL EXPLOSION)
// ============================================
// Apply to: Effect > CC Particle World > Birth Rate
// Usage: Creates burst of particles at specific time

burstTime = 10.5; // seconds
burstDuration = 0.5;
particlesPerSecond = 100;

if (time >= burstTime && time < burstTime + burstDuration) {
  particlesPerSecond;
} else {
  0;
}


// ============================================
// 12. 3D ROTATION (360° SPIN)
// ============================================
// Apply to: Transform > Y Rotation
// Usage: Smooth 360-degree rotation for 3D objects

startTime = 10.67; // seconds
duration = 1.3;
rotations = 1; // number of full spins

if (time >= startTime && time < startTime + duration) {
  linear(time, startTime, startTime + duration, 0, 360 * rotations);
} else if (time >= startTime + duration) {
  360 * rotations;
} else {
  0;
}


// ============================================
// 13. FADE IN (OPACITY)
// ============================================
// Apply to: Transform > Opacity
// Usage: Simple fade in from 0% to 100%

fadeStart = 0;
fadeDuration = 0.4; // seconds

if (time < fadeStart) {
  0;
} else if (time < fadeStart + fadeDuration) {
  linear(time, fadeStart, fadeStart + fadeDuration, 0, 100);
} else {
  100;
}


// ============================================
// 14. FADE OUT (OPACITY)
// ============================================
// Apply to: Transform > Opacity
// Usage: Simple fade out from 100% to 0%

fadeStart = 18.0; // seconds
fadeDuration = 0.8;

if (time < fadeStart) {
  100;
} else if (time < fadeStart + fadeDuration) {
  linear(time, fadeStart, fadeStart + fadeDuration, 100, 0);
} else {
  0;
}


// ============================================
// 15. SCAN LINE ANIMATION (Vertical Movement)
// ============================================
// Apply to: Transform > Position > Y property
// Usage: Horizontal line scanning vertically across screen

scanStart = 15.5; // seconds
scanDuration = 0.5;
startY = -100; // top of screen (offscreen)
endY = 700; // bottom of screen (offscreen)

if (time >= scanStart && time < scanStart + scanDuration) {
  linear(time, scanStart, scanStart + scanDuration, startY, endY);
} else if (time < scanStart) {
  startY;
} else {
  endY;
}


// ============================================
// 16. STRIKE-THROUGH LINE DRAW
// ============================================
// Apply to: Shape Layer > Trim Paths > End
// Usage: Draws horizontal line through text (cross-out effect)

strikeStart = 7.0; // seconds
strikeDuration = 0.15;

if (time < strikeStart) {
  0;
} else if (time < strikeStart + strikeDuration) {
  linear(time, strikeStart, strikeStart + strikeDuration, 0, 100);
} else {
  100;
}


// ============================================
// 17. GRADIENT COLOR SHIFT (Animated Gradient)
// ============================================
// Apply to: Fill > Gradient Fill > Colors
// Usage: Animates gradient from white to cyan-purple

// Note: This requires keyframes, but here's the concept:
// Keyframe 1 (0s): White (#FFFFFF)
// Keyframe 2 (1s): Cyan (#00FFFF)
// Keyframe 3 (2s): Purple (#9333EA)


// ============================================
// 18. BREATHING ANIMATION (Subtle Scale Loop)
// ============================================
// Apply to: Transform > Scale
// Usage: Subtle breathing effect for final logo hold

cycleSpeed = 2; // seconds per cycle
scaleMin = 100;
scaleMax = 102;

currentScale = scaleMin + (scaleMax - scaleMin) * (0.5 + 0.5 * Math.sin(time * Math.PI / cycleSpeed));
[currentScale, currentScale];


// ============================================
// 19. TIME REMAP (Slow Motion)
// ============================================
// Apply to: Layer > Time Remapping
// Usage: Slows down footage to 50% speed

linearTime = time;
slowMotionFactor = 0.5; // 0.5 = half speed, 2.0 = double speed

linearTime * slowMotionFactor;


// ============================================
// 20. AUDIO-REACTIVE SCALE (Bass Hit)
// ============================================
// Apply to: Transform > Scale
// Usage: Makes element scale in response to audio amplitude

audioLayer = thisComp.layer("apex_trailer_master_v1.wav"); // name of audio layer
audioDelay = 0; // sync offset in seconds
audioSensitivity = 200; // increase for more reactiveness

audioLevel = audioLayer.audio.audioLevels();
scaleAmount = 100 + (audioLevel[0] + audioLevel[1]) * audioSensitivity;

[scaleAmount, scaleAmount];


// ============================================
// UTILITY FUNCTIONS
// ============================================

// Convert hex color to RGB array
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
    1
  ] : null;
}

// Example usage:
cyanColor = hexToRgb("#00FFFF"); // Returns [0, 1, 1, 1]


// ============================================
// CUSTOM: UMBREON GRAPH Y-AXIS SCALING
// ============================================
// Apply to: Shape Layer Path > Position
// Usage: Maps price data to Y-position on graph

minPrice = 340;
maxPrice = 1180;
graphHeight = 800; // pixels
graphBottom = 1600; // Y-position of bottom of graph

// For each data point, calculate Y position:
function priceToY(price) {
  normalizedPrice = (price - minPrice) / (maxPrice - minPrice);
  yPosition = graphBottom - (normalizedPrice * graphHeight);
  return yPosition;
}

// Example: Point at $890
yPos = priceToY(890);


// ============================================
// NOTES FOR PRODUCTION:
// ============================================
/*
1. All timing values assume 60fps composition
2. Test expressions on precomp before applying to master
3. Use markers on timeline to sync with audio hits
4. Enable Motion Blur on fast-moving elements
5. Render test frames at key moments (0:08, 0:16, 0:18)
6. Use expression controls for easy parameter tweaking
7. Apply "posterizeTime(12)" for intentional frame-skip effects
8. Use "ease()" instead of "linear()" for smoother motion
9. Parent animated layers to null objects for easier control
10. Save project incrementally (v1, v2, v3...)
*/

// END OF EXPRESSIONS LIBRARY
