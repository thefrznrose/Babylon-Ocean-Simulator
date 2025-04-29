'use client';

import { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  Color4,
  Color3,
  MeshBuilder,
    Texture,
    StandardMaterial, CubeTexture,
    VertexBuffer
} from "@babylonjs/core";
import { WaterMaterial } from "@babylonjs/materials";

export default function OceanCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = createEngine(canvasRef.current);
    const scene = createScene(engine);
    const camera = createCamera(scene, canvasRef.current);
    createLights(scene);
    const skybox = createSkybox(scene);
    createWater(scene, skybox);

    setupScrollInteraction(scene, camera);

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => engine.resize());

    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "200vh", // Tall enough for scroll diving
        display: "block",
      }}
    />
  );
}

// ======================================================================
// Helper Functions
// ======================================================================

// Create engine
function createEngine(canvas: HTMLCanvasElement) {
  return new Engine(canvas, true);
}

// Create scene
function createScene(engine: Engine) {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.5, 0.8, 1.0, 1); // Sky color
//   scene.fogMode = Scene.FOGMODE_EXP;
//   scene.fogColor = new Color3(0.5, 0.8, 1.0);
//   scene.fogDensity = 0.01;
  return scene;
}



// Setup camera
function createCamera(scene: Scene, canvas: HTMLCanvasElement) {
  const camera = new ArcRotateCamera(
    "Camera",
    Math.PI / 2,
    Math.PI / 2.4, // Slight downward tilt
    30,
    new Vector3(0, 0, 0), // Start above the surface
    scene
  );
  camera.attachControl(canvas, true);
  return camera;
}

// Setup lights
function createLights(scene: Scene) {
  new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  new DirectionalLight("sun", new Vector3(-1, -2, -1), scene);
}

// // Create skybox
// function createSkybox(scene: Scene) {
//   const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
//   const skyboxMaterial = new WaterMaterial("skyBoxMat", scene);
//   skyboxMaterial.backFaceCulling = false;
//   skybox.material = skyboxMaterial;
//   return skybox;
// }

function createSkybox(scene: Scene) {
    const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
  
    const skyboxMaterial = new StandardMaterial("skyBoxMaterial", scene);
    skyboxMaterial.backFaceCulling = false;
  
    // Create a CubeTexture from your custom folder
    skyboxMaterial.reflectionTexture = new CubeTexture(
      "/textures/skybox/DaylightBox", // path prefix
      scene,
      ["_Left.bmp", "_Top.bmp", "_Back.bmp", "_Right.bmp", "_Bottom.bmp", "_Front.bmp"]

    );
  
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skyboxMaterial.disableLighting = true;
  
    skybox.material = skyboxMaterial;
  
    return skybox;
  }

// Create water surface
// function createWater(scene: Scene, skybox: any) {
//   const waterMesh = MeshBuilder.CreateGround("water", { width: 512, height: 512 }, scene);
//   const waterMaterial = new WaterMaterial("waterMat", scene);

//   waterMaterial.bumpTexture = new Texture("/textures/waterbump.png", scene);

//   // Ocean-like choppy settings
//   waterMaterial.windForce = -20;         // Stronger wind = rougher water
//   waterMaterial.waveHeight = 2.0;         // Taller waves
//   waterMaterial.bumpHeight = 4.5;         // More aggressive normal mapping (surface texture)
//   waterMaterial.waveLength = 0.05;        // Shorter waves = choppier appearance
//   waterMaterial.waveSpeed = 1.0;          // Make the waves move noticeably
//   waterMaterial.colorBlendFactor = 0.2;   // Less color blending = darker deeper look
//   waterMaterial.alpha = 0.7; // 0 = fully transparent, 1 = fully opaque

//   waterMaterial.addToRenderList(skybox); // Reflect sky
//   waterMesh.material = waterMaterial;
// }


function createWater(scene: Scene, skybox: any) {
    const waterMesh = MeshBuilder.CreateGround("water", { width: 512, height: 512, subdivisions: 100 }, scene);
    const waterMaterial = new WaterMaterial("waterMat", scene);
  
    waterMaterial.bumpTexture = new Texture("/textures/waterbump.png", scene);
  
    waterMaterial.windForce = -5;
    waterMaterial.waveHeight = 0.5;
    waterMaterial.bumpHeight = 4.5;
    waterMaterial.waveLength = 0.05;
    waterMaterial.waveSpeed = 1.0;
    waterMaterial.colorBlendFactor = 0.002;
    waterMaterial.alpha = 0.6;
  
    waterMaterial.addToRenderList(skybox);
    waterMesh.material = waterMaterial;
  
    // Vertex deformation for rolling waves
    const vertexData = waterMesh.getVerticesData(VertexBuffer.PositionKind)!.slice();
    let time = 0;
  
    scene.onBeforeRenderObservable.add(() => {
        time += scene.getEngine().getDeltaTime() * 0.001;
      
        const positions = waterMesh.getVerticesData(VertexBuffer.PositionKind)!;
        for (let i = 0; i < positions.length; i += 3) {
          const x = vertexData[i];
          const z = vertexData[i + 2];
      
          // Layered traveling waves
          const wave1 = Math.sin((x * 0.05) + (time * 0.5)) * 1.5;   // Big slow wave
          const wave2 = Math.sin((z * 0.08) + (time * 0.8)) * 0.8;   // Medium traveling wave
          const wave3 = Math.sin((x * 0.2 + z * 0.2) + (time * 1.2)) * 0.3; // Small fast ripples
      
          positions[i + 1] = wave1 + wave2 + wave3;
        }
      
        waterMesh.updateVerticesData(VertexBuffer.PositionKind, positions);
      });
      
  }

// Setup scroll interactions (fog color + camera movement)
function setupScrollInteraction(scene: Scene, camera: ArcRotateCamera) {
    // Scroll changes fog color and adjusts vertical camera drift slightly
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 2000;
      const scrollFactor = Math.min(scrollY / maxScroll, 1);
  
      // Update fog color
      const startColor = new Color3(0.5, 0.8, 1.0);
      const endColor = new Color3(0.0, 0.2, 0.5);
      const r = startColor.r + (endColor.r - startColor.r) * scrollFactor;
      const g = startColor.g + (endColor.g - startColor.g) * scrollFactor;
      const b = startColor.b + (endColor.b - startColor.b) * scrollFactor;
      scene.fogColor = new Color3(r, g, b);
    };
  
    // Keyboard input: W = go up, S = go down
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "w" || event.key === "W") {
        camera.target.y += 1; // Move camera target UP
      }
      if (event.key === "s" || event.key === "S") {
        camera.target.y -= 1; // Move camera target DOWN
      }
    };
  
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("keydown", handleKeyDown);
  }
  