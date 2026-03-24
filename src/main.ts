import './style.css';
import * as THREE from 'three';
import { PlayerController } from './PlayerController.ts';
import { generateGallery } from './GalleryGenerator.ts';

// 1. Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505); // Completely dark void outside the gallery

// 2. Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// 3. Renderer setup
const appContainer = document.querySelector<HTMLDivElement>('#app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
appContainer.appendChild(renderer.domElement);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 4. Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 2.5); // Brighten ambient museum light
scene.add(ambientLight);

// A soft overhead light covering the hallway
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3.5); 
scene.add(hemiLight);

// 5. Procedural Museum Gallery
const { colliders, interactables } = generateGallery(scene);

// 6. Player Controller setup
const player = new PlayerController(camera, document.body, colliders, interactables);

// 7. Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Update player simulation
    player.update(delta);

    renderer.render(scene, camera);
}

animate();
