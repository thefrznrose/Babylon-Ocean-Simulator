import React, { useEffect, useRef } from "react";
import * as BABYLON from "babylonjs";

const BabylonCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create BabylonJS engine
        const engine = new BABYLON.Engine(canvas, true);

        // Create a basic scene
        const scene = new BABYLON.Scene(engine);

        // Create a camera and attach it to the canvas
        const camera = new BABYLON.ArcRotateCamera(
            "camera",
            Math.PI / 2,
            Math.PI / 2,
            10,
            BABYLON.Vector3.Zero(),
            scene
        );
        camera.attachControl(canvas, true);

        // Add a light
        const light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            scene
        );

        // Add a simple sphere
        const sphere = BABYLON.MeshBuilder.CreateSphere(
            "sphere",
            { diameter: 2 },
            scene
        );

        // Render the scene
        engine.runRenderLoop(() => {
            scene.render();
        });

        // Handle window resize
        const handleResize = () => {
            engine.resize();
        };
        window.addEventListener("resize", handleResize);

        return () => {
            engine.dispose();
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
};

export default BabylonCanvas;