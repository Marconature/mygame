class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        
        this.gradientCache = {};
        this.glowIntensity = 0;
        this.distortionLevel = 0;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    clear() {
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setDistortion(level) {
        this.distortionLevel = level;
    }

    drawDistortionEffect() {
        if (this.distortionLevel <= 0) return;
        
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = this.distortionLevel * 0.3;
        
        // Draw distortion lines
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const length = 50 + Math.random() * 100;
            
            ctx.strokeStyle = `hsl(${Math.random() * 60 + 240}, 70%, 50%)`;
            ctx.lineWidth = 1 + Math.random() * 2;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + length * (Math.random() - 0.5), y + length * (Math.random() - 0.5));
            ctx.stroke();
        }
        
        // Draw geometric distortions
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = 20 + Math.random() * 40;
            
            ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const angle = (j * Math.PI / 3);
                const px = x + Math.cos(angle) * size;
                const py = y + Math.sin(angle) * size;
                if (j === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }
        
        ctx.restore();
    }

    drawGradientBackground(time) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        const timeFactor = time / 180;
        
        gradient.addColorStop(0, `rgba(${100 - timeFactor * 100}, ${80 - timeFactor * 80}, ${120 - timeFactor * 80}, 0.3)`);
        gradient.addColorStop(0.5, `rgba(${30 - timeFactor * 30}, ${30 - timeFactor * 30}, ${50 - timeFactor * 30}, 0.2)`);
        gradient.addColorStop(1, `rgba(${10 - timeFactor * 10}, ${10 - timeFactor * 10}, ${20 - timeFactor * 10}, 0.4)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGeometricCity(time) {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Draw distant city skyline
        ctx.save();
        ctx.globalAlpha = 0.1 + (time / 180) * 0.2;
        
        for (let i = 0; i < 20; i++) {
            const x = (i * this.canvas.width / 10) % this.canvas.width;
            const height = 50 + Math.sin(i * 0.5 + time * 0.01) * 30;
            
            ctx.fillStyle = `hsl(${220 + i * 10}, 30%, ${20 + Math.sin(time * 0.02 + i) * 10}%)`;
            ctx.fillRect(x, this.canvas.height - height - 100, this.canvas.width / 15, height);
        }
        
        ctx.restore();
    }

    drawApartment() {
        const ctx = this.ctx;
        
        // Door frame
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.canvas.width / 2 - 100, 100, 200, 150);
        
        // Door opening
        ctx.fillStyle = '#111';
        ctx.fillRect(this.canvas.width / 2 - 90, 110, 180, 130);
        
        // Corridor depth effect
        const corridorGradient = ctx.createLinearGradient(
            this.canvas.width / 2, 250,
            this.canvas.width / 2, this.canvas.height
        );
        corridorGradient.addColorStop(0, 'rgba(20, 20, 30, 0.8)');
        corridorGradient.addColorStop(1, 'rgba(5, 5, 10, 1)');
        
        ctx.fillStyle = corridorGradient;
        ctx.fillRect(this.canvas.width / 2 - 80, 250, 160, this.canvas.height - 250);
        
        // Perspective lines
        ctx.strokeStyle = 'rgba(50, 50, 70, 0.3)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(this.canvas.width / 2 - 90, 240);
        ctx.lineTo(this.canvas.width / 2 - 150, this.canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.canvas.width / 2 + 90, 240);
        ctx.lineTo(this.canvas.width / 2 + 150, this.canvas.height);
        ctx.stroke();
    }

    drawCharacter(character, pulseIntensity) {
        if (character.isDead || character.opacity <= 0.01) return;
        
        const ctx = this.ctx;
        ctx.save();
        
        ctx.globalAlpha = character.opacity;
        ctx.translate(character.x, character.y);
        
        // Glow effect
        const glowSize = character.size * (1 + pulseIntensity * 0.3);
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        glowGradient.addColorStop(0, this.hexToRgba(character.color, 0.4));
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Main shape
        ctx.fillStyle = character.color;
        ctx.strokeStyle = this.lightenColor(character.color, 30);
        ctx.lineWidth = 2 + pulseIntensity;
        
        this.drawShape(ctx, character.shape, character.size);
        
        ctx.restore();
        
        // Draw voice line
        if (character.voiceLine) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, character.voiceTimer);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(character.voiceLine, character.x, character.y - character.size - 10);
            ctx.restore();
        }
    }

    drawShape(ctx, shape, size) {
        ctx.beginPath();
        
        switch (shape) {
            case 'triangle':
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.866, size * 0.5);
                ctx.lineTo(-size * 0.866, size * 0.5);
                ctx.closePath();
                break;
                
            case 'square':
                ctx.rect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);
                break;
                
            case 'circle':
                ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
                break;
                
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI / 3) - Math.PI / 2;
                    const x = Math.cos(angle) * size * 0.8;
                    const y = Math.sin(angle) * size * 0.8;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
                
            case 'star':
                const spikes = 5;
                const outerRadius = size;
                const innerRadius = size * 0.4;
                for (let i = 0; i < spikes * 2; i++) {
                    const angle = (i * Math.PI / spikes) - Math.PI / 2;
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
                
            case 'trapezoid':
                ctx.moveTo(-size * 0.6, -size * 0.7);
                ctx.lineTo(size * 0.6, -size * 0.7);
                ctx.lineTo(size * 0.9, size * 0.7);
                ctx.lineTo(-size * 0.9, size * 0.7);
                ctx.closePath();
                break;
                
            case 'rhombus':
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.7, 0);
                ctx.lineTo(0, size);
                ctx.lineTo(-size * 0.7, 0);
                ctx.closePath();
                break;
                
            case 'cylinder':
                ctx.ellipse(0, -size * 0.5, size * 0.6, size * 0.2, 0, 0, Math.PI * 2);
                ctx.moveTo(-size * 0.6, -size * 0.5);
                ctx.lineTo(-size * 0.6, size * 0.5);
                ctx.lineTo(size * 0.6, size * 0.5);
                ctx.lineTo(size * 0.6, -size * 0.5);
                ctx.stroke();
                break;
                
            case 'icosahedron':
                this.drawIcosahedron(ctx, size * 0.8);
                break;
                
            case 'parallelepiped':
                ctx.moveTo(-size * 0.7, -size * 0.5);
                ctx.lineTo(size * 0.3, -size * 0.5);
                ctx.lineTo(size * 0.7, -size * 0.2);
                ctx.lineTo(size * 0.7, size * 0.5);
                ctx.lineTo(-size * 0.3, size * 0.5);
                ctx.lineTo(-size * 0.7, size * 0.2);
                ctx.closePath();
                ctx.stroke();
                break;
                
            case 'void':
                ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
                const voidGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.2);
                voidGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
                voidGradient.addColorStop(0.5, 'rgba(20, 0, 40, 0.5)');
                voidGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = voidGradient;
                ctx.fill();
                break;
        }
        
        ctx.fill();
        ctx.stroke();
    }

    drawIcosahedron(ctx, size) {
        const vertices = [];
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        
        for (let i = 0; i < 3; i++) {
            for (let j = -1; j <= 1; j += 2) {
                const a = (i * 2 + 1) * Math.PI / 3;
                vertices.push({
                    x: size * Math.cos(a),
                    y: size * Math.sin(a) * j * goldenRatio
                });
            }
        }
        
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 1;
        
        const edges = [
            [0, 1], [0, 2], [0, 3], [0, 4],
            [1, 2], [1, 3], [1, 5],
            [2, 4], [2, 5],
            [3, 4], [3, 5],
            [4, 5]
        ];
        
        edges.forEach(([i, j]) => {
            ctx.beginPath();
            ctx.moveTo(vertices[i].x, vertices[i].y);
            ctx.lineTo(vertices[j].x, vertices[j].y);
            ctx.stroke();
        });
    }

    drawPlayer(player) {
        const ctx = this.ctx;
        ctx.save();
        
        ctx.translate(player.x, player.y);
        ctx.rotate(player.rotation);
        
        // Player glow
        const playerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, player.size * 1.5);
        playerGlow.addColorStop(0, this.hexToRgba(player.color, 0.5));
        playerGlow.addColorStop(1, 'transparent');
        
        ctx.fillStyle = playerGlow;
        ctx.beginPath();
        ctx.arc(0, 0, player.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Player shape
        ctx.fillStyle = player.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        this.drawShape(ctx, player.shape, player.size);
        
        ctx.restore();
    }

    drawConnection(char1, char2, intensity) {
        if (intensity <= 0) return;
        
        const ctx = this.ctx;
        ctx.save();
        
        const gradient = ctx.createLinearGradient(char1.x, char1.y, char2.x, char2.y);
        gradient.addColorStop(0, this.hexToRgba(char1.color, intensity * 0.5));
        gradient.addColorStop(0.5, this.hexToRgba('#ffffff', intensity * 0.3));
        gradient.addColorStop(1, this.hexToRgba(char2.color, intensity * 0.5));
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = intensity * 3;
        ctx.beginPath();
        ctx.moveTo(char1.x, char1.y);
        ctx.lineTo(char2.x, char2.y);
        ctx.stroke();
        
        ctx.restore();
    }

    drawFractal(time) {
        const ctx = this.ctx;
        const corners = [
            { x: 50, y: 200 },
            { x: this.canvas.width - 50, y: 200 },
            { x: 50, y: this.canvas.height - 100 },
            { x: this.canvas.width - 50, y: this.canvas.height - 100 }
        ];
        
        corners.forEach((corner, i) => {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(time * 0.01 + i) * 0.2;
            
            const gradient = ctx.createRadialGradient(corner.x, corner.y, 0, corner.x, corner.y, 100);
            gradient.addColorStop(0, `hsl(${(time * 10 + i * 90) % 360}, 70%, 50%)`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            
            for (let j = 0; j < 5; j++) {
                const angle = (j * Math.PI * 2 / 5) + time * 0.005;
                const radius = 30 + j * 15;
                const x = corner.x + Math.cos(angle) * radius;
                const y = corner.y + Math.sin(angle) * radius;
                
                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
    }

    drawDecisionMap(decisions, time) {
        const ctx = this.ctx;
        ctx.save();
        
        ctx.globalAlpha = 0.8;
        
        decisions.forEach(decision => {
            const gradient = ctx.createLinearGradient(
                decision.start.x, decision.start.y,
                decision.end.x, decision.end.y
            );
            gradient.addColorStop(0, decision.color + '80');
            gradient.addColorStop(1, decision.color + '20');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.shadowColor = decision.color;
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(decision.start.x, decision.start.y);
            
            const cpX = (decision.start.x + decision.end.x) / 2;
            const cpY = (decision.start.y + decision.end.y) / 2 - 50;
            ctx.quadraticCurveTo(cpX, cpY, decision.end.x, decision.end.y);
            
            ctx.stroke();
        });
        
        ctx.restore();
    }

    drawCollapseEffect(time) {
        const ctx = this.ctx;
        const intensity = (180 - time) / 180;
        
        ctx.save();
        ctx.globalAlpha = intensity * 0.3;
        
        // Glitch lines
        for (let i = 0; i < intensity * 20; i++) {
            const y = Math.random() * this.canvas.height;
            const height = Math.random() * 3;
            
            ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 0}, 0, ${Math.random() > 0.5 ? 255 : 0}, ${Math.random()})`;
            ctx.fillRect(0, y, this.canvas.width, height);
        }
        
        // Color distortion
        if (intensity > 0.5) {
            const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                if (Math.random() < (intensity - 0.5) * 0.1) {
                    data[i] = data[i + 4] || data[i];
                    data[i + 1] = data[i + 5] || data[i + 1];
                    data[i + 2] = data[i + 6] || data[i + 2];
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
        }
        
        ctx.restore();
    }

    drawSleepButton(heldTime, requiredTime) {
        const ctx = this.ctx;
        const progress = heldTime / requiredTime;
        
        ctx.save();
        
        // Button background
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonX = this.canvas.width / 2 - buttonWidth / 2;
        const buttonY = this.canvas.height - 100;
        
        // Glow effect
        const glowGradient = ctx.createRadialGradient(
            this.canvas.width / 2, buttonY + buttonHeight / 2, 0,
            this.canvas.width / 2, buttonY + buttonHeight / 2, 150
        );
        glowGradient.addColorStop(0, 'rgba(100, 100, 255, 0.3)');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Button outline
        ctx.strokeStyle = 'rgba(150, 150, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Progress bar
        if (progress > 0) {
            ctx.fillStyle = `rgba(150, 150, 255, ${0.3 + progress * 0.7})`;
            ctx.fillRect(buttonX + 3, buttonY + 3, (buttonWidth - 6) * progress, buttonHeight - 6);
        }
        
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '16px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Удерживайте ПРОБЕЛ или S (${heldTime.toFixed(1)}s / ${requiredTime}s)`, this.canvas.width / 2, buttonY + buttonHeight / 2);
        
        ctx.restore();
    }

    drawScratchMarks(scratchMarks, playerShape) {
        const ctx = this.ctx;
        
        ctx.save();
        
        scratchMarks.forEach(mark => {
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = mark.color;
            ctx.lineWidth = 2;
            
            ctx.translate(mark.x, mark.y);
            
            // Draw scratch mark based on player shape
            ctx.beginPath();
            
            switch (playerShape) {
                case 'triangle':
                    ctx.moveTo(0, -15);
                    ctx.lineTo(13, 10);
                    ctx.lineTo(-13, 10);
                    ctx.closePath();
                    break;
                case 'square':
                    ctx.rect(-12, -12, 24, 24);
                    break;
                case 'circle':
                    ctx.arc(0, 0, 12, 0, Math.PI * 2);
                    break;
                case 'hexagon':
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * Math.PI / 3) - Math.PI / 2;
                        const x = Math.cos(angle) * 12;
                        const y = Math.sin(angle) * 12;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    break;
                case 'star':
                    for (let i = 0; i < 5 * 2; i++) {
                        const angle = (i * Math.PI / 5) - Math.PI / 2;
                        const radius = i % 2 === 0 ? 15 : 6;
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    break;
            }
            
            ctx.stroke();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        });
        
        ctx.restore();
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + 
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }
}
