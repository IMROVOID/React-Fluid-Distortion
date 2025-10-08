import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Noise } from '@react-three/postprocessing';
import { Fluid } from '@whatisjery/react-fluid-distortion';
import { useControls } from 'leva';
import { createNoise2D } from 'simplex-noise';
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
    // These controls will only render if the mode is 'Circular'
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
  
  // Effect to track real mouse movement and pause the auto-simulator accordingly.
  useEffect(() => {
    const handleMouseMove = () => {
      setIsRealMouseActive(true);
      clearTimeout(mouseTimeoutRef.current);
      mouseTimeoutRef.current = setTimeout(() => {
        setIsRealMouseActive(false);
      }, 150); // Mouse is considered inactive after 150ms of no movement
    };

    const handleMouseLeave = () => {
      setIsRealMouseActive(false);
      clearTimeout(mouseTimeoutRef.current);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup listeners and timeout on component unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(mouseTimeoutRef.current);
    };
  }, []); // Empty dependency array ensures this effect runs only once

  return (
    <>
      <div className="content">
        <h1>Welcome to the future of the Internet.</h1>
        <p>FORMLESS is a decentralized distribution network that empowers individuals to connect, create, collaborate and share in a multiplayer digital economy.</p>
      </div>

      <DebugDot position={debugPosition} />

      <Canvas style={{ position: 'fixed', top: 0, left: 0, zIndex: 0 }}>
        <ambientLight intensity={0.5} />
        <hemisphereLight args={[0xffffff, 0x000000, 1.0]} />

        <CameraAnimation />

        <AutoFluidSimulator {...autoFluidControls} setDebugPosition={setDebugPosition} isRealMouseActive={isRealMouseActive} />

        <EffectComposer>
          {enabled && <Fluid {...fluidConfigSecondary} backgroundColor={sceneConfig.backgroundColor} />}
          <Fluid {...fluidConfigPrimary} backgroundColor={sceneConfig.backgroundColor} />
          <Noise opacity={noiseConfig.opacity} />
        </EffectComposer>
      </Canvas>
    </>
  );
}

export default App;