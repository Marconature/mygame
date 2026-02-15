class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new GameRenderer(this.canvas);
        
        this.state = 'menu'; // menu, playing, ending
        this.timeRemaining = 180;
        this.lastTime = 0;
        this.player = null;
        this.characters = [];
        this.shadowNull = null;
        this.fractalViews = 0;
        this.connections = new Map();
        this.trust = 50;
        this.clarity = 100;
        this.decisionMapShown = false;
        this.selectedDecision = null;
        this.playerStress = 0;
        this.mouseHistory = [];
        this.lastMouseTime = Date.now();
        this.radioPlayed = false;
        this.criticalPoints = [120, 60, 30];
        this.criticalPointTriggered = [false, false, false];
        this.loopCount = 0;
        this.sleepPressed = false;
        this.sleepHeldTime = 0;
        this.sleepRequiredTime = 7;
        this.scratchMarks = [];
        
        this.playerShape = null;
        this.playerColor = null;
        
        // Non-Euclidean corridor tracking
        this.playerPositions = [];
        this.corridorShifted = false;
        this.corridorShiftCount = 0;
        
        this.setupEventListeners();
        this.setupCharacterCreation();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        
        // Sleep button mechanics (Space key or 'S' key)
        document.addEventListener('keydown', (e) => {
            if (this.state !== 'playing') return;
            if (e.code === 'Space' || e.code === 'KeyS') {
                this.sleepPressed = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.code === 'KeyS') {
                this.sleepPressed = false;
                this.sleepHeldTime = 0;
            }
        });
        
        // Sleep button click
        document.getElementById('sleep-btn')?.addEventListener('mousedown', () => {
            this.sleepPressed = true;
        });
        
        document.getElementById('sleep-btn')?.addEventListener('mouseup', () => {
            this.sleepPressed = false;
            this.sleepHeldTime = 0;
        });
        
        document.getElementById('sleep-btn')?.addEventListener('mouseleave', () => {
            this.sleepPressed = false;
            this.sleepHeldTime = 0;
        });
    }

    setupCharacterCreation() {
        const shapeSelectors = document.querySelectorAll('.shape-selector');
        const colorSelectors = document.querySelectorAll('.color-selector');
        const startBtn = document.getElementById('start-btn');
        
        shapeSelectors.forEach(selector => {
            selector.addEventListener('click', () => {
                shapeSelectors.forEach(s => s.classList.remove('selected'));
                selector.classList.add('selected');
                this.playerShape = selector.dataset.shape;
                this.checkStartButton(startBtn);
            });
        });
        
        colorSelectors.forEach(selector => {
            selector.addEventListener('click', () => {
                colorSelectors.forEach(c => c.classList.remove('selected'));
                selector.classList.add('selected');
                this.playerColor = selector.dataset.color;
                this.checkStartButton(startBtn);
            });
        });
    }

    checkStartButton(startBtn) {
        if (this.playerShape && this.playerColor) {
            startBtn.disabled = false;
        }
    }

    handleMouseMove(e) {
        if (this.state !== 'playing') return;
        
        const now = Date.now();
        const timeDelta = (now - this.lastMouseTime) / 1000;
        this.lastMouseTime = now;
        
        // Track mouse movement for panic detection
        this.mouseHistory.push({
            x: e.clientX,
            y: e.clientY,
            time: now
        });
        
        // Keep only last 2 seconds of history
        this.mouseHistory = this.mouseHistory.filter(m => now - m.time < 2000);
        
        // Calculate panic level based on mouse speed
        if (this.mouseHistory.length > 1) {
            const totalDistance = this.mouseHistory.reduce((sum, m, i, arr) => {
                if (i === 0) return 0;
                return sum + Math.hypot(m.x - arr[i-1].x, m.y - arr[i-1].y);
            }, 0);
            
            const speed = totalDistance / 2; // pixels per second
            this.playerStress = Math.min(1, speed / 1000);
        }
        
        // Update player position (smooth follow)
        if (this.player) {
            const oldX = this.player.x;
            const oldY = this.player.y;
            
            const dx = e.clientX - this.player.x;
            const dy = e.clientY - this.player.y;
            
            this.player.x += dx * 0.1;
            this.player.y += dy * 0.1;
            
            // Update rotation based on movement direction
            this.player.rotation = Math.atan2(dy, dx);
            
            // Track player positions for non-Euclidean corridor
            this.playerPositions.push({ x: this.player.x, y: this.player.y, time: now });
            
            // Keep last 5 seconds of positions
            this.playerPositions = this.playerPositions.filter(p => now - p.time < 5000);
            
            // Check for path repetition (non-Euclidean corridor shift)
            if (this.playerPositions.length > 50) {
                this.checkNonEuclideanShift();
            }
        }
    }

    checkNonEuclideanShift() {
        // Check if player has walked similar path before
        if (this.playerPositions.length < 100) return;
        
        const recentPositions = this.playerPositions.slice(-50);
        const olderPositions = this.playerPositions.slice(0, -50);
        
        // Calculate similarity between recent and older paths
        let similarCount = 0;
        const threshold = 30; // pixels
        
        recentPositions.forEach(recent => {
            olderPositions.forEach(older => {
                const dist = Math.hypot(recent.x - older.x, recent.y - older.y);
                if (dist < threshold) {
                    similarCount++;
                }
            });
        });
        
        // If significant similarity detected, trigger corridor shift
        if (similarCount > 20 && !this.corridorShifted) {
            this.triggerCorridorShift();
        }
    }

    triggerCorridorShift() {
        this.corridorShifted = true;
        this.corridorShiftCount++;
        
        // Visual effect
        this.showMessage('*Коридор искажается...*');
        sound.playStarSound(0.7);
        
        // Set renderer distortion
        this.renderer.setDistortion(1);
        
        // Shift character positions randomly
        this.characters.forEach(char => {
            if (char.name !== 'Коричневый Параллелепипед') { // Don't move the parallelepiped
                char.baseX += (Math.random() - 0.5) * 100;
                char.baseY += (Math.random() - 0.5) * 50;
                
                // Keep within bounds
                char.baseX = Math.max(100, Math.min(this.canvas.width - 100, char.baseX));
                char.baseY = Math.max(250, Math.min(this.canvas.height - 150, char.baseY));
                
                char.x = char.baseX;
                char.y = char.baseY;
            }
        });
        
        // Fade out distortion
        let fadeInterval = setInterval(() => {
            this.renderer.distortionLevel -= 0.05;
            if (this.renderer.distortionLevel <= 0) {
                this.renderer.distortionLevel = 0;
                clearInterval(fadeInterval);
            }
        }, 100);
        
        // Reset after some time
        setTimeout(() => {
            this.corridorShifted = false;
        }, 5000);
    }

    handleClick(e) {
        if (this.state !== 'playing') return;
        
        // Check if clicking on a character
        this.characters.forEach(char => {
            if (char.isDead) return;
            
            const dist = Math.hypot(e.clientX - char.x, e.clientY - char.y);
            if (dist < char.size * 1.5) {
                this.interactWithCharacter(char);
            }
        });
        
        // Check fractal clicks
        const corners = [
            { x: 50, y: 200 },
            { x: this.canvas.width - 50, y: 200 },
            { x: 50, y: this.canvas.height - 100 },
            { x: this.canvas.width - 50, y: this.canvas.height - 100 }
        ];
        
        corners.forEach(corner => {
            if (Math.hypot(e.clientX - corner.x, e.clientY - corner.y) < 100) {
                this.fractalViews++;
                if (this.fractalViews >= 3) {
                    this.timeRemaining = Math.max(1, this.timeRemaining);
                }
            }
        });
        
        // Check decision map clicks
        if (this.decisionMapShown && this.decisions) {
            this.decisions.forEach(decision => {
                const midX = (decision.start.x + decision.end.x) / 2;
                const midY = (decision.start.y + decision.end.y) / 2;
                
                if (Math.hypot(e.clientX - midX, e.clientY - midY) < 50) {
                    this.selectedDecision = decision;
                }
            });
        }
    }

    interactWithCharacter(char) {
        if (char.isDead) return;
        
        // Special character interactions
        if (char.name === 'Фиолетовая Звезда') {
            if (char.specialActive < 3) {
                char.specialActive++;
                this.timeRemaining += 3; // Slow countdown by 3 seconds
                char.say('*песня замедляет время*');
                sound.playStarSound(0.8);
            }
        }
        
        if (char.name === 'Золотой Шестиугольник' && !char.sacrificed) {
            char.sacrifice();
            this.timeRemaining += 15;
            this.showMessage('Эффект стабильности: +15 секунд');
            sound.playStarSound(1);
        }
        
        if (char.name === 'Белый Многогранник') {
            this.triggerHallucination();
        }
        
        if (char.name === 'Коричневый Параллелепипед') {
            char.say('*благодарит вас*');
            this.trust += 30;
        }
        
        // Regular interaction
        char.interact();
        this.trust = Math.min(100, this.trust + 5);
        
        // Play character-specific sound
        switch (char.shape) {
            case 'triangle': sound.playTriangleSound(0.5); break;
            case 'square': sound.playSquareSound(0.5); break;
            case 'circle': sound.playCircleSound(0.5); break;
            case 'star': sound.playStarSound(0.5); break;
        }
    }

    triggerHallucination() {
        // Visual effect - show all possible outcomes
        this.renderer.ctx.save();
        this.renderer.ctx.globalAlpha = 0.3;
        
        for (let i = 0; i < 9; i++) {
            this.renderer.ctx.translate(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100
            );
        }
        
        this.renderer.ctx.restore();
        
        this.showMessage('*Вы видите все возможные исходы simultaneously*');
    }

    startGame() {
        sound.init();
        
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2 + 50,
            size: 35,
            shape: this.playerShape,
            color: this.playerColor,
            rotation: 0
        };
        
        this.characters = CharacterFactory.createAll();
        this.timeRemaining = 180;
        this.state = 'playing';
        this.fractalViews = 0;
        this.trust = 50;
        this.clarity = 100;
        this.decisionMapShown = false;
        this.selectedDecision = null;
        this.criticalPointTriggered = [false, false, false];
        this.playerPositions = [];
        this.corridorShifted = false;
        
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('countdown').classList.remove('hidden');
        
        // Start radio message sequence
        setTimeout(() => this.playRadioSequence(), 3000);
        
        // Start ambient sound
        sound.startAmbientTension(0.3);
        
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    playRadioSequence() {
        if (this.state !== 'playing') return;
        
        this.showMessage('⬠ Из радиоприёмника: хруст помех...');
        sound.playRadioMessage();
        
        setTimeout(() => {
            this.showMessage('⬠ "Внимание. Код Омега. Через 180 секунд пространственно-временной коллапс..."');
        }, 1500);
        
        setTimeout(() => {
            this.showMessage('⬠ "Это не учения. Повторяю: это не учения."');
        }, 4000);
        
        setTimeout(() => {
            this.showMessage('');
        }, 6000);
    }

    showMessage(text) {
        const overlay = document.getElementById('message-overlay');
        overlay.textContent = text;
        overlay.classList.add('show');
        
        setTimeout(() => {
            overlay.classList.remove('show');
        }, 3000);
    }

    gameLoop(currentTime) {
        if (this.state !== 'playing') return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        if (this.timeRemaining > 0) {
            requestAnimationFrame((t) => this.gameLoop(t));
        } else {
            this.triggerEnding();
        }
    }

    update(deltaTime) {
        // Update countdown with player stress modifier
        let timeModifier = 1;
        if (this.playerStress > 0.7) {
            timeModifier = 1.05; // Panic speeds up countdown
        } else if (this.playerStress < 0.2) {
            timeModifier = 0.97; // Calm slows down countdown
        }
        
        // Check decision map pause
        if (this.decisionMapShown && !this.selectedDecision) {
            timeModifier = 0;
        } else if (this.decisionMapShown && this.selectedDecision) {
            timeModifier = 1;
            this.decisionMapShown = false;
        }
        
        // Handle sleep button (only active when time <= 5 seconds)
        if (this.timeRemaining <= 5 && this.sleepPressed) {
            this.sleepHeldTime += deltaTime;
            
            // Update sleep button visual
            const sleepBtn = document.getElementById('sleep-btn');
            if (sleepBtn) {
                const progress = this.sleepHeldTime / this.sleepRequiredTime;
                sleepBtn.style.setProperty('--sleep-progress', progress);
                
                if (progress >= 1) {
                    // Trigger dream ending
                    this.triggerDreamEnding();
                    return;
                }
            }
        } else {
            this.sleepHeldTime = 0;
            const sleepBtn = document.getElementById('sleep-btn');
            if (sleepBtn) {
                sleepBtn.style.setProperty('--sleep-progress', 0);
            }
        }
        
        this.timeRemaining -= deltaTime * timeModifier;
        this.timeRemaining = Math.max(0, this.timeRemaining);
        
        // Update countdown display
        this.updateCountdownDisplay();
        
        // Spawn shadow null at 30 seconds
        if (this.timeRemaining < 30 && !this.shadowNull) {
            this.shadowNull = CharacterFactory.createShadowNull(this.timeRemaining);
        }
        
        // Update characters
        this.characters.forEach(char => {
            const result = char.update(deltaTime, this.player.x, this.player.y, this.playerStress, this.timeRemaining);
            
            if (result === 'connected' && char.interacted) {
                const key = `${char.name}-player`;
                if (!this.connections.has(key)) {
                    this.connections.set(key, 0);
                }
                this.connections.set(key, Math.min(1, this.connections.get(key) + deltaTime * 0.2));
            }
            
            // Shadow null steals colors
            if (this.shadowNull && !char.colorStolen) {
                const distToShadow = Math.hypot(char.x - this.shadowNull.x, char.y - this.shadowNull.y);
                if (distToShadow < 100) {
                    char.color = '#666';
                    char.colorStolen = true;
                    this.showMessage(`Тень-Нуль украла цвет ${char.name}`);
                }
            }
        });
        
        // Update shadow null
        if (this.shadowNull) {
            this.shadowNull.x += (this.player.x - this.shadowNull.x) * 0.02;
            this.shadowNull.y += (this.player.y - this.shadowNull.y) * 0.02;
        }
        
        // Check critical points
        this.checkCriticalPoints();
        
        // Update ambient tension
        const tensionLevel = (180 - this.timeRemaining) / 180;
        sound.updateAmbientTension(tensionLevel);
        
        // Play ticking sound every second
        if (Math.floor(this.timeRemaining) < Math.floor(this.timeRemaining + deltaTime)) {
            const isPanic = this.playerStress > 0.7;
            const isSlow = this.playerStress < 0.2;
            sound.playTickingSound(isPanic, isSlow);
        }
        
        // Random character dialogue
        if (Math.random() < 0.005) {
            const randomChar = this.characters[Math.floor(Math.random() * this.characters.length)];
            if (!randomChar.isDead && randomChar.dialogue) {
                randomChar.say(randomChar.dialogue);
            }
        }
    }

    updateCountdownDisplay() {
        const countdownEl = document.getElementById('countdown');
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        countdownEl.textContent = display;
        
        // Update countdown style based on time and player stress
        countdownEl.classList.remove('panic', 'slow');
        
        if (this.playerStress > 0.7 || this.timeRemaining < 30) {
            countdownEl.classList.add('panic');
        } else if (this.playerStress < 0.2) {
            countdownEl.classList.add('slow');
        }
        
        // Pulsing animation
        const pulseIntensity = (this.timeRemaining / 180) * (1 + this.playerStress);
        countdownEl.style.transform = `translate(-50%, -50%) scale(${1 + (1 - pulseIntensity) * 0.1})`;
    }

    checkCriticalPoints() {
        const times = [120, 60, 30];
        
        times.forEach((time, i) => {
            if (this.timeRemaining <= time && this.timeRemaining > time - 3 && !this.criticalPointTriggered[i]) {
                this.criticalPointTriggered[i] = true;
                this.showDecisionMap();
            }
        });
    }

    showDecisionMap() {
        this.decisionMapShown = true;
        this.selectedDecision = null;
        
        // Create decision paths
        this.decisions = [
            {
                start: { x: this.player.x, y: this.player.y },
                end: { x: this.canvas.width / 2 - 200, y: this.canvas.height / 2 },
                color: '#ff4444',
                ending: 'escape'
            },
            {
                start: { x: this.player.x, y: this.player.y },
                end: { x: this.canvas.width / 2, y: this.canvas.height / 2 },
                color: '#44ff44',
                ending: 'community'
            },
            {
                start: { x: this.player.x, y: this.player.y },
                end: { x: this.canvas.width / 2 + 200, y: this.canvas.height / 2 },
                color: '#4444ff',
                ending: 'sacrifice'
            },
            {
                start: { x: this.player.x, y: this.player.y },
                end: { x: this.canvas.width / 2, y: this.canvas.height / 2 - 100 },
                color: '#ffff44',
                ending: 'illusion'
            }
        ];
        
        this.showMessage('ВЫБЕРИТЕ ПУТЬ');
        
        // Auto-select after 3 seconds if no choice
        setTimeout(() => {
            if (this.decisionMapShown && !this.selectedDecision) {
                this.selectedDecision = this.decisions[Math.floor(Math.random() * this.decisions.length)];
            }
        }, 3000);
    }

    render() {
        this.renderer.clear();
        this.renderer.drawGradientBackground(this.timeRemaining);
        this.renderer.drawGeometricCity(this.timeRemaining);
        this.renderer.drawApartment();
        this.renderer.drawFractal(this.timeRemaining);
        this.renderer.drawDistortionEffect();
        
        // Draw connections
        this.connections.forEach((intensity, key) => {
            const [charName] = key.split('-player');
            const char = this.characters.find(c => c.name === charName);
            if (char) {
                this.renderer.drawConnection(char, this.player, intensity);
            }
        });
        
        // Draw characters
        this.characters.forEach(char => {
            const pulseIntensity = char.stress;
            this.renderer.drawCharacter(char, pulseIntensity);
        });
        
        // Draw shadow null
        if (this.shadowNull) {
            this.renderer.drawCharacter(this.shadowNull, 1);
        }
        
        // Draw player
        this.renderer.drawPlayer(this.player);
        
        // Draw decision map
        if (this.decisionMapShown && this.decisions) {
            this.renderer.drawDecisionMap(this.decisions, this.timeRemaining);
        }
        
        // Draw collapse effect
        if (this.timeRemaining < 60) {
            this.renderer.drawCollapseEffect(this.timeRemaining);
        }
        
        // Draw sleep button (only visible when time <= 5 seconds)
        if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
            this.renderer.drawSleepButton(this.sleepHeldTime, this.sleepRequiredTime);
        }
        
        // Draw scratch marks from previous loops
        if (this.loopCount > 0) {
            this.renderer.drawScratchMarks(this.scratchMarks, this.player.shape);
        }
    }

    triggerDreamEnding() {
        this.state = 'ending';
        
        // Save scratch mark for this loop
        this.scratchMarks.push({
            x: this.player.x + (Math.random() - 0.5) * 50,
            y: this.player.y + (Math.random() - 0.5) * 50,
            shape: this.player.shape,
            color: this.player.color
        });
        
        // Play dream sound
        sound.playDreamSound();
        
        // Show dream transition
        this.showMessage('*Вы закрываете глаза...*');
        
        setTimeout(() => {
            // Reset to beginning
            this.loopCount++;
            this.timeRemaining = 180;
            this.state = 'playing';
            this.sleepPressed = false;
            this.sleepHeldTime = 0;
            
            // Reposition player in apartment
            this.player.x = this.canvas.width / 2;
            this.player.y = this.canvas.height / 2 + 50;
            
            // Reset characters but don't play radio again
            this.characters = CharacterFactory.createAll();
            this.shadowNull = null;
            this.connections.clear();
            this.trust = 50;
            this.clarity = 100;
            this.fractalViews = 0;
            this.criticalPointTriggered = [false, false, false];
            
            // Show message about loop
            this.showMessage(this.loopCount === 1 ? '06:57... Радио молчит.' : `Цикл ${this.loopCount + 1}`);
            
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.gameLoop(t));
        }, 2000);
    }

    triggerEnding() {
        this.state = 'ending';
        sound.playCollapseSound();
        sound.playSilence();
        
        // Determine ending based on player choices
        const ending = this.determineEnding();
        
        setTimeout(() => {
            this.showEnding(ending);
        }, 3000);
    }

    determineEnding() {
        const connectedCount = Array.from(this.connections.values()).filter(v => v >= 0.8).length;
        const helpedBrown = this.characters.find(c => c.name === 'Коричневый Параллелепипед')?.trust > 70;
        
        // Priority endings
        
        // Absolute - player stayed in apartment
        const inApartment = this.player.y > this.canvas.height / 2 + 100;
        if (inApartment && connectedCount < 3) {
            return 'absolute';
        }
        
        // Community - connected with 5+ characters
        if (connectedCount >= 5) {
            return 'community';
        }
        
        // Sacrifice - player helped others significantly
        if (this.trust > 80 && helpedBrown) {
            return 'community';
        }
        
        // Illusion - interacted with Purple Star 3+ times
        const purpleStar = this.characters.find(c => c.name === 'Фиолетовая Звезда');
        if (purpleStar && purpleStar.specialActive >= 3) {
            return 'illusion';
        }
        
        // Escape - player near exit
        const nearExit = this.player.x > this.canvas.width - 150;
        if (nearExit && this.timeRemaining < 5) {
            return 'escape';
        }
        
        // Loneliness - didn't help Brown Parallelepiped
        if (!helpedBrown && connectedCount >= 2) {
            return 'loneliness';
        }
        
        // Chaos - default
        return 'chaos';
    }

    showEnding(ending) {
        const endings = {
            absolute: {
                title: 'ФИНАЛ: АБСОЛЮТ',
                description: 'Вы остались одни в квартире. В 00:00 коллапс остановился. Вы стали новой точкой отсчёта реальности — ваша фигура распадается на бесконечные копии, каждая в своём мире. Вы — начало всего и конец всего одновременно.'
            },
            community: {
                title: 'ФИНАЛ: СООБЩЕСТВО',
                description: 'Вы объединили фигуры в круг перед коллапсом. Их цвета смешались в белый свет. Все исчезли, но в новом мире появились как единый организм. Развоплощённые, но бессмертные — вы теперь часть чего-то большего.'
            },
            loneliness: {
                title: 'ФИНАЛ: ОДИНОЧЕСТВО',
                description: 'Вы выжили, но многие остались позади. Коричневый Параллелепипед и его "семья" не смогли сбежать. Их эхо будет преследовать вас в новом мире. Вы спаслись, но потеряли часть себя.'
            },
            escape: {
                title: 'ФИНАЛ: БЕГСТВО',
                description: 'Вы добрались до улицы в последнюю секунду. Город уже распался в абстрактный хаос линий и точек. Вы — последняя упорядоченная форма. Начинается новая игра: "Построение мира заново".'
            },
            illusion: {
                title: 'ФИНАЛ: ИЛЛЮЗИЯ',
                description: 'Вы поверили Фиолетовой Звезде и остановили веру во время. Отсчёт застыл на 00:00. Но вы навсегда заперты в петле последней секунды — вечное "сейчас". Это рай или ад? Вы решаете.'
            },
            chaos: {
                title: 'ФИНАЛ: ХАОС',
                description: 'Вы пытались помочь всем, но не успели никого. В 00:00 все фигуры столкнулись в одну аморфную массу. Рождается новая вселенная без форм и законов. Может быть, это и было целью?'
            }
        };
        
        const endingData = endings[ending] || endings.chaos;
        
        document.getElementById('ending-title').textContent = endingData.title;
        document.getElementById('ending-description').textContent = endingData.description;
        document.getElementById('countdown').classList.add('hidden');
        document.getElementById('ending-screen').classList.remove('hidden');
        
        sound.stopAll();
    }

    restartGame() {
        document.getElementById('ending-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        this.state = 'menu';
        this.shadowNull = null;
        this.connections.clear();
        this.loopCount = 0;
        this.scratchMarks = [];
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
