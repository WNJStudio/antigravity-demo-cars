export class UIManager {
    constructor(game) {
        this.game = game;
        this.startScreen = document.getElementById('start-screen');
        this.hud = document.getElementById('hud');
        this.endScreen = document.getElementById('end-screen');
        this.countdownEl = document.getElementById('countdown');
    }

    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.startScreen.classList.add('active');
        this.hud.classList.add('hidden');
        this.endScreen.classList.add('hidden');
        this.endScreen.classList.remove('active');
    }

    showHUD() {
        this.startScreen.classList.add('hidden');
        this.startScreen.classList.remove('active');
        this.hud.classList.remove('hidden');
        this.endScreen.classList.add('hidden');
    }

    showEndScreen() {
        this.hud.classList.add('hidden');
        this.endScreen.classList.remove('hidden');
        this.endScreen.classList.add('active');
    }

    updateHUD(speed, lap, position, totalLaps) {
        document.getElementById('speed').innerText = Math.floor(speed * 10) + ' km/h';
        document.getElementById('lap').innerText = `Lap: ${lap}/${totalLaps}`;
        // Position logic needs to be calculated in Game.js based on progress
        // document.getElementById('position').innerText = `Pos: ${position}/4`;
    }

    startCountdown(callback) {
        this.countdownEl.classList.remove('hidden');
        let count = 3;
        this.countdownEl.innerText = count;

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                this.countdownEl.innerText = count;
            } else if (count === 0) {
                this.countdownEl.innerText = 'GO!';
                if (callback) callback();

                // Hide after 1 second
                setTimeout(() => {
                    this.countdownEl.classList.add('hidden');
                }, 1000);

                clearInterval(interval);
            }
        }, 1000);
    }
}
