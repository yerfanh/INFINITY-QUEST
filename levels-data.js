// INFINITY QUEST - Levels Architecture & Data Engine
// Created by Yerfan Hridoy
// Contains 100 curated levels + deterministic infinite level generator

export function createPRNG(seed) {
  let s = Math.abs(Math.floor(seed)) || 1;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// 100 Distinct Curated Levels
export const LEVELS_DATA = [
  // 1-10: Gentle Onboarding & Fundamentals
  { id: 1, name: "FIRST CONTACT", type: "tapTarget", timeLimit: 12, objective: "Tap the Energy Sphere", instructions: "Tap the glowing central orb to activate the matrix.", controlHint: "TAP", isBoss: false, config: { count: 1, moving: false, size: 55 } },
  { id: 2, name: "TRIPLE SEQUENCE", type: "sequence", timeLimit: 12, objective: "Tap in Order: 1, 2, 3", instructions: "Tap the numbered energy nodes in ascending sequence.", controlHint: "TAP SEQUENCE", isBoss: false, config: { count: 3 } },
  { id: 3, name: "AVOID HAZARD", type: "avoidMoving", timeLimit: 14, objective: "Reach the Portal", instructions: "Drag your orb past the red patrol drone into the cyan portal.", controlHint: "DRAG", isBoss: false, config: { drones: 1, droneSpeed: 1.6 } },
  { id: 4, name: "GREEN ZONE", type: "greenZone", timeLimit: 10, objective: "Tap Inside Green Zone", instructions: "Watch the oscillating needle and tap when it enters the green safe arc.", controlHint: "TIMING TAP", isBoss: false, config: { zoneWidth: 0.32, speed: 2.2 } },
  { id: 5, name: "PORTAL CHOICE", type: "doors", timeLimit: 10, objective: "Choose the Cyan Portal", instructions: "Pick the portal glowing with pure cyan light.", controlHint: "TAP DOOR", isBoss: false, config: { doors: 3, correctIndex: 1, hint: "Match the top crystal color" } },
  { id: 6, name: "LIGHT MEMORY", type: "simonMemory", timeLimit: 15, objective: "Repeat the 3-Light Sequence", instructions: "Watch the pads flash and repeat their exact order.", controlHint: "MEMORY", isBoss: false, config: { steps: 3, padCount: 4, flashSpeed: 450 } },
  { id: 7, name: "LANE RUNNER", type: "dodgeLane", timeLimit: 12, objective: "Survive 5 Wave Obstacles", instructions: "Swipe left and right to dodge the incoming energy blocks.", controlHint: "SWIPE", isBoss: false, config: { waves: 5, speed: 2.2 } },
  { id: 8, name: "ODD ONE OUT", type: "oddOneOut", timeLimit: 10, objective: "Find the Different Node", instructions: "One shape among the grid has a different color or orientation. Tap it!", controlHint: "OBSERVE", isBoss: false, config: { gridSize: 3, diffType: "color" } },
  { id: 9, name: "PRECISION HOLD", type: "holdRelease", timeLimit: 10, objective: "Hold for Exactly 2.0s", instructions: "Press and hold the button, releasing when the meter reaches the target mark.", controlHint: "HOLD & RELEASE", isBoss: false, config: { targetTime: 2.0, tolerance: 0.35 } },
  { id: 10, name: "NEON GUARDIAN", type: "bossReaction", timeLimit: 16, objective: "Deflect Boss Laser (3x)", instructions: "BOSS ALERT! When 'DEFLECT!' flashes on screen, tap immediately within the reaction window!", controlHint: "FAST REACTION", isBoss: true, config: { strikes: 3, windowMs: 750, bossName: "Neon Guardian" } },

  // 11-20: Reaction, Catching, Precision & Memory
  { id: 11, name: "STAR CATCHER", type: "catchFalling", timeLimit: 15, objective: "Catch 5 Golden Stars", instructions: "Slide the catcher paddle to collect 5 falling stars. Avoid red skulls!", controlHint: "DRAG PADDLE", isBoss: false, config: { targetStars: 5, hazardCount: 2, fallSpeed: 2.0 } },
  { id: 12, name: "METEOR DODGE", type: "avoidFalling", timeLimit: 12, objective: "Survive Falling Meteors", instructions: "Drag your vessel to dodge falling fireballs until the timer expires.", controlHint: "DRAG TO DODGE", isBoss: false, config: { spawnRate: 350, speed: 2.5 } },
  { id: 13, name: "NEON WIRE", type: "followPath", timeLimit: 14, objective: "Follow the Track to Exit", instructions: "Drag your spark along the curved glowing pipe without leaving the lane.", controlHint: "TRACE PATH", isBoss: false, config: { pathWidth: 42, points: 4 } },
  { id: 14, name: "BLUE FILTER", type: "colorFilter", timeLimit: 12, objective: "Tap ONLY Blue Orbs", instructions: "Tap all blue orbs. Do NOT tap any red orbs!", controlHint: "SELECTIVE TAP", isBoss: false, config: { targetColor: "blue", blueCount: 4, redCount: 3 } },
  { id: 15, name: "PAIR MATRIX", type: "memoryPairs", timeLimit: 16, objective: "Match 2 Pairs of Cards", instructions: "Flip the 4 hidden tiles and find the matching symbols.", controlHint: "CARD FLIP", isBoss: false, config: { pairs: 2 } },
  { id: 16, name: "MOVING BRIDGE", type: "movingBridge", timeLimit: 12, objective: "Lock Bridge in Center", instructions: "Tap when the sliding bridge aligns with the walkway to cross safely.", controlHint: "TIMING TAP", isBoss: false, config: { bridgeSpeed: 2.5, tolerance: 35 } },
  { id: 17, name: "SAFE DIAL", type: "safeLock", timeLimit: 12, objective: "Stop Needle in Safe Zone", instructions: "Tap to stop the rotating lock needle within the highlighted zone.", controlHint: "TIMING TAP", isBoss: false, config: { needleSpeed: 2.6, arcSize: 0.28 } },
  { id: 18, name: "MINI LABYRINTH", type: "miniMaze", timeLimit: 16, objective: "Guide Orb through Maze", instructions: "Drag your orb from Start (S) to Finish (F) without touching neon walls.", controlHint: "DRAG", isBoss: false, config: { complexity: 1 } },
  { id: 19, name: "TWIN SYMBOLS", type: "symbolMatch", timeLimit: 12, objective: "Tap When Symbols Match", instructions: "Two holographic symbols cycle. Tap the MATCH button the moment they become identical.", controlHint: "FAST MATCH", isBoss: false, config: { cycleSpeed: 800, targetMatches: 2 } },
  { id: 20, name: "CYBER CORE", type: "simonMemory", timeLimit: 18, objective: "Decode 4-Step Memory Code", instructions: "BOSS ALERT! Remember the 4-phase power sequence of the Cyber Core.", controlHint: "MEMORY BOSS", isBoss: true, config: { steps: 4, padCount: 4, flashSpeed: 380, bossName: "Cyber Core" } },

  // 21-30: Kinetic & Gravity Challenges
  { id: 21, name: "RAPID OVERCHARGE", type: "rapidTap", timeLimit: 8, objective: "Rapidly Tap to 100%", instructions: "Hammer the charging button to fill the energy gauge before time expires!", controlHint: "RAPID TAP", isBoss: false, config: { requiredTaps: 22, decayRate: 1.8 } },
  { id: 22, name: "GRAVITY RUNNER", type: "gravityFlip", timeLimit: 14, objective: "Survive with Gravity Flips", instructions: "Your orb dashes forward. Tap anywhere to flip gravity between floor and ceiling.", controlHint: "TAP TO FLIP", isBoss: false, config: { obstacleCount: 4, speed: 2.2 } },
  { id: 23, name: "DARK EXPLORER", type: "darkness", timeLimit: 16, objective: "Find the Hidden Core", instructions: "Move your spotlight in the darkness to locate and collect the glowing crystal.", controlHint: "DRAG TORCH", isBoss: false, config: { radius: 65, goalDist: 0.7 } },
  { id: 24, name: "MIRROR INVERSION", type: "avoidMoving", timeLimit: 14, objective: "Reach Portal (Inverted X)", instructions: "Controls are mirrored horizontally! Move left to go right.", controlHint: "INVERTED CONTROLS", isBoss: false, config: { drones: 1, droneSpeed: 1.8, invertX: true } },
  { id: 25, name: "CONSTELLATION", type: "sequence", timeLimit: 12, objective: "Connect Stars 1 to 4", instructions: "Connect the constellation stars in numeric sequence.", controlHint: "TAP SEQUENCE", isBoss: false, config: { count: 4, geometric: true } },
  { id: 26, name: "GYRO BALANCE", type: "sliderBalance", timeLimit: 10, objective: "Keep Marker Centered (4s)", instructions: "Drag slider left/right to keep the floating balance bubble in the green zone.", controlHint: "DRAG SLIDER", isBoss: false, config: { holdTime: 4.0, driftSpeed: 2.2 } },
  { id: 27, name: "TARGET EXPANSION", type: "greenZone", timeLimit: 10, objective: "Tap at Maximum Pulse", instructions: "Tap the pulsing orb precisely when its expansion ring reaches the outer border.", controlHint: "TIMING TAP", isBoss: false, config: { zoneWidth: 0.25, speed: 2.8 } },
  { id: 28, name: "HOLO SMASH", type: "tapTarget", timeLimit: 10, objective: "Smash 4 Moving Targets", instructions: "Targets bounce across screen! Tap each one before time runs out.", controlHint: "MOVING TAP", isBoss: false, config: { count: 4, moving: true, speed: 2.0 } },
  { id: 29, name: "SPEED CIPHER", type: "doors", timeLimit: 8, objective: "Pick Result: 7 + 5", instructions: "Quick mental calculation! Tap the portal displaying the correct answer.", controlHint: "MATH TAP", isBoss: false, config: { doors: 3, mathQuestion: "7 + 5 = ?", answers: [11, 12, 13], correctIndex: 1 } },
  { id: 30, name: "QUANTUM OVERDRIVE", type: "dodgeLane", timeLimit: 15, objective: "Survive High-Speed Lasers", instructions: "BOSS ALERT! Quantum lasers barrage all 3 lanes at accelerated speeds. Dodge them!", controlHint: "FAST SWIPE", isBoss: true, config: { waves: 8, speed: 3.2, bossName: "Quantum Overdrive" } },

  // 31-40: Advanced Precision & Mini Bosses
  { id: 31, name: "ORBITAL LAUNCH", type: "orbitJump", timeLimit: 12, objective: "Launch to Outer Core", instructions: "You are orbiting a pulsar. Tap to launch outward and land in the docking zone.", controlHint: "TIMING TAP", isBoss: false, config: { orbitSpeed: 2.5, targetSize: 0.3 } },
  { id: 32, name: "COUNTDOWN SYNC", type: "greenZone", timeLimit: 8, objective: "Tap at Exactly 0.0s", instructions: "Sync your tap with the digital countdown right when it reaches zero.", controlHint: "TIMING TAP", isBoss: false, config: { zoneWidth: 0.2, speed: 2.5 } },
  { id: 33, name: "COLOR SHIFT", type: "colorFilter", timeLimit: 12, objective: "Tap Yellow Triangles", instructions: "Identify and tap yellow triangles only. Avoid green squares!", controlHint: "SELECTIVE TAP", isBoss: false, config: { targetColor: "yellow", targetShape: "triangle", targetCount: 4, decoyCount: 4 } },
  { id: 34, name: "SCALE SEQUENCE", type: "tapTarget", timeLimit: 12, objective: "Tap Smallest to Largest", instructions: "Examine the 4 circles and tap them in order from smallest to biggest.", controlHint: "SIZE SEQUENCE", isBoss: false, config: { count: 4, sizeOrder: true } },
  { id: 35, name: "TWIN LOCKS", type: "safeLock", timeLimit: 14, objective: "Crack Dual Safe Dials", instructions: "Two rotating dials! Tap each dial when its needle is inside the safe arc.", controlHint: "DUAL TIMING", isBoss: false, config: { needles: 2, needleSpeed: 2.2, arcSize: 0.3 } },
  { id: 36, name: "LANE SWARM", type: "dodgeLane", timeLimit: 12, objective: "Evade 6 Rapid Hazards", instructions: "Quickly swipe left/right across 3 tracks to avoid consecutive barriers.", controlHint: "SWIPE DODGE", isBoss: false, config: { waves: 6, speed: 2.6 } },
  { id: 37, name: "SHADOW SEARCH", type: "darkness", timeLimit: 15, objective: "Find 2 Hidden Relics", instructions: "Search the darkness to find two illuminated energy shards.", controlHint: "DRAG TORCH", isBoss: false, config: { radius: 60, goals: 2 } },
  { id: 38, name: "LONG HOLD", type: "holdRelease", timeLimit: 12, objective: "Hold for Exactly 3.0s", instructions: "Press and hold the button, releasing at 3.0 seconds.", controlHint: "HOLD 3.0 SEC", isBoss: false, config: { targetTime: 3.0, tolerance: 0.3 } },
  { id: 39, name: "CARD VAULT", type: "memoryPairs", timeLimit: 16, objective: "Match 3 Pairs of Cards", instructions: "Six cards face down. Flip and match 3 pairs.", controlHint: "MEMORY FLIP", isBoss: false, config: { pairs: 3 } },
  { id: 40, name: "LABYRINTH SENTINEL", type: "miniMaze", timeLimit: 18, objective: "Escape the Boss Maze", instructions: "BOSS ALERT! Guide your spark through a complex maze with moving laser gates!", controlHint: "MAZE BOSS", isBoss: true, config: { complexity: 2, movingHazards: true, bossName: "Labyrinth Sentinel" } },

  // 41-50: Reflexes & Ultimate Reaction
  { id: 41, name: "GEM SHOWER", type: "catchFalling", timeLimit: 15, objective: "Collect 7 Emerald Gems", instructions: "Catch 7 falling green emeralds with your slider. Do NOT catch red bombs!", controlHint: "CATCH GEMS", isBoss: false, config: { targetStars: 7, hazardCount: 3, fallSpeed: 2.4 } },
  { id: 42, name: "REVERSE PSYCHOLOGY", type: "holdRelease", timeLimit: 8, objective: "DO NOT TOUCH!", instructions: "A flashing button tempts you. DO NOT TOUCH IT! Wait out the countdown.", controlHint: "HANDS OFF", isBoss: false, config: { handsOff: true, targetTime: 3.5 } },
  { id: 43, name: "FAST TRACK", type: "followPath", timeLimit: 12, objective: "Trace S-Curve Track", instructions: "Move through an S-shaped neon tunnel without touching the electric walls.", controlHint: "TRACE PATH", isBoss: false, config: { pathWidth: 38, points: 5 } },
  { id: 44, name: "GRAVITY RUNNER II", type: "gravityFlip", timeLimit: 15, objective: "Flip Over 5 Spikes", instructions: "Run forward and tap to invert gravity, dodging alternating floor/ceiling spikes.", controlHint: "GRAVITY FLIP", isBoss: false, config: { obstacleCount: 5, speed: 2.5 } },
  { id: 45, name: "TRIPLE BRIDGE", type: "movingBridge", timeLimit: 14, objective: "Align 2 Sliding Bridges", instructions: "Two moving platforms need synchronization. Tap when each lines up.", controlHint: "TIMING TAP", isBoss: false, config: { bridgeCount: 2, bridgeSpeed: 2.4, tolerance: 30 } },
  { id: 46, name: "FAST CIPHER II", type: "doors", timeLimit: 8, objective: "Pick Result: 9 x 3", instructions: "Quick calculation! Tap the portal with the correct answer.", controlHint: "MATH TAP", isBoss: false, config: { doors: 3, mathQuestion: "9 x 3 = ?", answers: [24, 27, 29], correctIndex: 1 } },
  { id: 47, name: "ODD ROTATION", type: "oddOneOut", timeLimit: 10, objective: "Find Mirrored Arrow", instructions: "In a 3x3 grid of arrows pointing right, find the one pointing left.", controlHint: "SPOT DIFFERENCE", isBoss: false, config: { gridSize: 3, diffType: "rotation" } },
  { id: 48, name: "PULSE RUNNER", type: "greenZone", timeLimit: 9, objective: "Hit Narrow Green Target", instructions: "The green zone is narrower and the pointer oscillates faster. Precision tap!", controlHint: "PRECISION TAP", isBoss: false, config: { zoneWidth: 0.22, speed: 3.0 } },
  { id: 49, name: "SIMON 5-CODE", type: "simonMemory", timeLimit: 18, objective: "Repeat 4-Step Sequence", instructions: "Listen and watch 4 illuminated cyber nodes flash in sequence.", controlHint: "MEMORY", isBoss: false, config: { steps: 4, padCount: 4, flashSpeed: 340 } },
  { id: 50, name: "CHRONO TITAN", type: "bossReaction", timeLimit: 18, objective: "Deflect 4 Rapid Strikes", instructions: "BOSS ALERT! Chrono Titan strikes in quick bursts. Counter all 4 attacks on signal!", controlHint: "COUNTER STRIKE", isBoss: true, config: { strikes: 4, windowMs: 650, bossName: "Chrono Titan" } },

  // 51-60: High Speed & Darkness
  { id: 51, name: "METEOR HAIL", type: "avoidFalling", timeLimit: 14, objective: "Dodge 12s Meteor Rain", instructions: "Dodge dense falling fireballs by dragging your shield ship.", controlHint: "DODGE METEORS", isBoss: false, config: { spawnRate: 280, speed: 2.8 } },
  { id: 52, name: "RAPID OVERCHARGE II", type: "rapidTap", timeLimit: 7, objective: "Hammer Tap to 100%", instructions: "Energy decays quickly! Tap furiously to ignite the plasma reactor.", controlHint: "RAPID TAP", isBoss: false, config: { requiredTaps: 26, decayRate: 2.2 } },
  { id: 53, name: "ORBITAL RELAY", type: "orbitJump", timeLimit: 14, objective: "Leap Through 2 Orbits", instructions: "Launch from orbit 1 to orbit 2, then into the center core.", controlHint: "TIMING JUMP", isBoss: false, config: { doubleOrbit: true, orbitSpeed: 2.8 } },
  { id: 54, name: "COLOR EXCLUSION", type: "colorFilter", timeLimit: 12, objective: "Tap ONLY Green Nodes", instructions: "Tap all 5 green nodes. Avoid touching red or purple nodes.", controlHint: "SELECTIVE TAP", isBoss: false, config: { targetColor: "green", greenCount: 5, decoyCount: 5 } },
  { id: 55, name: "PADDLE REFLEX", type: "catchFalling", timeLimit: 15, objective: "Catch 6 Plasma Orbs", instructions: "Fast-falling plasma orbs! Slide paddle to catch them all.", controlHint: "FAST SLIDE", isBoss: false, config: { targetStars: 6, hazardCount: 3, fallSpeed: 2.8 } },
  { id: 56, name: "DOUBLE DRONE", type: "avoidMoving", timeLimit: 15, objective: "Dodge 2 Patrol Drones", instructions: "Two red hunter drones patrol the room. Slip past them to reach the gate.", controlHint: "EVADE DRONES", isBoss: false, config: { drones: 2, droneSpeed: 2.2 } },
  { id: 57, name: "NARROW DIAL", type: "safeLock", timeLimit: 10, objective: "Hit High-Speed Safe Arc", instructions: "Needle rotates at high velocity. Tap precisely in the safe zone.", controlHint: "FAST LOCK", isBoss: false, config: { needleSpeed: 3.4, arcSize: 0.22 } },
  { id: 58, name: "INVERTED MAZE", type: "miniMaze", timeLimit: 16, objective: "Inverted Y Axis Maze", instructions: "Vertical drag is reversed! Drag down to move up.", controlHint: "INVERTED AXIS", isBoss: false, config: { complexity: 1, invertY: true } },
  { id: 59, name: "TRIPLE SYMBOLS", type: "symbolMatch", timeLimit: 12, objective: "Match 3 Identical Glyphs", instructions: "Tap MATCH when both holographic panels display the exact same glyph.", controlHint: "FAST MATCH", isBoss: false, config: { cycleSpeed: 700, targetMatches: 2 } },
  { id: 60, name: "VOID ABYSS", type: "gravityFlip", timeLimit: 16, objective: "Survive Abyss Gauntlet", instructions: "BOSS ALERT! Void Abyss unleashes laser obstacles across ceiling and floor. Flip to survive!", controlHint: "GRAVITY BOSS", isBoss: true, config: { obstacleCount: 7, speed: 2.8, bossName: "Void Abyss" } },

  // 61-70: Memory & Shadow Realm
  { id: 61, name: "HEX MEMORY", type: "simonMemory", timeLimit: 18, objective: "Repeat 5-Pad Sequence", instructions: "Memory challenge: 5 consecutive flashes on 4 colored panels.", controlHint: "MEMORY", isBoss: false, config: { steps: 5, padCount: 4, flashSpeed: 320 } },
  { id: 62, name: "8-CARD VAULT", type: "memoryPairs", timeLimit: 18, objective: "Match 4 Pairs of Cards", instructions: "Eight cards face down. Find all 4 matching pairs before time expires.", controlHint: "MEMORY FLIP", isBoss: false, config: { pairs: 4 } },
  { id: 63, name: "CONSTELLATION V", type: "sequence", timeLimit: 12, objective: "Connect Stars 1 to 5", instructions: "Connect 5 scattered stars in exact numbered sequence.", controlHint: "TAP SEQUENCE", isBoss: false, config: { count: 5, geometric: true } },
  { id: 64, name: "TIGHT CORRIDOR", type: "followPath", timeLimit: 14, objective: "Trace Zig-Zag Channel", instructions: "Navigate a narrow zig-zag neon wire without touching edges.", controlHint: "TRACE PATH", isBoss: false, config: { pathWidth: 32, points: 6 } },
  { id: 65, name: "LANE BLITZ", type: "dodgeLane", timeLimit: 14, objective: "Evade 8 Speed Blocks", instructions: "High-speed lane dodger! Swipe between 3 lanes to evade barriers.", controlHint: "FAST SWIPE", isBoss: false, config: { waves: 8, speed: 3.0 } },
  { id: 66, name: "4-DOOR RIDDLE", type: "doors", timeLimit: 10, objective: "Pick Color: Cyan + Yellow", instructions: "Color synthesis riddle: Cyan + Yellow makes which color portal?", controlHint: "COLOR RIDDLE", isBoss: false, config: { doors: 3, mathQuestion: "Blue + Yellow = ?", answers: ["Purple", "Green", "Orange"], correctIndex: 1 } },
  { id: 67, name: "BALANCE CORE", type: "sliderBalance", timeLimit: 10, objective: "Balance Gyro for 5.0s", instructions: "Keep the balance gauge steady in the center zone for 5 seconds.", controlHint: "STEADY SLIDER", isBoss: false, config: { holdTime: 5.0, driftSpeed: 2.6 } },
  { id: 68, name: "GREEN REFLEX", type: "bossReaction", timeLimit: 10, objective: "Tap Instantly on GREEN", instructions: "Watch the screen! When it turns vivid GREEN, tap immediately. Ignore false flashes!", controlHint: "REFLEX TAP", isBoss: false, config: { strikes: 1, windowMs: 500, greenFlash: true } },
  { id: 69, name: "MOVING LOCKS", type: "movingBridge", timeLimit: 14, objective: "Synchronize 3 Bridges", instructions: "Three bridges sliding at different rates. Tap when aligned to cross.", controlHint: "ALIGN BRIDGES", isBoss: false, config: { bridgeCount: 3, bridgeSpeed: 2.5, tolerance: 28 } },
  { id: 70, name: "SHADOW REALM", type: "darkness", timeLimit: 18, objective: "Find Key & Exit in Dark", instructions: "BOSS ALERT! Search the darkness with your torch to find the key, then locate the exit portal.", controlHint: "DARKNESS BOSS", isBoss: true, config: { radius: 55, hasPatrolInDark: true, bossName: "Shadow Realm" } },

  // 71-80: Precision Mastery
  { id: 71, name: "TRIPLE DRONES", type: "avoidMoving", timeLimit: 16, objective: "Evade 3 Hunter Drones", instructions: "Navigate your vessel past 3 erratic patrolling hunter drones.", controlHint: "DRAG EVADE", isBoss: false, config: { drones: 3, droneSpeed: 2.4 } },
  { id: 72, name: "TARGET SWARM", type: "tapTarget", timeLimit: 10, objective: "Tap 6 Popping Nodes", instructions: "Six energy nodes pop onto screen. Tap all 6 before time runs out.", controlHint: "RAPID TAP", isBoss: false, config: { count: 6, moving: true, speed: 2.2 } },
  { id: 73, name: "HOLD 4.0 SEC", type: "holdRelease", timeLimit: 12, objective: "Hold for Exactly 4.0s", instructions: "Press and hold the capacitor button, releasing precisely at 4.0s.", controlHint: "HOLD & RELEASE", isBoss: false, config: { targetTime: 4.0, tolerance: 0.3 } },
  { id: 74, name: "STARFALL FRENZY", type: "catchFalling", timeLimit: 15, objective: "Catch 8 Falling Stars", instructions: "Stars fall rapidly! Catch 8 stars while avoiding the red spikes.", controlHint: "FAST CATCH", isBoss: false, config: { targetStars: 8, hazardCount: 4, fallSpeed: 3.0 } },
  { id: 75, name: "ODD NODE III", type: "oddOneOut", timeLimit: 10, objective: "Find Different Shape", instructions: "Spot the single diamond among a grid of hexagons.", controlHint: "SHAPE SPOT", isBoss: false, config: { gridSize: 4, diffType: "shape" } },
  { id: 76, name: "RAPID OVERCHARGE III", type: "rapidTap", timeLimit: 7, objective: "Hammer Tap to 100%", instructions: "Extreme energy drain! Hammer the tap button with multiple fingers!", controlHint: "ULTRA TAP", isBoss: false, config: { requiredTaps: 30, decayRate: 2.6 } },
  { id: 77, name: "TRIPLE DIALS", type: "safeLock", timeLimit: 15, objective: "Crack 3 Safe Sectors", instructions: "Three concentric dials! Stop each needle in its highlighted sector.", controlHint: "TRIPLE LOCK", isBoss: false, config: { needles: 3, needleSpeed: 2.6, arcSize: 0.25 } },
  { id: 78, name: "MIRRORED RUNNER", type: "dodgeLane", timeLimit: 14, objective: "Survive Inverted Lanes", instructions: "Swiping left moves you right! Inverted swipe lane dodger.", controlHint: "INVERTED SWIPE", isBoss: false, config: { waves: 7, speed: 2.8, invertControls: true } },
  { id: 79, name: "PRECISION PULSE", type: "greenZone", timeLimit: 9, objective: "Hit Ultra-Thin Safe Bar", instructions: "The indicator travels at high velocity across a narrow green trigger strip.", controlHint: "PRECISION TAP", isBoss: false, config: { zoneWidth: 0.18, speed: 3.4 } },
  { id: 80, name: "HYDRA MATRIX", type: "tapTarget", timeLimit: 14, objective: "Destroy 3 Regenerating Cores", instructions: "BOSS ALERT! The Hydra Matrix has 3 split cores. Destroy all 3 in rapid succession!", controlHint: "HYDRA BOSS", isBoss: true, config: { count: 3, moving: true, speed: 2.6, bossName: "Hydra Matrix" } },

  // 81-90: Chaos & High Challenge
  { id: 81, name: "CONSTELLATION VI", type: "sequence", timeLimit: 12, objective: "Connect Stars 1 to 6", instructions: "Tap the 6 constellation nodes in exact ascending order.", controlHint: "TAP SEQUENCE", isBoss: false, config: { count: 6, geometric: true } },
  { id: 82, name: "HAZARD LABYRINTH", type: "miniMaze", timeLimit: 18, objective: "Escape Moving Maze", instructions: "Walls and laser barriers shift as you drag your spark to the portal.", controlHint: "ADVANCED MAZE", isBoss: false, config: { complexity: 2, movingHazards: true } },
  { id: 83, name: "COLOR MATRIX", type: "colorFilter", timeLimit: 12, objective: "Tap 6 Orange Diamonds", instructions: "Identify and tap all orange diamond nodes. Avoid yellow and red decoys.", controlHint: "SELECTIVE TAP", isBoss: false, config: { targetColor: "orange", targetCount: 6, decoyCount: 6 } },
  { id: 84, name: "GRAVITY RUNNER III", type: "gravityFlip", timeLimit: 16, objective: "Survive 8 Spike Gates", instructions: "High-speed endless runner! Invert gravity with lightning speed.", controlHint: "FAST FLIPS", isBoss: false, config: { obstacleCount: 8, speed: 3.0 } },
  { id: 85, name: "10-CARD MEMORY", type: "memoryPairs", timeLimit: 20, objective: "Match 5 Pairs of Cards", instructions: "Ten cards face down. Reveal and match all 5 pairs.", controlHint: "MEMORY MASTER", isBoss: false, config: { pairs: 5 } },
  { id: 86, name: "METEOR STORM", type: "avoidFalling", timeLimit: 14, objective: "Survive Meteor Barrage", instructions: "Meteors rain down with high density. Weave your shield continuously.", controlHint: "DODGE STORM", isBoss: false, config: { spawnRate: 220, speed: 3.2 } },
  { id: 87, name: "CHAIN ORBIT", type: "orbitJump", timeLimit: 15, objective: "Leap Across 3 Orbits", instructions: "Time your launches across 3 planetary rings to enter the inner portal.", controlHint: "CHAIN JUMP", isBoss: false, config: { doubleOrbit: true, orbitSpeed: 3.2 } },
  { id: 88, name: "SYNAPSE SPEED", type: "simonMemory", timeLimit: 16, objective: "Repeat 5 Rapid Flashes", instructions: "Light pads flash at accelerated tempo. Mirror the sequence accurately.", controlHint: "FAST MEMORY", isBoss: false, config: { steps: 5, padCount: 4, flashSpeed: 260 } },
  { id: 89, name: "NARROW WIRE", type: "followPath", timeLimit: 14, objective: "Trace Hairline Path", instructions: "Ultra-thin glowing path with sharp corners. Don't touch the edges!", controlHint: "PRECISION TRACE", isBoss: false, config: { pathWidth: 26, points: 6 } },
  { id: 90, name: "TEMPORAL WARP", type: "bossReaction", timeLimit: 18, objective: "Deflect 5 Warp Strikes", instructions: "BOSS ALERT! Temporal Warp manipulates time. Counter 5 randomized phase strikes!", controlHint: "TEMPORAL BOSS", isBoss: true, config: { strikes: 5, windowMs: 580, bossName: "Temporal Warp" } },

  // 91-100: The Master Gauntlet & Infinity Gate
  { id: 91, name: "QUAD DRONES", type: "avoidMoving", timeLimit: 16, objective: "Bypass 4 High-Speed Drones", instructions: "Four hunter drones sweep the chamber. Find the safe route to the core.", controlHint: "MASTER EVASION", isBoss: false, config: { drones: 4, droneSpeed: 2.6 } },
  { id: 92, name: "SUPERNOVA CATCH", type: "catchFalling", timeLimit: 15, objective: "Catch 9 Star Cores", instructions: "High-speed star shower! Catch 9 stars while evading 4 moving bombs.", controlHint: "MASTER CATCH", isBoss: false, config: { targetStars: 9, hazardCount: 4, fallSpeed: 3.2 } },
  { id: 93, name: "HYPER OVERCHARGE", type: "rapidTap", timeLimit: 6, objective: "Hyper Tap to 100%", instructions: "Six seconds on the clock! Rapid-tap with maximum speed!", controlHint: "HYPER TAP", isBoss: false, config: { requiredTaps: 32, decayRate: 3.0 } },
  { id: 94, name: "7-STAR GALAXY", type: "sequence", timeLimit: 12, objective: "Connect Stars 1 to 7", instructions: "Tap the 7 galaxy stars in rapid numerical sequence.", controlHint: "FAST SEQUENCE", isBoss: false, config: { count: 7, geometric: true } },
  { id: 95, name: "SHADOW LABYRINTH", type: "darkness", timeLimit: 18, objective: "Navigate Dark Maze to Exit", instructions: "Total darkness inside the labyrinth! Use your beam to locate the exit.", controlHint: "DARK LABYRINTH", isBoss: false, config: { radius: 50, goals: 1 } },
  { id: 96, name: "LANE APOCALYPSE", type: "dodgeLane", timeLimit: 15, objective: "Survive 10 Barrier Waves", instructions: "Ten consecutive obstacle waves! Swipe left and right with zero mistakes.", controlHint: "SWIPE APOCALYPSE", isBoss: false, config: { waves: 10, speed: 3.4 } },
  { id: 97, name: "MICRO SAFE LOCK", type: "safeLock", timeLimit: 10, objective: "Hit 15% Safe Target", instructions: "Ultra-precise dial lock. Needle whips past the narrow safe sector.", controlHint: "MICRO TIMING", isBoss: false, config: { needleSpeed: 3.8, arcSize: 0.16 } },
  { id: 98, name: "SPLIT DECISION", type: "colorFilter", timeLimit: 10, objective: "Tap ONLY Cyan Triangles", instructions: "Fast selective tapping! Filter cyan triangles from 8 mixed decoys.", controlHint: "SPLIT DECISION", isBoss: false, config: { targetColor: "cyan", targetCount: 5, decoyCount: 8 } },
  { id: 99, name: "THE CRUCIBLE", type: "greenZone", timeLimit: 10, objective: "Triple Micro-Zone Tap", instructions: "Hit 3 ultra-narrow green zones consecutively to unlock the Infinity Gate.", controlHint: "TRIPLE TIMING", isBoss: false, config: { zoneWidth: 0.16, speed: 3.6, requiredHits: 3 } },
  { id: 100, name: "INFINITY GATE", type: "bossBattle", timeLimit: 25, objective: "Conquer the Infinity Gate", instructions: "ULTIMATE MILESTONE! Break the 4 defensive shields of the Infinity Gate to enter the infinite realm!", controlHint: "INFINITY BOSS", isBoss: true, config: { shields: 4, bossName: "Infinity Gate", phases: 4 } }
];

// INFINITE PROCEDURAL LEVEL GENERATOR (Level 101 to Infinity)
export function getLevelConfig(levelNum) {
  if (levelNum <= 100 && LEVELS_DATA[levelNum - 1]) {
    return { ...LEVELS_DATA[levelNum - 1] };
  }

  // Deterministic Seed based on Level Number
  const seed = (levelNum * 2654435761) ^ 0x5bf03635;
  const rng = createPRNG(seed);

  // Available mechanics palette
  const mechanics = [
    "tapTarget", "sequence", "avoidMoving", "greenZone", "dodgeLane",
    "catchFalling", "avoidFalling", "simonMemory", "holdRelease", "safeLock",
    "miniMaze", "gravityFlip", "darkness", "rapidTap", "colorFilter"
  ];

  const mechIndex = Math.floor(rng() * mechanics.length);
  const type = mechanics[mechIndex];
  const isBoss = levelNum % 10 === 0;

  // Name Generator
  const prefixes = ["CHRONO", "QUANTUM", "NEO", "VOID", "STELLAR", "CYBER", "HYPER", "OMEGA", "SOLAR", "APEX"];
  const suffixes = ["NEXUS", "GATE", "MATRIX", "SURGE", "HORIZON", "PULSE", "CORE", "ECHO", "PRISM", "VORTEX"];
  const name = isBoss 
    ? `${prefixes[Math.floor(rng() * prefixes.length)]} OVERLORD` 
    : `${prefixes[Math.floor(rng() * prefixes.length)]} ${suffixes[Math.floor(rng() * suffixes.length)]}`;

  let timeLimit = 12 + Math.floor(rng() * 6);
  if (isBoss) timeLimit += 6;

  let objective = "Survive the Challenge";
  let instructions = "Complete the infinite sequence to progress.";
  let controlHint = "SKILL & REFLEX";
  let config = {};

  // Build fair, deterministic, solvable config
  switch (type) {
    case "tapTarget":
      config = {
        count: Math.min(3 + Math.floor(rng() * 4), 7),
        moving: rng() > 0.3,
        speed: 2.0 + rng() * 1.5,
        size: 45
      };
      objective = `Tap ${config.count} Energy Nodes`;
      instructions = `Tap all ${config.count} energy nodes before the timer expires.`;
      controlHint = config.moving ? "MOVING TAP" : "QUICK TAP";
      break;

    case "sequence":
      config = {
        count: Math.min(3 + Math.floor(rng() * 4), 7),
        geometric: rng() > 0.4
      };
      objective = `Tap Nodes 1 to ${config.count}`;
      instructions = `Tap the numbered energy nodes in ascending order.`;
      controlHint = "SEQUENCE TAP";
      break;

    case "avoidMoving":
      config = {
        drones: Math.min(1 + Math.floor(rng() * 3), 4),
        droneSpeed: 2.0 + rng() * 1.2,
        invertX: rng() > 0.7
      };
      objective = config.invertX ? "Reach Portal (Inverted Controls)" : "Reach the Portal";
      instructions = config.invertX 
        ? "Evade the patrol drones with inverted horizontal controls."
        : "Evade moving patrol drones and touch the portal.";
      controlHint = "DRAG TO EVADE";
      break;

    case "greenZone":
      config = {
        zoneWidth: Math.max(0.15, 0.30 - rng() * 0.12),
        speed: 2.4 + rng() * 1.4,
        requiredHits: rng() > 0.6 ? 2 : 1
      };
      objective = config.requiredHits > 1 ? `Hit Green Zone (${config.requiredHits}x)` : "Tap in Green Zone";
      instructions = "Tap when the indicator enters the green target zone.";
      controlHint = "TIMING TAP";
      break;

    case "dodgeLane":
      config = {
        waves: Math.min(5 + Math.floor(rng() * 5), 10),
        speed: 2.4 + rng() * 1.2
      };
      objective = `Dodge ${config.waves} Energy Waves`;
      instructions = "Swipe left and right to dodge the incoming energy barriers.";
      controlHint = "SWIPE DODGE";
      break;

    case "catchFalling":
      config = {
        targetStars: Math.min(5 + Math.floor(rng() * 4), 9),
        hazardCount: 2 + Math.floor(rng() * 2),
        fallSpeed: 2.2 + rng() * 1.2
      };
      objective = `Catch ${config.targetStars} Falling Stars`;
      instructions = "Slide your paddle to catch the falling stars. Avoid red skulls!";
      controlHint = "DRAG PADDLE";
      break;

    case "avoidFalling":
      config = {
        spawnRate: Math.max(200, 320 - (levelNum % 50) * 2),
        speed: 2.5 + rng() * 1.2
      };
      objective = "Survive Meteor Shower";
      instructions = "Drag your shield to dodge falling meteors until the timer expires.";
      controlHint = "DRAG TO DODGE";
      break;

    case "simonMemory":
      config = {
        steps: Math.min(3 + Math.floor(rng() * 3), 6),
        padCount: 4,
        flashSpeed: Math.max(260, 400 - (levelNum % 40) * 3)
      };
      objective = `Repeat ${config.steps}-Step Sequence`;
      instructions = "Watch the colored pads illuminate and repeat the exact sequence.";
      controlHint = "MEMORY";
      break;

    case "holdRelease":
      const targetSec = 2.0 + Math.floor(rng() * 3) * 0.5;
      config = {
        targetTime: targetSec,
        tolerance: Math.max(0.25, 0.35 - rng() * 0.08)
      };
      objective = `Hold for Exactly ${targetSec.toFixed(1)}s`;
      instructions = `Hold the energy button and release at precisely ${targetSec.toFixed(1)} seconds.`;
      controlHint = `HOLD ${targetSec.toFixed(1)}s`;
      break;

    case "safeLock":
      config = {
        needleSpeed: 2.5 + rng() * 1.4,
        arcSize: Math.max(0.16, 0.30 - rng() * 0.1),
        needles: rng() > 0.6 ? 2 : 1
      };
      objective = config.needles > 1 ? "Align Dual Safe Dials" : "Stop Needle in Safe Zone";
      instructions = "Tap to freeze the rotating needle within the safe arc sector.";
      controlHint = "LOCK TIMING";
      break;

    case "miniMaze":
      config = {
        complexity: rng() > 0.5 ? 2 : 1,
        movingHazards: rng() > 0.5
      };
      objective = "Navigate Maze to Exit";
      instructions = "Drag your orb through the maze to reach the portal without touching walls.";
      controlHint = "DRAG TO TRACE";
      break;

    case "gravityFlip":
      config = {
        obstacleCount: Math.min(4 + Math.floor(rng() * 4), 8),
        speed: 2.4 + rng() * 1.0
      };
      objective = "Survive Gravity Run";
      instructions = "Tap anywhere to invert gravity and dodge floor and ceiling spikes.";
      controlHint = "GRAVITY FLIP";
      break;

    case "darkness":
      config = {
        radius: Math.max(50, 65 - rng() * 15),
        goals: rng() > 0.6 ? 2 : 1
      };
      objective = config.goals > 1 ? "Find 2 Hidden Shards" : "Find Hidden Shard";
      instructions = "Move your spotlight beam in the dark to discover the hidden crystals.";
      controlHint = "DRAG SPOTLIGHT";
      break;

    case "rapidTap":
      config = {
        requiredTaps: Math.min(22 + Math.floor(rng() * 12), 34),
        decayRate: 1.8 + rng() * 1.0
      };
      objective = "Rapid Tap to 100%";
      instructions = "Hammer the charging button to fill the power gauge before time expires!";
      controlHint = "RAPID TAP";
      break;

    case "colorFilter":
      const colors = ["blue", "green", "yellow", "cyan"];
      const targetC = colors[Math.floor(rng() * colors.length)];
      config = {
        targetColor: targetC,
        targetCount: 4 + Math.floor(rng() * 3),
        decoyCount: 4 + Math.floor(rng() * 3)
      };
      objective = `Tap ONLY ${targetC.toUpperCase()} Nodes`;
      instructions = `Tap all ${targetC} nodes. Avoid tapping any other color!`;
      controlHint = "SELECTIVE TAP";
      break;

    default:
      type = "tapTarget";
      config = { count: 3, moving: false };
      break;
  }

  return {
    id: levelNum,
    name,
    type,
    timeLimit,
    objective,
    instructions,
    controlHint,
    isBoss,
    config
  };
}
