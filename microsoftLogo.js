// Create the canvas and engine
const canvas = document.getElementById('renderCanvas'); // Ensure you have a canvas with this ID in your HTML
const engine = new BABYLON.Engine(canvas, true);

// Set hardware scaling level for higher resolution rendering
engine.setHardwareScalingLevel(1 / window.devicePixelRatio); // Match the resolution to the device's pixel density

// Function to create a firecracker effect using a dynamic texture that draws a white circle
const createFirecracker = (scene, position, color) => {
    const particleSystem = new BABYLON.ParticleSystem("firecracker", 5000, scene);

    // Disable depth buffer to always render on top
    particleSystem.disableDepthSort = true;

    // Create a dynamic texture with a white circle so that the particle color can tint it
    const circleTexture = new BABYLON.DynamicTexture("circleTexture", { width: 56, height: 256 }, scene, false);
    const ctx = circleTexture.getContext();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(128, 128, 100, 0, Math.PI * 2);
    ctx.fill();
    circleTexture.update();

    // Set the dynamic texture as the particle texture
    particleSystem.particleTexture = circleTexture;

    // Emitter position
    particleSystem.emitter = position; // Emit particles from clicked square
    particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

    // Particle colors (tinted based on the clicked square)
    particleSystem.color1 = new BABYLON.Color4(color.r, color.g, color.b, 1);
    particleSystem.color2 = new BABYLON.Color4(
        Math.min(color.r + 0.2, 1),
        Math.min(color.g + 0.2, 1),
        Math.min(color.b + 0.2, 1),
        1
    );
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

    // Particle sizing and lifetime
    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.15;
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 1.5;
    particleSystem.emitRate = 2000; // Increased emit rate

    // Adjust gravity and direction for an explosive effect
    particleSystem.gravity = new BABYLON.Vector3(0, 0.5, 0); // Reduced upward gravity
    particleSystem.direction1 = new BABYLON.Vector3(-2, 1, -2);
    particleSystem.direction2 = new BABYLON.Vector3(2, 1, 2);

    particleSystem.minAngularSpeed = -Math.PI;
    particleSystem.maxAngularSpeed = Math.PI;
    particleSystem.minEmitPower = 2;
    particleSystem.maxEmitPower = 5;
    particleSystem.updateSpeed = 0.01;

    // Start the particle system and immediately trigger an instant burst
    particleSystem.start();
    particleSystem.manualEmitCount = 3000; // Increased burst count

    // Dispose the system after 1.5 seconds
    setTimeout(() => {
        particleSystem.stop();
        particleSystem.dispose();
    }, 3000);
};

// Update click detection to call the firecracker effect at the scene's origin
const addClickDetection = (scene, squares, materials) => {
    const origin = BABYLON.Vector3.Zero(); // The center of the scene

    squares.forEach((square, index) => {
        square.actionManager = new BABYLON.ActionManager(scene);
        square.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                () => {
                    const color = materials[index].albedoColor; // Get the color of the clicked square
                    createFirecracker(scene, origin, color); // Trigger at the origin
                }
            )
        );
    });
};

// Create the scene
const createScene = () => {
    const scene = new BABYLON.Scene(engine);

    // Add a camera
    const camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 4, Math.PI / 4, 5, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Adjust camera responsiveness
    camera.angularSensibilityX = 500; // Lower value for faster horizontal rotation
    camera.angularSensibilityY = 500; // Lower value for faster vertical rotation
    camera.wheelPrecision = 1; // Lower value for faster zoom

    // Add a light
    const hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemisphericLight.intensity = 0.3; // Reduce intensity to complement the ambient light

    // Add a directional light for sharper highlights
    const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-1, -2, -1), scene);
    directionalLight.position = new BABYLON.Vector3(5, 5, 5); // Position the light
    directionalLight.intensity = 0.5; // Reduce intensity to avoid overly bright areas

    // Add an ambient light for consistent illumination
    const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.8; // Provide uniform lighting across all sides

    // Add an environment texture for reflections
    const environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("https://playground.babylonjs.com/textures/environment.env", scene);
    scene.environmentTexture = environmentTexture;

    // Define colors for the logo
    const colors = [
        new BABYLON.Color3.FromHexString("#F25022"), // Top-left (Red)
        new BABYLON.Color3.FromHexString("#7FBA00"), // Top-right (Green)
        new BABYLON.Color3.FromHexString("#00A4EF"), // Bottom-left (Blue)
        new BABYLON.Color3.FromHexString("#FFB900")  // Bottom-right (Yellow)
    ];

    // Create the squares for the logo as 3D cubes with beveled edges
    const size = 1; // Size of each cube (same for width, height, and depth)
    const positions = [
        new BABYLON.Vector3(-size / 2, size / 2, 0),  // Top-left
        new BABYLON.Vector3(size / 2, size / 2, 0),   // Top-right
        new BABYLON.Vector3(-size / 2, -size / 2, 0), // Bottom-left
        new BABYLON.Vector3(size / 2, -size / 2, 0)   // Bottom-right
    ];

    const squares = []; // Collect all squares for click detection
    const materials = []; // Collect materials for color reference

    // Create a parent mesh to hold the squares
    const logoContainer = new BABYLON.Mesh("logoContainer", scene);

    positions.forEach((position, index) => {
        const square = BABYLON.MeshBuilder.CreateBox(`square${index}`, {
            size: size * 0.9, // Slightly smaller to simulate beveled edges
        }, scene);

        // Position the square
        square.position = position;

        // Parent the square to the logo container
        square.parent = logoContainer;

        // Apply material to the square
        const material = new BABYLON.PBRMaterial(`material${index}`, scene);
        material.albedoColor = colors[index]; // Base color
        material.metallic = 0.6; // Slight metallic effect for a polished look
        material.roughness = 0.3; // Smooth and glossy
        material.environmentTexture = environmentTexture; // Add reflections
        material.clearCoat.isEnabled = true; // Enable clear coat for extra shine
        material.clearCoat.intensity = 2; // Adjust clear coat intensity
        square.material = material;

        squares.push(square);
        materials.push(material);
    });

    // Add click detection to the squares
    addClickDetection(scene, squares, materials);

    return scene;
};

// Create the scene and run the render loop
const scene = createScene();
engine.runRenderLoop(() => {
    scene.render();
    // Rotate the entire logo around the Y-axis
    scene.getMeshByName("logoContainer").rotation.y += 0.001; // Adjust rotation speed as needed
});

// Resize the engine on window resize
window.addEventListener('resize', () => {
    engine.resize();
});
