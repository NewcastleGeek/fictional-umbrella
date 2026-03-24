import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import type { Meme } from './memes2025.ts';

export class PlayerController {
    camera: THREE.Camera;
    controls: PointerLockControls;
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
    isSprinting = false;
    canJump = false;

    velocity = new THREE.Vector3();
    direction = new THREE.Vector3();

    colliders: THREE.Box3[] = [];
    playerBox = new THREE.Box3();

    // Interaction elements
    interactables: THREE.Mesh[] = [];
    raycaster = new THREE.Raycaster();
    centerVector = new THREE.Vector2(0, 0); // Always aim at the center of the screen
    currentMeme: Meme | null = null;
    speechSynth = window.speechSynthesis;
    
    // UI
    uiOverlay: HTMLDivElement;

    constructor(camera: THREE.Camera, domElement: HTMLElement, colliders: THREE.Box3[] = [], interactables: THREE.Mesh[] = []) {
        this.camera = camera;
        this.controls = new PointerLockControls(camera, domElement);
        this.colliders = colliders;
        this.interactables = interactables;
        
        // Spawn height, look towards North (-Z)
        this.camera.position.set(0, 7, -48);

        // Reticle (Crosshair)
        const reticle = document.createElement('div');
        reticle.style.position = 'absolute';
        reticle.style.top = '50%';
        reticle.style.left = '50%';
        reticle.style.width = '6px';
        reticle.style.height = '6px';
        reticle.style.backgroundColor = 'white';
        reticle.style.borderRadius = '50%';
        reticle.style.transform = 'translate(-50%, -50%)';
        reticle.style.zIndex = '998';
        reticle.style.pointerEvents = 'none';
        document.body.appendChild(reticle);

        // Interaction Overlay
        this.uiOverlay = document.createElement('div');
        this.uiOverlay.style.position = 'absolute';
        this.uiOverlay.style.bottom = '10%';
        this.uiOverlay.style.left = '50%';
        this.uiOverlay.style.transform = 'translateX(-50%)';
        this.uiOverlay.style.color = '#fff';
        this.uiOverlay.style.fontFamily = 'sans-serif';
        this.uiOverlay.style.fontSize = '20px';
        this.uiOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.uiOverlay.style.padding = '15px 30px';
        this.uiOverlay.style.borderRadius = '8px';
        this.uiOverlay.style.textAlign = 'center';
        this.uiOverlay.style.display = 'none'; // Hidden by default
        this.uiOverlay.style.zIndex = '998';
        document.body.appendChild(this.uiOverlay);

        document.addEventListener('click', () => {
            if (!this.controls.isLocked) {
                this.controls.lock();
            }
        });

        const onKeyDown = (event: KeyboardEvent) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    if (this.canJump === true) this.velocity.y += 15;
                    this.canJump = false;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.isSprinting = true;
                    break;
                case 'KeyE':
                    if (this.currentMeme) {
                        this.speechSynth.cancel(); // Stop playing current audio
                        const textToRead = `${this.currentMeme.title}. ${this.currentMeme.history}`;
                        const utterance = new SpeechSynthesisUtterance(textToRead);
                        utterance.rate = 0.95;
                        utterance.pitch = 1.0;
                        utterance.volume = 1.0;
                        this.speechSynth.speak(utterance);
                    }
                    break;
            }
        };

        const onKeyUp = (event: KeyboardEvent) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.isSprinting = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    update(delta: number) {
        if (this.controls.isLocked === true) {
            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;
            this.velocity.y -= 9.8 * 4.0 * delta; // Gravity

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize(); // this ensures consistent movements in all directions

            const speed = this.isSprinting ? 240.0 : 100.0;

            if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * speed * delta;
            if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * speed * delta;

            const nextX = -this.velocity.x * delta;
            const nextZ = -this.velocity.z * delta;

            // X intersection test
            this.controls.moveRight(nextX);
            this.playerBox.setFromCenterAndSize(this.controls.object.position, new THREE.Vector3(2, 14, 2));
            let collidedX = false;
            for (let i = 0; i < this.colliders.length; i++) {
                if (this.playerBox.intersectsBox(this.colliders[i])) {
                    collidedX = true;
                    break;
                }
            }
            if (collidedX) {
                this.controls.moveRight(-nextX); // Undo move
                this.velocity.x = 0;
            }

            // Z intersection test
            this.controls.moveForward(nextZ);
            this.playerBox.setFromCenterAndSize(this.controls.object.position, new THREE.Vector3(2, 14, 2));
            let collidedZ = false;
            for (let i = 0; i < this.colliders.length; i++) {
                if (this.playerBox.intersectsBox(this.colliders[i])) {
                    collidedZ = true;
                    break;
                }
            }
            if (collidedZ) {
                this.controls.moveForward(-nextZ); // Undo move
                this.velocity.z = 0;
            }

            this.controls.object.position.y += (this.velocity.y * delta); // up/down movement

            // Simple floor collision
            if (this.controls.object.position.y < 7) {
                this.velocity.y = 0;
                this.controls.object.position.y = 7; 
                this.canJump = true;
            }

            // Raycasting for interactions (Audio Guide)
            this.raycaster.setFromCamera(this.centerVector, this.controls.object as THREE.Camera);
            const intersects = this.raycaster.intersectObjects(this.interactables, false);

            if (intersects.length > 0 && intersects[0].distance < 20) {
                const hit = intersects[0].object;
                const meme = hit.userData.meme as Meme;
                
                if (meme) {
                    this.currentMeme = meme;
                    this.uiOverlay.style.display = 'block';
                    this.uiOverlay.innerHTML = `<strong>${meme.title}</strong><br/><span style="font-size: 14px; color: #aaa;">Press E for Museum Audio Guide</span>`;
                }
            } else {
                this.currentMeme = null;
                this.uiOverlay.style.display = 'none';
            }
        }
    }
}
