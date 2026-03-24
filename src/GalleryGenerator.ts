import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { memes2025 } from './memes2025.ts';

export function generateGallery(scene: THREE.Scene): { colliders: THREE.Box3[], interactables: THREE.Mesh[] } {
    const colliders: THREE.Box3[] = [];
    const interactables: THREE.Mesh[] = [];
    
    // Gallery dimensions
    const roomWidth = 40;
    const roomDepth = 120;
    const wallHeight = 20;

    const galleryGroup = new THREE.Group();
    scene.add(galleryGroup);

    // Procedural Wood Floor Texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        // Base wood color
        ctx.fillStyle = '#4a2f1d';
        ctx.fillRect(0, 0, 1024, 1024);
        
        // Draw wood grain (thin horizontal strips with varying opacity and slight color shifts)
        for (let i = 0; i < 1500; i++) {
            ctx.fillStyle = `rgba(20, 10, 5, ${Math.random() * 0.15})`;
            ctx.fillRect(0, Math.random() * 1024, 1024, Math.random() * 4 + 1);
        }
        
        // Draw plank separating lines
        const numPlanks = 16;
        const plankHeight = 1024 / numPlanks;
        ctx.strokeStyle = '#1a0f05';
        ctx.lineWidth = 4;
        
        for (let i = 0; i <= numPlanks; i++) {
            const y = i * plankHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(1024, y);
            ctx.stroke();
            
            // Add vertical plank cuts periodically to separate boards
            for (let j = 0; j < 4; j++) {
                const x = Math.random() * 1024;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + plankHeight);
                ctx.stroke();
            }
        }
    }
    const woodTexture = new THREE.CanvasTexture(canvas);
    woodTexture.needsUpdate = true;
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(roomWidth / 4, roomDepth / 4);
    woodTexture.colorSpace = THREE.SRGBColorSpace;

    // Fine Art Gallery Materials
    const floorMat = new THREE.MeshStandardMaterial({ map: woodTexture, color: 0xffffff, roughness: 0.25, metalness: 0.1 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a5d6e, roughness: 0.9, metalness: 0.1 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.9 });
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.8, metalness: 0.1 });

    // 1. Floor
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    galleryGroup.add(floor);

    // 2. Ceiling
    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight;
    galleryGroup.add(ceiling);

    // Wall logic mapping
    const addWall = (width: number, x: number, z: number, rotY: number) => {
        const wallGeo = new THREE.BoxGeometry(width, wallHeight, 2);
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(x, wallHeight / 2, z);
        wall.rotation.y = rotY;
        wall.castShadow = true;
        wall.receiveShadow = true;
        galleryGroup.add(wall);

        wall.updateMatrixWorld(true);
        colliders.push(new THREE.Box3().setFromObject(wall));

        // Baseboard Wood Trim
        const trimHeight = 1.0;
        const trimDepth = 2.4; // Slightly thicker than wall to protrude
        const trimGeo = new THREE.BoxGeometry(width, trimHeight, trimDepth);
        const trim = new THREE.Mesh(trimGeo, baseboardMat);
        trim.position.set(x, trimHeight / 2, z);
        trim.rotation.y = rotY;
        trim.receiveShadow = true;
        galleryGroup.add(trim);
    };

    // 3. Build the 4 enclosing walls
    addWall(roomWidth, 0, -roomDepth / 2 - 1, 0); // North (Front) wall
    addWall(roomWidth, 0, roomDepth / 2 + 1, 0);  // South (Back) wall
    addWall(roomDepth, -roomWidth / 2 - 1, 0, Math.PI / 2); // West wall
    addWall(roomDepth, roomWidth / 2 + 1, 0, Math.PI / 2);  // East wall

    // 4. Hang Memes from Local 2025 Catalog
    const textureLoader = new THREE.TextureLoader();
    let currentMemeIndex = 0;

    const hangPicture = (x: number, y: number, z: number, rotY: number) => {
        if (currentMemeIndex >= memes2025.length) return;
        const meme = memes2025[currentMemeIndex++];

        textureLoader.load(meme.url, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            
            // Maintain aspect ratio inside a bounding box
            const targetHeight = 8;
            const aspect = texture.image.width / texture.image.height;
            const width = targetHeight * aspect;

            // Classic Ornate Museum Frame
            const frameGroup = new THREE.Group();
            frameGroup.position.set(x, y, z);
            frameGroup.rotation.y = rotY;

            // Outer dark gold molding
            const outerMat = new THREE.MeshStandardMaterial({ color: 0x8a6d22, metalness: 0.9, roughness: 0.4 });
            const outerGeo = new THREE.BoxGeometry(width + 1.2, targetHeight + 1.2, 0.4);
            const outerFrame = new THREE.Mesh(outerGeo, outerMat);
            outerFrame.castShadow = true;

            // Middle bright gold bevel
            const midMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.1 });
            const midGeo = new THREE.BoxGeometry(width + 0.8, targetHeight + 0.8, 0.5);
            const midFrame = new THREE.Mesh(midGeo, midMat);
            midFrame.position.z = 0.05;

            // Inner white matting spacer
            const innerMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.9 });
            const innerGeo = new THREE.BoxGeometry(width + 0.3, targetHeight + 0.3, 0.55);
            const innerFrame = new THREE.Mesh(innerGeo, innerMat);
            innerFrame.position.z = 0.08;

            frameGroup.add(outerFrame, midFrame, innerFrame);
            galleryGroup.add(frameGroup);

            // Canvas
            const canvasGeo = new THREE.PlaneGeometry(width, targetHeight);
            const canvasMat = new THREE.MeshBasicMaterial({ map: texture });
            const canvas = new THREE.Mesh(canvasGeo, canvasMat);
            // Push canvas strictly to the front depth of the inner matting (0.55/2 + 0.08 = 0.355)
            const offset = 0.36;
            canvas.position.set(x + Math.sin(rotY) * offset, y, z + Math.cos(rotY) * offset);
            canvas.rotation.y = rotY;
            
            // Interaction tagging
            canvas.userData = { meme };
            interactables.push(canvas);
            galleryGroup.add(canvas);

            // Plaque (Golden brass)
            const pX = x + Math.sin(rotY) * 0.05;
            const pY = y - (targetHeight / 2) - 1.2;
            const pZ = z + Math.cos(rotY) * 0.05;
            const plaqueGeo = new THREE.BoxGeometry(2, 0.5, 0.1);
            const plaqueMat = new THREE.MeshStandardMaterial({ color: 0xcfb53b, metalness: 0.9, roughness: 0.2 });
            const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
            plaque.position.set(pX, pY, pZ);
            plaque.rotation.y = rotY;

            // Plaque Text Canvas
            const textCanvas = document.createElement('canvas');
            textCanvas.width = 512;
            textCanvas.height = 128;
            const ctx = textCanvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#cfb53b';
                ctx.fillRect(0, 0, 512, 128);
                ctx.font = 'bold 36px sans-serif';
                ctx.fillStyle = '#222';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (meme.title.length > 20) {
                     ctx.font = 'bold 28px sans-serif'; 
                }
                ctx.fillText(meme.title, 256, 64);
            }
            const textTexture = new THREE.CanvasTexture(textCanvas);
            textTexture.colorSpace = THREE.SRGBColorSpace;
            const textMat = new THREE.MeshBasicMaterial({ map: textTexture });
            const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.4), textMat);
            textPlane.position.set(pX + Math.sin(rotY) * 0.06, pY, pZ + Math.cos(rotY) * 0.06);
            textPlane.rotation.y = rotY;
            
            plaque.userData = { meme };
            textPlane.userData = { meme };
            interactables.push(plaque, textPlane);
            galleryGroup.add(plaque, textPlane);

            // Picture Light Fixture
            const fixtureGroup = new THREE.Group();
            fixtureGroup.position.set(x + Math.sin(rotY) * 0.6, y + (targetHeight / 2) + 0.9, z + Math.cos(rotY) * 0.6);
            fixtureGroup.rotation.y = rotY;

            const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6);
            const arm = new THREE.Mesh(armGeo, plaqueMat);
            arm.rotation.x = Math.PI / 2;
            arm.position.z = -0.3; // extend back into the wall
            
            // Half-cylinder hood
            const hoodGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 16, 1, false, 0, Math.PI);
            const hoodMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2, side: THREE.DoubleSide });
            const hood = new THREE.Mesh(hoodGeo, hoodMat);
            hood.rotation.z = Math.PI / 2;
            hood.rotation.x = -Math.PI / 6; // Angle down towards the painting
            
            // Glowing bulb strip inside
            const bulbGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.4);
            const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
            const bulb = new THREE.Mesh(bulbGeo, bulbMat);
            bulb.rotation.z = Math.PI / 2;
            bulb.position.y = -0.05;
            bulb.position.z = 0.05;

            fixtureGroup.add(arm, hood, bulb);
            galleryGroup.add(fixtureGroup);

            // Dedicated Spotlight perfectly angled from the hood
            const spotLight = new THREE.SpotLight(0xffffee, 50);
            const lX = x + Math.sin(rotY) * 0.7;
            const lY = y + (targetHeight / 2) + 0.8;
            const lZ = z + Math.cos(rotY) * 0.7;
            spotLight.position.set(lX, lY, lZ);
            spotLight.target = canvas;
            spotLight.angle = Math.PI / 3;
            spotLight.penumbra = 0.6;
            // Removing castShadow here saves 16 Texture units, fixing the WebGL MAX_TEXTURE_IMAGE_UNITS crash
            galleryGroup.add(spotLight);
        });
    };

    // Calculate positions along the West and East walls
    const numMemes = memes2025.length; // 16
    const memesPerWall = Math.ceil(numMemes / 2); // 8
    
    // Distribute cleanly across the 120-unit room with 15-unit spacing (total string length = 105)
    const spacing = 15;
    const startZ = -52.5;

    for (let i = 0; i < memesPerWall; i++) {
        const z = startZ + (i * spacing);
        // Hang on West Wall (facing East)
        hangPicture(-roomWidth / 2 + 0.1, 8, z, Math.PI / 2);
        // Hang on East Wall (facing West)
        hangPicture(roomWidth / 2 - 0.1, 8, z, -Math.PI / 2);
    }

    // 4b. Setup Main Menu Wall on the North small wall (in front of spawn)
    const menuGeo = new THREE.PlaneGeometry(30, 16);
    const menuCanvas = document.createElement('canvas');
    menuCanvas.width = 1024; menuCanvas.height = 512;
    const mctx = menuCanvas.getContext('2d');
    if (mctx) {
        mctx.clearRect(0,0,1024,512); // Transparent background
        
        mctx.fillStyle = '#00ffcc';
        mctx.font = 'bold 72px sans-serif';
        mctx.textAlign = 'center';
        mctx.textBaseline = 'middle';
        mctx.fillText('Welcome to the Memeceum', 512, 120);
        
        mctx.font = '36px sans-serif';
        mctx.fillStyle = '#ffffff';
        mctx.fillText('WASD / Arrows to Move', 512, 260);
        mctx.fillText('Mouse to Look Around', 512, 320);
        
        mctx.fillStyle = '#cfb53b';
        mctx.fillText("Look at a Painting and Press 'E' for Audio Guide", 512, 400);
    }
    const menuTex = new THREE.CanvasTexture(menuCanvas);
    menuTex.needsUpdate = true;
    menuTex.colorSpace = THREE.SRGBColorSpace;
    const menuMat = new THREE.MeshBasicMaterial({ map: menuTex, transparent: true });
    const menuMesh = new THREE.Mesh(menuGeo, menuMat);
    menuMesh.position.set(0, 10, -roomDepth / 2 + 0.1); // North Wall
    menuMesh.rotation.y = 0; // Face inwards (looking towards +Z South)
    galleryGroup.add(menuMesh);

    // 5. Centerpiece 3D Models on Plinths
    const gltfLoader = new GLTFLoader();
    const models = [
        { name: 'Robot', url: '/models/RobotExpressive.glb', scale: 0.5 },
        { name: 'Flamingo', url: '/models/Flamingo.glb', scale: 0.02 },
        { name: 'Parrot', url: '/models/Parrot.glb', scale: 0.02 },
        { name: 'Stork', url: '/models/Stork.glb', scale: 0.02 },
        { name: 'Horse', url: '/models/Horse.glb', scale: 0.015 }
    ];

    const plinthMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.05 });
    
    // Custom architectural classical pedestal
    const createPlinth = () => {
        const group = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 3), plinthMat);
        base.position.y = 0.25;
        base.castShadow = true; base.receiveShadow = true;
        
        const column = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 3.0, 32), plinthMat);
        column.position.y = 2.0;
        column.castShadow = true; column.receiveShadow = true;
        
        const top = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 2.5), plinthMat);
        top.position.y = 3.75;
        top.castShadow = true; top.receiveShadow = true;
        
        group.add(base, column, top);
        return group;
    };

    // Center the 5 plinths across the 120 depth room
    const pSpacing = 20;
    const pStartZ = -40;

    models.forEach((modelInfo, index) => {
        const z = pStartZ + index * pSpacing;

        // Plinth
        const plinth = createPlinth();
        plinth.position.set(0, 0, z); 
        galleryGroup.add(plinth);

        plinth.updateMatrixWorld(true);
        colliders.push(new THREE.Box3().setFromObject(plinth));

        // Plinth Spotlight
        const pSpotLight = new THREE.SpotLight(0xffffff, 80);
        pSpotLight.position.set(0, 18, z);
        pSpotLight.target = plinth;
        pSpotLight.angle = Math.PI / 8;
        pSpotLight.penumbra = 0.5;
        pSpotLight.castShadow = true;
        galleryGroup.add(pSpotLight);

        // Load Model
        gltfLoader.load(modelInfo.url, (gltf) => {
            const model = gltf.scene;
            model.scale.setScalar(modelInfo.scale);
            model.position.set(0, 4.2, z);

            model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            galleryGroup.add(model);
        });
    });

    return { colliders, interactables };
}
