import * as THREE from 'three';

export class Car {
    constructor(scene, color, trackPath) {
        this.scene = scene;
        this.trackPath = trackPath;

        this.mesh = this.createMesh(color);
        this.scene.add(this.mesh);

        this.speed = 0;
        this.maxSpeed = 40;
        this.acceleration = 20;
        this.friction = 0.988;
        this.turnSpeed = 2.5;

        // Position on track (0 to 1)
        this.trackPosition = 0;

        // Place car on track
        if (this.trackPath) {
            const startPoint = this.trackPath.getPointAt(0);
            this.mesh.position.copy(startPoint);
            this.mesh.position.y = 0;

            // Face the right direction
            const lookAtPoint = this.trackPath.getPointAt(0.01);
            this.mesh.lookAt(lookAtPoint);
            this.mesh.rotateY(Math.PI);
        }

        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(e) {
        switch (e.code) {
            case 'ArrowUp': case 'KeyW': this.keys.forward = true; break;
            case 'ArrowDown': case 'KeyS': this.keys.backward = true; break;
            case 'ArrowLeft': case 'KeyA': this.keys.left = true; break;
            case 'ArrowRight': case 'KeyD': this.keys.right = true; break;
        }
    }

    onKeyUp(e) {
        switch (e.code) {
            case 'ArrowUp': case 'KeyW': this.keys.forward = false; break;
            case 'ArrowDown': case 'KeyS': this.keys.backward = false; break;
            case 'ArrowLeft': case 'KeyA': this.keys.left = false; break;
            case 'ArrowRight': case 'KeyD': this.keys.right = false; break;
        }
    }

    createMesh(color) {
        const group = new THREE.Group();

        // Body
        const bodyGeo = new THREE.BoxGeometry(2, 0.5, 4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.5;
        body.castShadow = true;
        group.add(body);

        // Cabin
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.4, 2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.y = 1;
        cabin.position.z = -0.5;
        cabin.castShadow = true;
        group.add(cabin);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        wheelGeo.rotateZ(Math.PI / 2);

        const wheels = [
            { x: 1.1, z: 1.2 },
            { x: -1.1, z: 1.2 },
            { x: 1.1, z: -1.2 },
            { x: -1.1, z: -1.2 }
        ];

        wheels.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(pos.x, 0.4, pos.z);
            wheel.castShadow = true;
            group.add(wheel);
        });

        return group;
    }

    update(dt) {
        // Acceleration
        if (this.keys.forward) {
            this.speed += this.acceleration * dt;
        } else if (this.keys.backward) {
            this.speed -= this.acceleration * dt;
        }

        // Friction
        this.speed *= this.friction;

        // Cap speed
        if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        if (this.speed < -this.maxSpeed / 2) this.speed = -this.maxSpeed / 2;

        // Steering
        if (Math.abs(this.speed) > 0.1) {
            const turn = this.turnSpeed * dt * (this.speed / this.maxSpeed);
            if (this.keys.left) {
                this.mesh.rotation.y -= turn; // +Y is Left
            } else if (this.keys.right) {
                this.mesh.rotation.y += turn; // -Y is Right
            }
        }

        // Movement
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.mesh.rotation.y);

        // Predict next position
        const nextPos = this.mesh.position.clone().add(forward.multiplyScalar(this.speed * dt));

        // Update track position estimate for collision
        if (this.trackPath) {
            const trackLength = this.trackPath.getLength();

            const carDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
            const trackTangent = this.trackPath.getTangentAt(this.trackPosition % 1);
            const dot = carDir.dot(trackTangent);

            // Move t based on speed projected onto tangent
            const progress = (this.speed * dt * dot) / trackLength;
            this.trackPosition += progress;

            // Wrap t
            if (this.trackPosition < 0) this.trackPosition += 1;
            if (this.trackPosition >= 1) this.trackPosition -= 1;

            // Refine trackPosition to find actual closest point
            // This corrects any drift from the integration above
            let bestT = this.trackPosition;
            let bestDist = Infinity;
            const searchRange = 0.01; // Search +/- 1% of track
            const steps = 10;

            for (let i = -steps; i <= steps; i++) {
                let t = this.trackPosition + (i / steps) * searchRange;
                if (t < 0) t += 1;
                if (t >= 1) t -= 1;

                const pt = this.trackPath.getPointAt(t);
                const d = nextPos.distanceTo(pt);
                if (d < bestDist) {
                    bestDist = d;
                    bestT = t;
                }
            }
            this.trackPosition = bestT;

            // Get point on track at this t
            const trackPoint = this.trackPath.getPointAt(this.trackPosition);

            // Distance from track center line
            const dist = nextPos.distanceTo(trackPoint);

            // Tube radius is 8. Let's give some leeway, say 6.
            if (dist > 6) {
                // Collision!
                // Push back towards track center
                const toCenter = trackPoint.clone().sub(nextPos).normalize();
                // Soft push
                nextPos.add(toCenter.multiplyScalar(dist - 6));

                // Dampen speed (friction with wall)
                this.speed *= 0.9;
            }
        }

        this.mesh.position.copy(nextPos);
    }
}
