class Character {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.baseX = config.x;
        this.baseY = config.y;
        this.size = config.size || 40;
        this.shape = config.shape;
        this.color = config.color;
        this.name = config.name;
        this.dialogue = config.dialogue;
        this.behavior = config.behavior || 'idle';
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.stress = config.stress || 0;
        this.opacity = 1;
        this.interacted = false;
        this.connectionTime = 0;
        this.isDead = false;
        this.trust = 50;
        this.moved = false;
        this.voiceLine = '';
        this.voiceTimer = 0;
        this.specialActive = false;
        this.specialTimer = 0;
        this.sacrificed = false;
        this.colorStolen = false;
    }

    update(deltaTime, playerX, playerY, panicLevel, timeRemaining) {
        this.pulsePhase += deltaTime * (2 + this.stress * 3);
        
        const distToPlayer = Math.hypot(this.x - playerX, this.y - playerY);
        
        if (distToPlayer < 5) {
            this.connectionTime += deltaTime;
            if (this.connectionTime > 5) {
                return 'connected';
            }
        } else {
            this.connectionTime = Math.max(0, this.connectionTime - deltaTime);
        }
        
        this.stress = Math.min(1, this.stress + deltaTime * 0.01 * panicLevel);
        
        this.opacity = 0.6 + Math.sin(this.pulsePhase) * 0.2 * this.stress;
        
        if (this.voiceTimer > 0) {
            this.voiceTimer -= deltaTime;
            if (this.voiceTimer <= 0) {
                this.voiceLine = '';
            }
        }
        
        this.executeBehavior(deltaTime, timeRemaining);
        
        return null;
    }

    executeBehavior(deltaTime, timeRemaining) {
        switch (this.behavior) {
            case 'aggressive':
                if (!this.moved) {
                    this.x += (Math.random() - 0.5) * 2;
                    this.y += (Math.random() - 0.5) * 2;
                }
                break;
            case 'calm':
                this.x = this.baseX + Math.sin(this.pulsePhase * 0.5) * 5;
                break;
            case 'fearful':
                this.x = this.baseX + Math.sin(this.pulsePhase * 2) * 10;
                this.y = this.baseY + Math.cos(this.pulsePhase * 2) * 5;
                break;
            case 'erratic':
                this.x = this.baseX + Math.sin(this.pulsePhase * 3) * 15 * (Math.random() > 0.5 ? 1 : -1);
                this.y = this.baseY + Math.cos(this.pulsePhase * 2.5) * 10;
                break;
            case 'invisible':
                this.opacity = 0.2 + Math.sin(this.pulsePhase) * 0.1;
                break;
            case 'floating':
                this.y = this.baseY + Math.sin(this.pulsePhase) * 10 - 20;
                break;
        }
        
        this.x = Math.max(50, Math.min(window.innerWidth - 50, this.x));
        this.y = Math.max(200, Math.min(window.innerHeight - 100, this.y));
    }

    say(text) {
        this.voiceLine = text;
        this.voiceTimer = 3;
    }

    interact() {
        this.interacted = true;
        this.trust += 20;
        return this.dialogue;
    }

    sacrifice() {
        this.sacrificed = true;
        this.isDead = true;
        this.opacity = 0;
    }
}

class CharacterFactory {
    static createAll() {
        const characters = [];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Красный Треугольник - агрессивный, бывший охранник
        characters.push(new Character({
            x: centerX - 200,
            y: centerY - 50,
            shape: 'triangle',
            color: '#dc143c',
            name: 'Красный Треугольник',
            dialogue: 'В лифт! Я знаю код!',
            behavior: 'aggressive',
            stress: 0.8
        }));
        
        // Синий Квадрат - спокойный, инженер
        characters.push(new Character({
            x: centerX - 150,
            y: centerY + 30,
            shape: 'square',
            color: '#00bfff',
            name: 'Синий Квадрат',
            dialogue: 'Лестница. Лифт — смертельная ловушка.',
            behavior: 'calm',
            stress: 0.3
        }));
        
        // Зелёный Круг - гипнотический, ботаник
        characters.push(new Character({
            x: centerX - 100,
            y: centerY - 80,
            shape: 'circle',
            color: '#50c878',
            name: 'Зелёный Круг',
            dialogue: 'Подвал. Там бункер. Я видел чертежи...',
            behavior: 'fearful',
            stress: 0.6
        }));
        
        // Фиолетовая Звезда - мистик
        characters.push(new Character({
            x: centerX - 50,
            y: centerY + 50,
            shape: 'star',
            color: '#9966cc',
            name: 'Фиолетовая Звезда',
            dialogue: 'Конец — иллюзия. Нужно просто перестать верить во время.',
            behavior: 'erratic',
            stress: 0.5
        }));
        
        // Оранжевая Трапеция - ПТСР, спасатель
        characters.push(new Character({
            x: centerX + 20,
            y: centerY - 60,
            shape: 'trapezoid',
            color: '#ffc800',
            name: 'Оранжевая Трапеция',
            dialogue: '*бросает аптечку* Берите! Быстро!',
            behavior: 'erratic',
            stress: 0.9
        }));
        
        // Чёрный Ромб - параноик
        characters.push(new Character({
            x: centerX + 80,
            y: centerY + 20,
            shape: 'rhombus',
            color: '#1a1a1a',
            name: 'Чёрный Ромб',
            dialogue: 'Останьтесь здесь. Движение ускорит коллапс.',
            behavior: 'invisible',
            stress: 0.7
        }));
        
        // Золотой Шестиугольник - жертвенность
        characters.push(new Character({
            x: centerX + 130,
            y: centerY - 40,
            shape: 'hexagon',
            color: '#ffd700',
            name: 'Золотой Шестиугольник',
            dialogue: '',
            behavior: 'floating',
            stress: 0.1
        }));
        
        // Серебряный Цилиндр - зеркало
        characters.push(new Character({
            x: centerX + 180,
            y: centerY + 40,
            shape: 'cylinder',
            color: '#c0c0c0',
            name: 'Серебряный Цилиндр',
            dialogue: '...',
            behavior: 'calm',
            stress: 0.2
        }));
        
        // Белый Многогранник - хаос
        characters.push(new Character({
            x: centerX - 180,
            y: centerY + 80,
            shape: 'icosahedron',
            color: '#ffffff',
            name: 'Белый Многогранник',
            dialogue: '*белый шум*',
            behavior: 'erratic',
            stress: 0.4
        }));
        
        // Коричневый Параллелепипед - семья
        characters.push(new Character({
            x: centerX + 50,
            y: centerY + 90,
            shape: 'parallelepiped',
            color: '#8b4513',
            name: 'Коричневый Параллелепипед',
            dialogue: '*молчит, несёт на себе миниатюрные фигуры*',
            behavior: 'calm',
            stress: 0.5
        }));
        
        return characters;
    }

    static createShadowNull(time) {
        if (time < 30) {
            return new Character({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                shape: 'void',
                color: '#000000',
                name: 'Тень-Нуль',
                dialogue: '',
                behavior: 'invisible',
                stress: 1,
                size: 60
            });
        }
        return null;
    }
}
