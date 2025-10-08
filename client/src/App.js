import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Noise, Selection, Select } from '@react-three/postprocessing';
import { Fluid } from '@whatisjery/react-fluid-distortion';
import { useControls } from 'leva';
import { createNoise2D } from 'simplex-noise';
import { Environment, Text, MeshTransmissionMaterial } from '@react-three/drei';
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
    if (mode !== 'Circular' || isRealMouseActive) {
      if (debug) setDebugPosition(null);
      return;
    }

    const t = clock.getElapsedTime();
    const speedNoise = (noise2D(t * 0.2, 0) + 1) / 2;
    const currentSpeed = speedMin + (speedMax - speedMin) * speedNoise;

    const centerX = size.width / 2;
    const centerY = size.height / 2;
    const angle = t * currentSpeed;
    const circularX = centerX + Math.cos(angle) * circleRadius;
    const circularY = centerY + Math.sin(angle) * circleRadius;

    const randomOffsetX = (noise2D(t, 100) * 2 - 1) * randomness;
    const randomOffsetY = (noise2D(t, 200) * 2 - 1) * randomness;

    const finalX = circularX + randomOffsetX;
    const finalY = circularY + randomOffsetY;

    const syntheticEvent = new PointerEvent('pointermove', {
      clientX: finalX,
      clientY: finalY,
      bubbles: true,
    });
    gl.domElement.dispatchEvent(syntheticEvent);

    if (debug) {
      setDebugPosition({ x: finalX, y: finalY });
    } else {
      setDebugPosition(null);
    }
  });

  return null;
}

// High-resolution, glass-like ring component with light-bending effect
function ShinyRing() {
  const meshRef = useRef();

  // This useFrame hook rotates only the ring mesh
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.002;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <torusGeometry args={[1.7, 0.3, 32, 512]} />
      <MeshTransmissionMaterial
        backside={true}
        samples={16}
        resolution={1024}
        transmission={1}
        roughness={0.1}
        thickness={0.4}
        ior={2.33}
        chromaticAberration={0.06}
        anisotropy={0.1}
        distortion={0.1}
        distortionScale={0.2}
        temporalDistortion={0.2}
        color={"#ffffff"}
        envMapIntensity={0.7} // Reduced to make the HDR reflections darker
      />
    </mesh>
  );
}

// 3D Text component that will be placed inside the ring
function SceneText() {
    return (
        <group position={[0, 0, -0.5]}>
            <Text
                fontSize={0.45}
                anchorX="center"
                anchorY="middle"
                color="white"
                position={[0, 0.4, 0]}
                font={null} // Using the default font for stability
            >
                Interactive Fluid Simulation
            </Text>
            <Text
                fontSize={0.12}
                anchorX="center"
                anchorY="top"
                color="white"
                position={[0, 0, 0]}
                maxWidth={3}
                textAlign="center"
                lineHeight={1.5}
                font={null} // Using the default font
            >
                A real-time fluid dynamics demonstration built with React Three Fiber. Move your mouse to distort the background.
            </Text>
        </group>
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
        {/* The Environment provides the lighting and reflections for the glass material */}
        <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr" />
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <hemisphereLight args={[0xffffff, 0x000000, 1.0]} />

        {/* The text is static and not affected by post-processing */}
        <SceneText />

        <Selection>
          <EffectComposer autoClear={false}>
            {enabled && <Fluid {...fluidConfigSecondary} backgroundColor={sceneConfig.backgroundColor} />}
            <Fluid {...fluidConfigPrimary} backgroundColor={sceneConfig.backgroundColor} />
            <Noise opacity={noiseConfig.opacity} />
          </EffectComposer>
          
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