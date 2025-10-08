import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Noise, Selection, Select } from '@react-three/postprocessing';
import { Fluid } from '@whatisjery/react-fluid-distortion';
import { useControls } from 'leva';
import { createNoise2D } from 'simplex-noise';
import { Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';

// A simple HTML component for the debug dot.
function DebugDot({ position }) {
  if (!position) return null;
  const style = {
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
  };
  return <div className="debug-dot" style={style} />;
}

/**
 * This component generates fluid by dispatching synthetic pointer events
 * in various configurable patterns.
 */
function AutoFluidSimulator({ mode, circleRadius, speedMin, speedMax, randomness, debug, setDebugPosition, isRealMouseActive }) {
  const { size, gl } = useThree();
  const noise2D = useMemo(() => createNoise2D(), []);

  useFrame(({ clock }) => {
    // Exit if the feature is turned off or the real mouse is active.
    if (mode !== 'Circular' || isRealMouseActive) {
      if (debug) setDebugPosition(null);
      return;
    }

    const t = clock.getElapsedTime();

    // --- Physics & Position Calculation ---

    // 1. Calculate a smoothly varying speed between the min and max.
    const speedNoise = (noise2D(t * 0.2, 0) + 1) / 2; // Varies between 0 and 1
    const currentSpeed = speedMin + (speedMax - speedMin) * speedNoise;

    // 2. Calculate the base circular path position.
    const centerX = size.width / 2;
    const centerY = size.height / 2;
    const angle = t * currentSpeed;
    const circularX = centerX + Math.cos(angle) * circleRadius;
    const circularY = centerY + Math.sin(angle) * circleRadius;

    // 3. Generate a random offset using noise.
    const randomOffsetX = (noise2D(t, 100) * 2 - 1) * randomness;
    const randomOffsetY = (noise2D(t, 200) * 2 - 1) * randomness;

    // 4. Combine the circular path with the random offset.
    const finalX = circularX + randomOffsetX;
    const finalY = circularY + randomOffsetY;

    // --- Event Dispatching ---
    const syntheticEvent = new PointerEvent('pointermove', {
      clientX: finalX,
      clientY: finalY,
      bubbles: true,
    });
    gl.domElement.dispatchEvent(syntheticEvent);

    // Update the debug dot's position if enabled.
    if (debug) {
      setDebugPosition({ x: finalX, y: finalY });
    } else {
      setDebugPosition(null);
    }
  });

  return null;
}

// This component will slowly rotate the camera for a subtle parallax effect
function CameraAnimation() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    camera.rotation.z = clock.getElapsedTime() * 0.05;
  });
  return null;
}

// High-resolution, glass-like ring component
function ShinyRing() {
  const meshRef = useRef();

  // Rotate the ring on each frame
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.002;
      meshRef.current.rotation.y += 0.005;
    }
  });

  // Create the specific flat ring shape using ExtrudeGeometry
  const extrudeSettings = useMemo(() => ({
    steps: 1,
    depth: 0.3, // Thinner depth
    bevelEnabled: true,
    bevelThickness: 0.05, // Thinner bevel
    bevelSize: 0.05,
    bevelSegments: 24, // Much smoother bevel
  }), []);

  const shape = useMemo(() => {
    const ringShape = new THREE.Shape();
    const outerRadius = 2.0;
    const innerRadius = 1.4; // Make hole slightly larger for a thinner ring
    const segments = 256; // High resolution for a perfectly smooth circle

    ringShape.moveTo(outerRadius, 0);
    ringShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

    const holePath = new THREE.Path();
    holePath.moveTo(innerRadius, 0);
    holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);

    ringShape.holes.push(holePath);
    return ringShape;
  }, []);


  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshPhysicalMaterial
        color="#333333"
        metalness={0.2}
        roughness={0} // Perfectly smooth for clear glass
        transmission={1.0} // Fully transparent
        ior={2.33} // High index of refraction for strong light bending
        thickness={1.5} // How thick the glass is considered for refraction
      />
    </mesh>
  );
}

