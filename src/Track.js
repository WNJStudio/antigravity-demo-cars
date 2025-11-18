import * as THREE from 'three';

export class Track {
    constructor(scene) {
        this.scene = scene;
        this.path = this.generatePath();
        this.createMesh();
    }

    generatePath() {
        const points = [];
        const pointCount = 20;
        const radius = 80;
        const variation = 30;

        for (let i = 0; i < pointCount; i++) {
            const angle = (i / pointCount) * Math.PI * 2;
            // Add random variation to radius
            const r = radius + (Math.random() * variation - variation / 2);
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            points.push(new THREE.Vector3(x, 0, z));
        }
        // Close the loop
        return new THREE.CatmullRomCurve3(points, true);
    }

    createMesh() {
        const geometry = new THREE.TubeGeometry(this.path, 200, 8, 8, true);
        // Texture or color
        const material = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8,
            side: THREE.BackSide,
            map: this.createTrackTexture()
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 0.1; // Slightly above ground
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        // Kerbs (red and white strips) - simplified as wireframe or second tube for now
        // Or just simple ground plane
        const planeGeo = new THREE.PlaneGeometry(1000, 1000);
        const planeMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.1;
        plane.receiveShadow = true;
        this.scene.add(plane);

        // Add some random obstacles or decorations?
    }

    createTrackTexture() {
        const width = 64;
        const height = 1;
        const size = width * height;
        const data = new Uint8Array(4 * size);

        const colorRoad = new THREE.Color(0x111111);
        const colorWall = new THREE.Color(0x00aaff); // Neon blue walls

        for (let i = 0; i < width; i++) {
            const t = i / width;
            // Tube UV u goes around. Assume 0.5 is bottom? Or 0?
            // Let's make a strip.
            // 0.25 to 0.75 is road?

            let color = colorWall;

            // Adjust these values to widen/narrow the road
            // TubeGeometry usually starts at top?
            // Let's try a pattern: Wall - Road - Wall
            if (t > 0.35 && t < 0.65) {
                color = colorRoad;
            }

            const stride = i * 4;
            data[stride] = Math.floor(color.r * 255);
            data[stride + 1] = Math.floor(color.g * 255);
            data[stride + 2] = Math.floor(color.b * 255);
            data[stride + 3] = 255;
        }

        const texture = new THREE.DataTexture(data, width, height);
        texture.needsUpdate = true;
        return texture;
    }

    getCheckpoints() {
        const checkpoints = [];
        const count = 20;
        for (let i = 0; i < count; i++) {
            const t = i / count;
            const point = this.path.getPointAt(t);
            // Calculate tangent for plane orientation
            const tangent = this.path.getTangentAt(t);
            checkpoints.push({
                position: point,
                tangent: tangent,
                index: i,
                passed: false // Per car tracking needed actually
            });
        }
        return checkpoints;
    }
}
