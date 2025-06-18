import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.156.1/examples/jsm/controls/OrbitControls.js';
import { ArcballControls } from 'https://unpkg.com/three@0.156.1/examples/jsm/controls/ArcballControls.js';

// Add floating text overlay
const instructionText = document.createElement('div');
instructionText.innerHTML = 'Use mouse to move around • Drag to rotate • Scroll to zoom';
instructionText.style.cssText = `
    position: fixed;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.6);
    font-family: 'Arial', sans-serif;
    font-size: 14px;
    font-weight: 300;
    letter-spacing: 1px;
    text-align: center;
    pointer-events: none;
    z-index: 1000;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
    animation: fadeInOut 4s ease-in-out infinite;
`;

// Add CSS animation for subtle pulsing effect
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 0.3; }
    }
`;
document.head.appendChild(style);
document.body.appendChild(instructionText);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// const controls = new OrbitControls(camera, renderer.domElement);
const controls = new ArcballControls(camera, renderer.domElement, scene);
controls.enableAnimations = true; // Optional: smooth transitions
controls.setGizmosVisible(false); // Optional: hide the visual gizmo

camera.position.z = 3;
camera.position.y = 3;
camera.position.x = 3;

// Create materials for different colors
const whiteMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const blueMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
const redMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });

// green 0x00ff00
// blue 0x0000ff
// red 0xff0000


// Create 4D vertices of a tesseract
const vertices4D = [
    [-1, -1, -1, -1], [1, -1, -1, -1], [-1, 1, -1, -1], [1, 1, -1, -1],
    [-1, -1, 1, -1], [1, -1, 1, -1], [-1, 1, 1, -1], [1, 1, 1, -1],
    [-1, -1, -1, 1], [1, -1, -1, 1], [-1, 1, -1, 1], [1, 1, -1, 1],
    [-1, -1, 1, 1], [1, -1, 1, 1], [-1, 1, 1, 1], [1, 1, 1, 1]
];

// Define edges connecting vertices
const edges = [
    [0,1], [0,2], [0,4], [0,8], [1,3], [1,5], [1,9],
    [2,3], [2,6], [2,10], [3,7], [3,11], [4,5], [4,6],
    [4,12], [5,7], [5,13], [6,7], [6,14], [7,15], [8,9],
    [8,10], [8,12], [9,11], [9,13], [10,11], [10,14],
    [11,15], [12,13], [12,14], [13,15], [14,15]
];

// Function to project 4D to 3D with proper rotation
function project4Dto3D(point4D, time, speedMultiplier = 1) {
    // Apply 4D rotations
    let x = point4D[0], y = point4D[1], z = point4D[2], w = point4D[3];
    
    // XY rotation
    const xy_rotation = time * 0.0005 * speedMultiplier;
    let temp_x = x * Math.cos(xy_rotation) - y * Math.sin(xy_rotation);
    let temp_y = x * Math.sin(xy_rotation) + y * Math.cos(xy_rotation);
    x = temp_x;
    y = temp_y;
    
    // ZW rotation
    const zw_rotation = time * 0.0007 * speedMultiplier;
    temp_x = z * Math.cos(zw_rotation) - w * Math.sin(zw_rotation);
    let temp_w = z * Math.sin(zw_rotation) + w * Math.cos(zw_rotation);
    z = temp_x;
    w = temp_w;
    
    // Project to 3D
    const distance = 2;
    const w_factor = 1 / (distance - w);
    
    return new THREE.Vector3(
        x * w_factor,
        y * w_factor,
        z * w_factor
    );
}

// Animation variables with different speeds for each tesseract
const baseRotationSpeed = 1;
const speedMultipliers = [1, 0.9876, 1.0124]; // Extremely close speeds for very gradual drift
const positionOffsets = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.1, 0.1, 0.1),
    new THREE.Vector3(-0.1, -0.1, -0.1)
];

let whiteTesseractLines, blueTesseractLines, redTesseractLines;

function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now();
    
    // Remove old lines
    if(whiteTesseractLines) scene.remove(whiteTesseractLines);
    if(blueTesseractLines) scene.remove(blueTesseractLines);
    if(redTesseractLines) scene.remove(redTesseractLines);
    
    // Create tesseracts with different speeds
    const tesseractConfigs = [
        { material: whiteMaterial, speedMultiplier: speedMultipliers[0], positionOffset: positionOffsets[0] },
        { material: blueMaterial, speedMultiplier: speedMultipliers[1], positionOffset: positionOffsets[1] },
        { material: redMaterial, speedMultiplier: speedMultipliers[2], positionOffset: positionOffsets[2] }
    ];
    
    const allLines = [];
    
    tesseractConfigs.forEach((config, index) => {
        // Project all vertices to 3D with this tesseract's speed
        const vertices3D = vertices4D.map(v => project4Dto3D(v, time, config.speedMultiplier));
        
        // Create all edges for this tesseract
        const points = [];
        edges.forEach(edge => {
            const start = vertices3D[edge[0]].clone().add(config.positionOffset);
            const end = vertices3D[edge[1]].clone().add(config.positionOffset);
            points.push(start, end);
        });
        
        // Create geometry and lines for this tesseract
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const lines = new THREE.LineSegments(geometry, config.material);
        allLines.push(lines);
    });
    
    // Assign to variables and add to scene
    [whiteTesseractLines, blueTesseractLines, redTesseractLines] = allLines;
    
    scene.add(whiteTesseractLines);
    scene.add(blueTesseractLines);
    scene.add(redTesseractLines);
    
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();
