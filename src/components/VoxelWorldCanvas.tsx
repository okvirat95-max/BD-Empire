import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { WeatherType, ThemeMode } from '../types';

interface VoxelWorldCanvasProps {
  weather: WeatherType;
  theme: ThemeMode;
}

export default function VoxelWorldCanvas({ weather, theme }: VoxelWorldCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, and WebGL Renderer Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0518, 0.012);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    // Positioned for gorgeous diagonal perspective viewing of the islands
    camera.position.set(0, 22, 44);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Keep track of all disposable assets for memory leak protection
    const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];
    const track = <T extends THREE.BufferGeometry | THREE.Material>(obj: T): T => {
      disposables.push(obj);
      return obj;
    };

    // 2. High-Contrast Minecraft-Inspired Material Palette
    const grassMaterial = track(new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.9, flatShading: true }));
    const dirtMaterial = track(new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 1.0, flatShading: true }));
    const stoneMaterial = track(new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.8, flatShading: true }));
    const cobblestoneMaterial = track(new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.85, flatShading: true }));
    const woodMaterial = track(new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.9, flatShading: true }));
    const logMaterial = track(new THREE.MeshStandardMaterial({ color: 0x431407, roughness: 0.95, flatShading: true }));
    const leafMaterial = track(new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, flatShading: true }));
    const obsidianMaterial = track(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.4, flatShading: true }));
    const endStoneMaterial = track(new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9, flatShading: true }));
    const glassMaterial = track(new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, transparent: true, opacity: 0.4 }));
    
    // Water uses high emission roughness and semi-transparency
    const waterMaterial = track(new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.75 }));

    const sunMaterial = track(new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    const moonMaterial = track(new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }));

    // Shared box geometry for classic voxel block rendering
    const boxGeometry = track(new THREE.BoxGeometry(1, 1, 1));

    // Helper: Instantiate a single solid voxel block
    const createBlock = (
      x: number,
      y: number,
      z: number,
      material: THREE.Material,
      scaleX = 1,
      scaleY = 1,
      scaleZ = 1,
      parent: THREE.Object3D = scene
    ) => {
      const mesh = new THREE.Mesh(boxGeometry, material);
      mesh.position.set(x, y, z);
      mesh.scale.set(scaleX, scaleY, scaleZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // 3. Environment Groups
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // ━ Main Grasslands Floating Island ━
    const mainIsland = new THREE.Group();
    mainIsland.position.set(0, -1, 0);
    worldGroup.add(mainIsland);

    // Terraced block layers
    createBlock(0, 0, 0, grassMaterial, 20, 1, 20, mainIsland);
    createBlock(0, -1, 0, dirtMaterial, 19, 1, 19, mainIsland);
    createBlock(0, -2, 0, dirtMaterial, 17, 1, 17, mainIsland);
    createBlock(0, -3.5, 0, stoneMaterial, 14, 2, 14, mainIsland);
    createBlock(0, -5, 0, stoneMaterial, 10, 1, 10, mainIsland);
    createBlock(0, -6, 0, cobblestoneMaterial, 6, 1, 6, mainIsland);

    // ━ Animated River Voxel Blocks ━
    const riverBlocks: THREE.Mesh[] = [];
    // We create a line of river blocks running across the island from Z: -10 to Z: 10
    const riverGroup = new THREE.Group();
    mainIsland.add(riverGroup);

    for (let z = -9; z <= 9; z++) {
      // Create a river slice at x=0
      const block = createBlock(0, 0.05, z, waterMaterial, 2.2, 0.9, 1.0, riverGroup);
      riverBlocks.push(block);
    }

    // Animated cascading waterfall at the edge
    const waterfallGroup = new THREE.Group();
    waterfallGroup.position.set(0, -3.5, -10.1);
    mainIsland.add(waterfallGroup);
    const waterfallBody = createBlock(0, 0, 0, waterMaterial, 2.1, 7, 0.4, waterfallGroup);

    // ━ Minecraft-Inspired Village ━
    const villageGroup = new THREE.Group();
    mainIsland.add(villageGroup);

    // HOUSE 1: Wooden Cottage (Left Side)
    const cottage = new THREE.Group();
    cottage.position.set(-6, 0.5, 4);
    villageGroup.add(cottage);
    // Walls
    createBlock(0, 1, 0, woodMaterial, 3, 2, 3, cottage);
    // Log pillars at corners
    createBlock(-1.5, 1, -1.5, logMaterial, 0.5, 2, 0.5, cottage);
    createBlock(1.5, 1, -1.5, logMaterial, 0.5, 2, 0.5, cottage);
    createBlock(-1.5, 1, 1.5, logMaterial, 0.5, 2, 0.5, cottage);
    createBlock(1.5, 1, 1.5, logMaterial, 0.5, 2, 0.5, cottage);
    // Roof (reddish tiles style)
    const brickRoofMaterial = track(new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.9, flatShading: true }));
    createBlock(0, 2.2, 0, brickRoofMaterial, 3.6, 0.5, 3.6, cottage);
    createBlock(0, 2.6, 0, brickRoofMaterial, 2.4, 0.5, 2.4, cottage);
    // Glowing Glass Windows
    createBlock(0, 1, 1.51, track(new THREE.MeshBasicMaterial({ color: 0xfef08a })), 0.8, 0.8, 0.1, cottage);
    createBlock(-1.51, 1, 0, track(new THREE.MeshBasicMaterial({ color: 0xfef08a })), 0.1, 0.8, 0.8, cottage);
    // Warm interior pointlight
    const cottageLight = new THREE.PointLight(0xfef08a, 1.5, 8);
    cottageLight.position.set(0, 1.2, 0);
    cottage.add(cottageLight);

    // HOUSE 2: Cobblestone Blacksmith (Right Side)
    const smithy = new THREE.Group();
    smithy.position.set(6, 0.5, 5);
    villageGroup.add(smithy);
    // Walls
    createBlock(0, 1, 0, cobblestoneMaterial, 4, 2, 3, smithy);
    // Double pitched wooden roof
    createBlock(0, 2.2, 0, woodMaterial, 4.6, 0.4, 3.6, smithy);
    createBlock(0, 2.5, 0, woodMaterial, 3.2, 0.4, 2.4, smithy);
    // Lava pit furnace
    const lavaMaterial = track(new THREE.MeshBasicMaterial({ color: 0xea580c }));
    createBlock(-1, 0.5, 1.3, lavaMaterial, 1.2, 0.4, 0.8, smithy);
    const furnaceLight = new THREE.PointLight(0xf97316, 2.0, 6);
    furnaceLight.position.set(-1, 0.8, 1.3);
    smithy.add(furnaceLight);

    // Village pathways
    const pathMaterial = track(new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 1.0, flatShading: true }));
    createBlock(-3, 0.02, 4, pathMaterial, 3, 0.1, 1, villageGroup);
    createBlock(3, 0.02, 5, pathMaterial, 3, 0.1, 1, villageGroup);

    // ━ Minecraft Voxel Trees ━
    const treeGroup = new THREE.Group();
    mainIsland.add(treeGroup);

    // Tree 1: Standard Oak
    const oakTree = new THREE.Group();
    oakTree.position.set(-6, 0.5, -5);
    treeGroup.add(oakTree);
    createBlock(0, 1.5, 0, logMaterial, 0.8, 3, 0.8, oakTree);
    createBlock(0, 3.5, 0, leafMaterial, 3, 1.5, 3, oakTree);
    createBlock(0, 4.5, 0, leafMaterial, 2, 1, 2, oakTree);

    // Tree 2: Large Birch style
    const birchTree = new THREE.Group();
    birchTree.position.set(6, 0.5, -4);
    treeGroup.add(birchTree);
    const whiteLogMaterial = track(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9, flatShading: true }));
    createBlock(0, 2.0, 0, whiteLogMaterial, 0.6, 4, 0.6, birchTree);
    createBlock(0, 4.2, 0, leafMaterial, 2.6, 2.0, 2.6, birchTree);
    createBlock(0, 5.2, 0, leafMaterial, 1.6, 1.0, 1.6, birchTree);

    // Tree 3: Tiny Pine style
    const pineTree = new THREE.Group();
    pineTree.position.set(-4, 0.5, -1);
    treeGroup.add(pineTree);
    createBlock(0, 1.0, 0, logMaterial, 0.5, 2, 0.5, pineTree);
    createBlock(0, 2.2, 0, leafMaterial, 2.0, 1.2, 2.0, pineTree);
    createBlock(0, 3.0, 0, leafMaterial, 1.2, 0.8, 1.2, pineTree);

    // ━ Nether Portal Island (Floating Obsidian Rock) ━
    const netherIsland = new THREE.Group();
    netherIsland.position.set(-13, 3, -7);
    worldGroup.add(netherIsland);
    // Base netherrack
    const netherrackMaterial = track(new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 1.0, flatShading: true }));
    createBlock(0, 0, 0, netherrackMaterial, 6, 1.2, 6, netherIsland);
    createBlock(0, -1, 0, obsidianMaterial, 5, 1, 5, netherIsland);
    // Portal frame structure
    createBlock(-1.5, 2.2, 0, obsidianMaterial, 0.8, 3.2, 0.8, netherIsland);
    createBlock(1.5, 2.2, 0, obsidianMaterial, 0.8, 3.2, 0.8, netherIsland);
    createBlock(0, 3.8, 0, obsidianMaterial, 3.8, 0.8, 0.8, netherIsland);
    createBlock(0, 0.6, 0, obsidianMaterial, 3.8, 0.6, 0.8, netherIsland);
    // Translucent Portal Core
    const portalCoreMaterial = track(new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    }));
    const portalCore = createBlock(0, 2.2, 0, portalCoreMaterial, 2.2, 2.4, 0.15, netherIsland);
    // Purple Portal PointLight
    const portalLight = new THREE.PointLight(0xa855f7, 2.5, 14);
    portalLight.position.set(0, 2.5, 1);
    netherIsland.add(portalLight);

    // ━ End Portal Island (Floating Pale Rock) ━
    const endIsland = new THREE.Group();
    endIsland.position.set(13, -3, 8);
    worldGroup.add(endIsland);
    // Endstone terraced base
    createBlock(0, 0, 0, endStoneMaterial, 6, 1.2, 6, endIsland);
    createBlock(0, -1, 0, stoneMaterial, 5, 1, 5, endIsland);
    // Portal horizontal frames
    createBlock(0, 0.7, 0, obsidianMaterial, 3, 0.4, 3, endIsland);
    // Black portal center
    const endCoreMaterial = track(new THREE.MeshBasicMaterial({ color: 0x020617 }));
    const endPortalCore = createBlock(0, 0.9, 0, endCoreMaterial, 2.2, 0.1, 2.2, endIsland);
    // Orbiting Eyes of Ender
    const eyeOfEnderMaterial = track(new THREE.MeshBasicMaterial({ color: 0x34d399 }));
    createBlock(-1.2, 0.95, -1.2, eyeOfEnderMaterial, 0.3, 0.3, 0.3, endIsland);
    createBlock(1.2, 0.95, -1.2, eyeOfEnderMaterial, 0.3, 0.3, 0.3, endIsland);
    createBlock(-1.2, 0.95, 1.2, eyeOfEnderMaterial, 0.3, 0.3, 0.3, endIsland);
    createBlock(1.2, 0.95, 1.2, eyeOfEnderMaterial, 0.3, 0.3, 0.3, endIsland);

    // ━ Animated Flying Ender Dragon ━
    const dragonGroup = new THREE.Group();
    scene.add(dragonGroup);
    const dragonBodyMaterial = track(new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.6, metalness: 0.2, flatShading: true }));
    const dragonEyeMaterial = track(new THREE.MeshBasicMaterial({ color: 0xec4899 })); // Magenta glowing eyes
    // Dragon main parts
    const dragonBody = createBlock(0, 0, 0, dragonBodyMaterial, 2.4, 1.0, 3.4, dragonGroup);
    const dragonHead = createBlock(0, 0.7, 2.0, dragonBodyMaterial, 1.3, 0.8, 1.3, dragonGroup);
    createBlock(-0.45, 0.8, 2.4, dragonEyeMaterial, 0.2, 0.2, 0.2, dragonGroup);
    createBlock(0.45, 0.8, 2.4, dragonEyeMaterial, 0.2, 0.2, 0.2, dragonGroup);
    // Articulated wings
    const leftWing = createBlock(-2.4, 0.2, 0, dragonBodyMaterial, 2.5, 0.15, 1.3, dragonGroup);
    const rightWing = createBlock(2.4, 0.2, 0, dragonBodyMaterial, 2.5, 0.15, 1.3, dragonGroup);

    // ━ Blocky Floating Clouds ━
    const cloudGroup = new THREE.Group();
    scene.add(cloudGroup);
    const cloudMaterial = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));

    const clouds: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const cloud = new THREE.Mesh(boxGeometry, cloudMaterial);
      cloud.scale.set(8 + Math.random() * 5, 1.2, 4 + Math.random() * 3);
      cloud.position.set(-25 + Math.random() * 50, 16 + Math.random() * 3, -20 + Math.random() * 40);
      cloudGroup.add(cloud);
      clouds.push(cloud);
    }

    // ━ Day/Night Orbiting Orbs (Sun and Moon) ━
    const celestialGroup = new THREE.Group();
    scene.add(celestialGroup);

    const sunOrb = new THREE.Group();
    sunOrb.position.set(0, 36, 0);
    celestialGroup.add(sunOrb);
    createBlock(0, 0, 0, sunMaterial, 3, 3, 3, sunOrb);

    const moonOrb = new THREE.Group();
    moonOrb.position.set(0, -36, 0); // Directly opposite the sun
    celestialGroup.add(moonOrb);
    createBlock(0, 0, 0, moonMaterial, 2.5, 2.5, 2.5, moonOrb);

    // ━ Particle Systems (Weather Elements, Splashes, Smoke, Sparkles) ━
    const weatherParticleCount = 300;
    const weatherGeometry = track(new THREE.BufferGeometry());
    const weatherPositions = new Float32Array(weatherParticleCount * 3);
    const weatherVelocities: number[] = [];

    for (let i = 0; i < weatherParticleCount; i++) {
      weatherPositions[i * 3] = (Math.random() - 0.5) * 55;
      weatherPositions[i * 3 + 1] = Math.random() * 38;
      weatherPositions[i * 3 + 2] = (Math.random() - 0.5) * 55;

      weatherVelocities.push((Math.random() - 0.5) * 0.1); // drift x
      weatherVelocities.push(-0.16 - Math.random() * 0.22); // fall velocity y
      weatherVelocities.push((Math.random() - 0.5) * 0.1); // drift z
    }

    weatherGeometry.setAttribute('position', new THREE.BufferAttribute(weatherPositions, 3));

    let particleColor = 0x38bdf8; // Sky blue rain
    let particleSize = 0.16;

    if (weather === 'cosmic-snow') {
      particleColor = 0xc084fc; // Violet galactic snow flakes
      particleSize = 0.24;
    } else if (weather === 'portal-storm') {
      particleColor = 0xf43f5e; // Crimson plasma drops
      particleSize = 0.28;
    }

    const weatherMaterial = track(new THREE.PointsMaterial({
      color: particleColor,
      size: particleSize,
      transparent: true,
      opacity: 0.85
    }));

    const weatherPoints = new THREE.Points(weatherGeometry, weatherMaterial);
    scene.add(weatherPoints);

    // Waterfall Bubbles & Splashes
    const waterfallSplashes: THREE.Mesh[] = [];
    const splashMaterial = track(new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 }));
    const splashGeometry = track(new THREE.BoxGeometry(0.18, 0.18, 0.18));

    for (let i = 0; i < 20; i++) {
      const splash = new THREE.Mesh(splashGeometry, splashMaterial);
      // Splash down at the base of the waterfall
      splash.position.set((Math.random() - 0.5) * 1.8, -7.2, -10.1);
      scene.add(splash);
      waterfallSplashes.push(splash);
    }

    // Nether Portal Sparkles
    const netherSparkles: THREE.Mesh[] = [];
    const sparkleMaterial = track(new THREE.MeshBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.8 }));
    const sparkleGeometry = track(new THREE.BoxGeometry(0.12, 0.12, 0.12));

    for (let i = 0; i < 15; i++) {
      const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
      sparkle.position.set(
        -13 + (Math.random() - 0.5) * 2.5,
        3 + Math.random() * 3.5,
        -7 + (Math.random() - 0.5) * 1.8
      );
      scene.add(sparkle);
      netherSparkles.push(sparkle);
    }

    // Cottage chimney smoke puffs
    const smokePuffs: THREE.Mesh[] = [];
    const smokeMaterial = track(new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.45 }));
    const smokeGeometry = track(new THREE.BoxGeometry(0.28, 0.28, 0.28));

    for (let i = 0; i < 8; i++) {
      const puff = new THREE.Mesh(smokeGeometry, smokeMaterial);
      puff.position.set(-7.2, 3.2, 4.2); // position over cottage chimney
      scene.add(puff);
      smokePuffs.push(puff);
    }

    // ━ Global Scene Lights ━
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(15, 35, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Cyan accent spot source
    const accentLight = new THREE.PointLight(0x0ea5e9, 1.5, 25);
    accentLight.position.set(5, 7, 5);
    scene.add(accentLight);

    // ━ Real-Time Rendering Loop ━
    let frameId: number;
    let clockTime = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      clockTime += 0.008;

      // Parallax world rotation
      worldGroup.rotation.y = clockTime * 0.04;

      // 1. Continuous Day/Night Cycle Celestial Orbit
      // Celestial group rotates, carrying Sun and Moon in a circle
      const cycleSpeed = 0.08;
      celestialGroup.rotation.z = clockTime * cycleSpeed;

      // Compute global sky tone depending on sun height
      // The sun orb is on the positive Y scale, moon orb is negative.
      // Math.sin of rotation gives height.
      const sunHeight = Math.sin(clockTime * cycleSpeed);

      if (sunHeight > 0.1) {
        // Daytime transition
        const progress = Math.min(1, (sunHeight - 0.1) * 2);
        dirLight.intensity = 1.2 * progress;
        dirLight.color.setHex(0xfef08a); // Golden daylight
        ambientLight.color.setHex(0xffffff);
        renderer.setClearColor(0x0a0f1d, 0.3 + 0.45 * progress);
        scene.fog.color.setHex(0x0a0f1d);
      } else if (sunHeight < -0.1) {
        // Nighttime transition
        const progress = Math.min(1, (-sunHeight - 0.1) * 2);
        dirLight.intensity = 0.35 * progress;
        dirLight.color.setHex(0x38bdf8); // Silvery moonlight
        ambientLight.color.setHex(0x1e1b4b);
        renderer.setClearColor(0x020617, 0.5);
        scene.fog.color.setHex(0x020617);
      } else {
        // Sunset / Sunrise twilight
        dirLight.intensity = 0.6;
        dirLight.color.setHex(0xf43f5e); // Crimson dusk sky
        renderer.setClearColor(0x110221, 0.5);
        scene.fog.color.setHex(0x110221);
      }

      // 2. Animated Wave water and river vertices
      riverBlocks.forEach((block, idx) => {
        // Offset heights in sequence using sine wave to mimic water flow
        const heightScale = 1.0 + Math.sin(clockTime * 4.5 + idx * 0.5) * 0.12;
        block.scale.y = 0.9 * heightScale;
        block.position.y = 0.05 + (block.scale.y - 0.9) * 0.5;
      });

      // Scale waterfall scaling rhythmically
      waterfallBody.scale.x = 2.1 + Math.sin(clockTime * 6.0) * 0.05;

      // 3. Ender Dragon orbit and wing flapping
      const dragonRadius = 19;
      dragonGroup.position.x = Math.sin(clockTime * 0.4) * dragonRadius;
      dragonGroup.position.z = Math.cos(clockTime * 0.4) * dragonRadius;
      dragonGroup.position.y = 4.0 + Math.sin(clockTime * 1.0) * 3;
      dragonGroup.rotation.y = (clockTime * 0.4) + Math.PI;

      const wingsSpeed = 5.5;
      const wingFlap = Math.sin(clockTime * wingsSpeed) * 0.45;
      leftWing.rotation.z = wingFlap;
      rightWing.rotation.z = -wingFlap;

      // 4. Pulsing Nether portal
      const portalPulse = 1.0 + Math.sin(clockTime * 5.0) * 0.06;
      portalCore.scale.set(2.2 * portalPulse, 2.4, 0.15);

      // 5. Orbiting cloud slide
      clouds.forEach(cloud => {
        cloud.position.x += 0.012;
        if (cloud.position.x > 30) {
          cloud.position.x = -30;
        }
      });

      // 6. Update falling weather particles
      const positions = weatherPoints.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < weatherParticleCount; i++) {
        positions[i * 3] += weatherVelocities[i * 3]; // X
        positions[i * 3 + 1] += weatherVelocities[i * 3 + 1]; // Y
        positions[i * 3 + 2] += weatherVelocities[i * 3 + 2]; // Z

        // Recycle when hitting vertical floor threshold
        if (positions[i * 3 + 1] < -12) {
          positions[i * 3] = (Math.random() - 0.5) * 55;
          positions[i * 3 + 1] = 35 + Math.random() * 5;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 55;
        }
      }
      weatherPoints.geometry.attributes.position.needsUpdate = true;

      // 7. Bubble waterfall splashes
      waterfallSplashes.forEach((splash, idx) => {
        splash.position.y += 0.07;
        splash.position.x += Math.sin(clockTime * 5 + idx) * 0.02;
        splash.scale.multiplyScalar(0.96);

        if (splash.position.y > -3 || splash.scale.x < 0.15) {
          splash.position.set((Math.random() - 0.5) * 1.6, -7.2, -10.1);
          splash.scale.set(1, 1, 1);
        }
      });

      // 8. Nether portal particles upward floating
      netherSparkles.forEach((sparkle, idx) => {
        sparkle.position.y += 0.04;
        sparkle.position.x += Math.cos(clockTime * 3 + idx) * 0.01;
        sparkle.scale.multiplyScalar(0.97);

        if (sparkle.position.y > 6.5 || sparkle.scale.x < 0.1) {
          sparkle.position.set(
            -13 + (Math.random() - 0.5) * 2.2,
            3 + Math.random() * 1.8,
            -7 + (Math.random() - 0.5) * 1.5
          );
          sparkle.scale.set(1, 1, 1);
        }
      });

      // 9. Cottage chimney smoke puffing
      smokePuffs.forEach((puff, idx) => {
        puff.position.y += 0.035;
        puff.position.x += Math.sin(clockTime * 2.2 + idx) * 0.03;
        puff.scale.multiplyScalar(0.96);

        if (puff.position.y > 6.0 || puff.scale.x < 0.1) {
          puff.position.set(-7.2, 3.2, 4.2);
          puff.scale.set(1, 1, 1);
        }
      });

      // Theme-specific color offsets
      if (theme === 'midnight') {
        accentLight.color.setHex(0x7c3aed); // Purple night beacon
      } else if (theme === 'nebula') {
        accentLight.color.setHex(0xec4899); // Electric pink
      } else {
        accentLight.color.setHex(0x0ea5e9); // Blue skyway
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handling via ResizeObserver (robust stage sizing)
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    let resizeRafId: number;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(() => {
        if (container) {
          handleResize();
        }
      });
    });
    resizeObserver.observe(container);

    // Garbage collection & clean disposal
    return () => {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(resizeRafId);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      disposables.forEach(item => {
        item.dispose();
      });
      renderer.dispose();
    };
  }, [weather, theme]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-1000 -z-20"
      style={{ opacity: 0.72 }}
    />
  );
}
