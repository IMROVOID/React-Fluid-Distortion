# Interactive Fluid Simulation with React Three Fiber

A real-time, interactive fluid dynamics simulation built with React and React Three Fiber. This project showcases a high-poly glass-like ring that refracts 3D text behind it, combined with a fluid distortion effect that responds to mouse movement.

[**Live Demo (Link)**](#) <!-- Add your live demo link here -->

 <!-- This is one of the images you provided. You can replace it with a GIF. -->

---

## 🚀 How It Works

This project leverages the power of the React Three Fiber ecosystem to create a stunning 3D scene in the browser. The core effects are achieved through a combination of advanced materials, post-processing, and 3D text rendering.

### Core Technologies

*   **React:** The foundation for the user interface.
*   **React Three Fiber (`@react-three/fiber`):** A powerful React renderer for Three.js, allowing us to build the 3D scene with declarative components.
*   **Drei (`@react-three/drei`):** A collection of essential helpers for React Three Fiber. We use it for the `<Text>`, `<Environment>`, and `<MeshTransmissionMaterial>`.
*   **React Postprocessing (`@react-three/postprocessing`):** Manages the post-processing effects, including the fluid simulation.
*   **Leva:** Provides the GUI controls for tweaking parameters in real-time.

### Key Components & Effects

1.  **The Glass Ring (`<ShinyRing />`)**
    *   **High-Poly Geometry:** The smooth ring shape is created using a `<torusGeometry>` with a high number of segments to ensure there are no visible low-poly edges.
    *   **Light-Bending Effect:** The glass material is a `<MeshTransmissionMaterial>` from `drei`. This advanced material realistically simulates light passing through a transparent object. The key property, `ior` (Index of Refraction), is set to a high value to create the strong, visible "light-bend" effect that distorts the text behind it.
    *   **Realistic Reflections:** The scene uses an `<Environment>` component loaded with a high-dynamic-range (HDR) image (`.hdr`). This studio light map provides the realistic, sharp reflections you see on the glass surface.

2.  **The 3D Text (`<SceneText />`)**
    *   The text is not a standard HTML element. It's a true 3D object rendered using the `<Text>` component from `drei`.
    *   It is strategically placed behind the glass ring in 3D space, allowing the ring's material to refract it.
    *   The text remains stationary while the ring rotates independently around it.

3.  **The Fluid Distortion**
    *   The interactive fluid effect comes from the `@whatisjery/react-fluid-distortion` library.
    *   It's applied as a **post-processing effect**, meaning it's a filter laid on top of the rendered scene. We use `<EffectComposer>` to manage this.
    *   Crucially, we use `<Selection>` and `<Select>` components. Only objects wrapped in `<Select enabled>` (in this case, the ring) are affected by the fluid distortion. This is how the text remains perfectly clear and is not distorted by the fluid effect.

---

## 🛠️ Installation & Usage

To get this project running locally, follow these steps.

### Prerequisites

You need to have [Node.js](https://nodejs.org/) (v16 or later) and `npm` installed on your machine.

### 1. Clone the Repository

Clone this repository to your local machine using Git:

```bash
git clone https://github.com/IMROVOID/React-Fluid-Distortion.git
cd React-Fluid-Distortion/client
```

### 2. Install Dependencies

Install all the required project dependencies using npm:

```bash
npm install
```

### 3. Run the Development Server

Start the local development server:

```bash
npm start
```

Open your browser and navigate to `http://localhost:3000` to see the application running. The page will auto-reload when you make changes to the source code.

### 4. Build for Production

To create an optimized production build, run:

```bash
npm run build
```

This will create a `build` folder in the `client` directory with all the static assets ready for deployment.

---

## 🔧 How to Modify

Customizing this project is straightforward. All the main logic is located in `client/src/App.js`.

### Change the Shape

1.  Navigate to the `<ShinyRing />` component.
2.  Modify the `<torusGeometry />` line. For example, to change it to a sphere, you could replace it with `<sphereGeometry args={[2, 128, 128]} />`.
3.  You can use any Three.js geometry you prefer.

### Adjust the Glass Effect

1.  Inside the `<ShinyRing />` component, find the `<MeshTransmissionMaterial />`.
2.  You can tweak its properties to change the glass appearance:
    *   `ior`: Controls the strength of the light-bending. Higher values mean more distortion.
    *   `roughness`: Makes the reflections sharper (lower values) or more diffuse (higher values).
    *   `envMapIntensity`: Controls the brightness of the HDR reflections.
    *   `color`: Change the tint of the glass.

### Change the Environment & Reflections

1.  In the `App` component, find the `<Environment />` tag.
2.  Change the `files` prop to a different `.hdr` file URL to get a completely different lighting and reflection style. You can find free HDRIs on sites like [Poly Haven](https://polyhaven.com/hdris).

### Modify the Text

1.  Go to the `<SceneText />` component.
2.  You'll find two `<Text>` components. You can change the content, `fontSize`, `color`, and other properties directly.

### Tweak the Fluid Effects

1.  At the top of the `App` component, you'll find several `useControls` hooks from the Leva library (e.g., `fluidConfigPrimary`).
2.  You can change the default values for `intensity`, `swirl`, `fluidColor`, etc., directly in the code. These are the same controls you see in the GUI.

## 📜 License & Copyright

This project is completely open source and available to the public. You are free to use, modify, distribute, and fork this software for any purpose. No attribution is required, but it is appreciated.

---

## © About the Developer

This application was developed and is maintained by **Roham Andarzgou**.

I'm a passionate professional from Iran specializing in Graphic Design, Web Development, and cross-platform app development with Dart & Flutter. I thrive on turning innovative ideas into reality, whether it's a stunning visual, a responsive website, or a polished desktop app like this one. I also develop immersive games using Unreal Engine.

*   **Website:** [rovoid.ir](https://rovoid.ir)
*   **GitHub:** [IMROVOID](https://github.com/IMROVOID)
*   **LinkedIn:** [Roham Andarzgou](https://www.linkedin.com/in/roham-andarzgouu)

### 🙏 Support This Project

If you find this application useful, please consider a donation. As I am based in Iran, cryptocurrency is the only way I can receive support. Thank you!

| Cryptocurrency | Address |
| :--- | :--- |
| **Bitcoin** (BTC) | `bc1qd35yqx3xt28dy6fd87xzd62cj7ch35p68ep3p8` |
| **Ethereum** (ETH) | `0xA39Dfd80309e881cF1464dDb00cF0a17bF0322e3` |
| **USDT** (TRC20) | `THMe6FdXkA2Pw45yKaXBHRnkX3fjyKCzfy` |
| **Solana** (SOL) | `9QZHMTN4Pu6BCxiN2yABEcR3P4sXtBjkog9GXNxWbav1` |
| **TON** | `UQCp0OawnofpZTNZk-69wlqIx_wQpzKBgDpxY2JK5iynh3mC` |