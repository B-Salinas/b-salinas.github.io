import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
camera.position.z = 3;
camera.position.y = 3;
camera.position.x = 3;

// Create materials for different colors
const blueMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
const redMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const greenMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });

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
function project4Dto3D(point4D, time) {
    // Apply 4D rotations
    let x = point4D[0], y = point4D[1], z = point4D[2], w = point4D[3];
    
    // XY rotation
    const xy_rotation = time * 0.0005;
    let temp_x = x * Math.cos(xy_rotation) - y * Math.sin(xy_rotation);
    let temp_y = x * Math.sin(xy_rotation) + y * Math.cos(xy_rotation);
    x = temp_x;
    y = temp_y;
    
    // ZW rotation
    const zw_rotation = time * 0.0007;
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

let outerLines, innerLines, connectingLines;

function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now();
    
    // Remove old lines
    if(outerLines) scene.remove(outerLines);
    if(innerLines) scene.remove(innerLines);
    if(connectingLines) scene.remove(connectingLines);
    
    // Create new vertices and edges
    const outerPoints = [];
    const innerPoints = [];
    const connectingPoints = [];
    
    // Project all vertices to 3D
    const vertices3D = vertices4D.map(v => project4Dto3D(v, time));
    
    // Create edges
    edges.forEach(edge => {
        const start = vertices3D[edge[0]];
        const end = vertices3D[edge[1]];
        
        // Determine which cube the edge belongs to
        if(edge[0] < 8 && edge[1] < 8) {
            outerPoints.push(start, end);
        } else if(edge[0] >= 8 && edge[1] >= 8) {
            innerPoints.push(start, end);
        } else {
            connectingPoints.push(start, end);
        }
    });
    
    // Create geometries
    const outerGeometry = new THREE.BufferGeometry().setFromPoints(outerPoints);
    const innerGeometry = new THREE.BufferGeometry().setFromPoints(innerPoints);
    const connectingGeometry = new THREE.BufferGeometry().setFromPoints(connectingPoints);
    
    // Create lines
    outerLines = new THREE.LineSegments(outerGeometry, blueMaterial);
    innerLines = new THREE.LineSegments(innerGeometry, redMaterial);
    connectingLines = new THREE.LineSegments(connectingGeometry, greenMaterial);
    
    // Add to scene
    scene.add(outerLines);
    scene.add(innerLines);
    scene.add(connectingLines);
    
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
