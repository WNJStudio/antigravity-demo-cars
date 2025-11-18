import { Car } from './Car.js';
import * as THREE from 'three';

export class AICar extends Car {
    constructor(scene, color, trackPath, index) {
        super(scene, color, trackPath);

        // Override input handling
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);

        // AI specific properties
        this.targetPoint = new THREE.Vector3();
        this.currentTrackT = (0.02 * (index + 1)) % 1; // Start at different positions
        this.speed = 0;
        this.maxSpeed = 35 + Math.random() * 5; // Random speed
        this.lookAhead = 0.05; // How far ahead to look on track

        // Initial position
        const startPoint = this.trackPath.getPointAt(this.currentTrackT);
        this.mesh.position.copy(startPoint);
        this.mesh.lookAt(this.trackPath.getPointAt((this.currentTrackT + 0.01) % 1));
        this.mesh.rotateY(Math.PI / 2);

    }

    update(dt) {
        // AI Logic
        // Move along the track path
        this.currentTrackT += (this.speed / this.trackPath.getLength()) * dt;
        if (this.currentTrackT >= 1) this.currentTrackT -= 1;

        const targetPos = this.trackPath.getPointAt(this.currentTrackT);
        const lookAtPos = this.trackPath.getPointAt((this.currentTrackT + this.lookAhead) % 1);

        // Simple movement: just teleport/lerp to track position for now to ensure they stay on track
        // Or better: steer towards the target point

        // Let's do simple steering behavior
        const directionToTarget = new THREE.Vector3().subVectors(lookAtPos, this.mesh.position).normalize();
        const currentForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);

        // Calculate angle to target
        const angle = currentForward.angleTo(directionToTarget);
        const cross = new THREE.Vector3().crossVectors(currentForward, directionToTarget);

        if (cross.y > 0) {
            this.mesh.rotation.y += this.turnSpeed * dt;
        } else {
            this.mesh.rotation.y -= this.turnSpeed * dt;
        }

        // Accelerate
        if (this.speed < this.maxSpeed) {
            this.speed += this.acceleration * dt;
        }

        // Move forward
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
        this.mesh.position.add(forward.multiplyScalar(this.speed * dt));
    }
}