function App() {
  const [debugPosition, setDebugPosition] = useState(null);
  const [isRealMouseActive, setIsRealMouseActive] = useState(false);
  const mouseTimeoutRef = useRef(null);

  // --- Leva Controls ---
  const { enabled, ...fluidConfigSecondary } = useControls('Fluid Secondary', {
    enabled: { value: true, label: 'On / Off' },
    fluidColor: '#00ffcc',
    blend: 0.5,
    intensity: 0.15,
    curl: 2.0,
    swirl: 1.5,
  });

  const fluidConfigPrimary = useControls('Fluid Primary', {
    fluidColor: '#0000ff',
    blend: 0.3,
    intensity: 0.1,
    curl: 1.0,
    swirl: 2.0,
    force: { value: 2.0, min: 0.0, max: 20.0, step: 0.1 },
  });

  const sceneConfig = useControls('Scene', {
    backgroundColor: '#000000',
  });

  const noiseConfig = useControls('Noise', {
    opacity: { value: 0.05, min: 0, max: 1 },
  });

  const autoFluidControls = useControls('Auto Fluid', {
    mode: {
      value: 'Circular',
      options: ['Off', 'Circular'],
      label: 'Mode',
    },
    circleRadius: {
      value: 150,
      min: 10,
      max: 1000,
      step: 10,
      label: 'Circle Radius',
      render: (get) => get('Auto Fluid.mode') === 'Circular',
    },
    speedMin: {
      value: 0.8,
      min: 0.1,
      max: 5.0,
      step: 0.1,
      label: 'Min Speed',
      render: (get) => get('Auto Fluid.mode') === 'Circular',
    },
    speedMax: {
      value: 1.2,
      min: 0.1,
      max: 5.0,
      step: 0.1,
      label: 'Max Speed',
      render: (get) => get('Auto Fluid.mode') === 'Circular',
    },
    randomness: {
      value: 50,
      min: 0,
      max: 500,
      step: 5,
      label: 'Randomness',
      render: (get) => get('Auto Fluid.mode') === 'Circular',
    },
    debug: { value: false, label: 'Debug' },
  });
  
  // Effect to track real mouse movement
  useEffect(() => {
    const handleMouseMove = () => {
      setIsRealMouseActive(true);
      clearTimeout(mouseTimeoutRef.current);
      mouseTimeoutRef.current = setTimeout(() => setIsRealMouseActive(false), 150);
    };
    const handleMouseLeave = () => {
      setIsRealMouseActive(false);
      clearTimeout(mouseTimeoutRef.current);
    };
    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(mouseTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <DebugDot position={debugPosition} />

      <Canvas style={{ position: 'fixed', top: 0, left: 0, zIndex: 0 }} camera={{ position: [0, 0, 5], fov: 75 }}>
        <Environment preset="night" />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <hemisphereLight args={[0xffffff, 0x000000, 1.0]} />

        <CameraAnimation />

        {/* The text is now inside the canvas, positioned behind the ring, to allow for refraction */}
        <Html position={[0, 0, -1]} center>
          <div className="content">
            <h1>Interactive Fluid Simulation</h1>
            <p>A real-time fluid dynamics demonstration built with React Three Fiber. Move your mouse to distort the background.</p>
          </div>
        </Html>

        <Selection>
          {/* The EffectComposer will only apply to selected objects */}
          <EffectComposer autoClear={false}>
            {enabled && <Fluid {...fluidConfigSecondary} backgroundColor={sceneConfig.backgroundColor} />}
            <Fluid {...fluidConfigPrimary} backgroundColor={sceneConfig.backgroundColor} />
            <Noise opacity={noiseConfig.opacity} />
          </EffectComposer>

          {/* Select makes this object eligible for the effects */}
          <Select enabled>
            <ShinyRing />
          </Select>
        </Selection>

        <AutoFluidSimulator {...autoFluidControls} setDebugPosition={setDebugPosition} isRealMouseActive={isRealMouseActive} />
      </Canvas>
    </>
  );
}

export default App;