import * as THREE from 'three';
import { Track } from './Track.js';
import { Car } from './Car.js';
import { AICar } from './AICar.js';
import { UIManager } from './UIManager.js';

export class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.ui = new UIManager(this);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        this.scene.fog = new THREE.Fog(0x111111, 20, 100);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 10);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();
        this.state = 'START'; // START, COUNTDOWN, RACING, FINISHED
        this.totalLaps = 3;

        this.init();
        this.animate();

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    init() {
        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // Track
        this.track = new Track(this.scene);
        this.track.checkpoints = this.track.getCheckpoints();

        // Cars
        this.playerCar = new Car(this.scene, 0xff00cc, this.track.path);
        this.playerCar.nextCheckpoint = 1;

        this.aiCars = [];
        for (let i = 0; i < 3; i++) {
            const ai = new AICar(this.scene, 0x00ffcc, this.track.path, i);
            ai.nextCheckpoint = 1;
            this.aiCars.push(ai);
        }

        // Bind Start Button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.resetGame();
        });
    }

    startGame() {
        this.ui.showHUD();
        this.startCountdown();
    }

    startCountdown() {
        this.state = 'COUNTDOWN';
        this.ui.startCountdown(() => {
            this.state = 'RACING';
        });
    }

    resetGame() {
        // Reload page for simplicity or reset all states
        window.location.reload();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const dt = this.clock.getDelta();

        if (this.state === 'RACING') {
            this.playerCar.update(dt);
            this.aiCars.forEach(car => car.update(dt));

            this.updateGameLogic();
            this.updateCamera();
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateCamera() {
        // Simple follow camera
        const carPos = this.playerCar.mesh.position;
        // Car forward is -Z (local). We want camera at +Z (local) to be behind.
        // But we rotated the mesh 180 degrees?
        // If mesh is rotated 180, Local -Z is World +Z.
        // So Car moves World +Z.
        // We want camera at World -Z relative to car.

        // Let's just use a fixed offset relative to car's rotation.
        // If car faces "forward", we want camera "back".
        // "Back" is +Z in local space (standard).

        const relativeCameraOffset = new THREE.Vector3(0, 4, 8); // Closer and slightly lower
        const cameraOffset = relativeCameraOffset.applyMatrix4(this.playerCar.mesh.matrixWorld);

        this.camera.position.lerp(cameraOffset, 0.1);
        this.camera.lookAt(carPos);
    }

    updateGameLogic() {
        // Check laps for player
        this.checkLap(this.playerCar);

        // Check laps for AI
        this.aiCars.forEach(car => this.checkLap(car));

        // Update UI
        this.ui.updateHUD(this.playerCar.speed, this.playerCar.lap, this.playerCar.racePosition, this.totalLaps);

        // Check finish
        if (this.playerCar.lap > this.totalLaps && this.state === 'RACING') {
            this.finishRace();
        }
    }

    checkLap(car) {
        if (!car.nextCheckpoint) car.nextCheckpoint = 0;
        if (!car.lap) car.lap = 1;

        const checkpoints = this.track.checkpoints;
        const nextCp = checkpoints[car.nextCheckpoint];
        const dist = car.mesh.position.distanceTo(nextCp.position);

        if (dist < 15) { // Threshold
            car.nextCheckpoint = (car.nextCheckpoint + 1) % checkpoints.length;
            if (car.nextCheckpoint === 0) {
                car.lap++;
            }
        }
    }

    finishRace() {
        this.state = 'FINISHED';
        this.ui.showEndScreen();
        document.getElementById('results').innerText = "You Finished!";
    }
}
