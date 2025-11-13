/**
 * Retro-Futuristic Loading Animation
 * Laboratory machinery creating a card
 */

class LoadingAnimation {
	constructor(containerId) {
		this.container = document.getElementById(containerId);
		this.canvas = null;
		this.ctx = null;
		this.animationFrame = null;
		this.particles = [];
		this.gears = [];
		this.startTime = 0;
		this.isRunning = false;
	}

	init() {
		// Create canvas if it doesn't exist
		if (!this.canvas) {
			this.canvas = document.createElement("canvas");
			this.canvas.id = "loading-animation-canvas";
			this.canvas.style.cssText = `
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				max-width: 90%;
				max-height: 90%;
			`;
			this.ctx = this.canvas.getContext("2d");
		}

		// Set canvas size
		const size = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.6, 600);
		this.canvas.width = size;
		this.canvas.height = size;

		// Initialize elements
		this.initGears();
		this.initParticles();
	}

	initGears() {
		this.gears = [
			{ x: 0.3, y: 0.3, radius: 60, teeth: 12, angle: 0, speed: 0.02 },
			{ x: 0.7, y: 0.3, radius: 45, teeth: 10, angle: 0, speed: -0.025 },
			{ x: 0.5, y: 0.6, radius: 80, teeth: 16, angle: 0, speed: 0.015 },
			{ x: 0.2, y: 0.7, radius: 35, teeth: 8, angle: 0, speed: -0.03 },
			{ x: 0.8, y: 0.7, radius: 40, teeth: 9, angle: 0, speed: 0.028 },
		];
	}

	initParticles() {
		this.particles = [];
		for (let i = 0; i < 30; i++) {
			this.particles.push({
				x: Math.random(),
				y: Math.random(),
				size: Math.random() * 3 + 1,
				speedX: (Math.random() - 0.5) * 0.002,
				speedY: (Math.random() - 0.5) * 0.002,
				opacity: Math.random() * 0.5 + 0.3,
			});
		}
	}

	drawGear(x, y, radius, teeth, angle) {
		const ctx = this.ctx;
		const outerRadius = radius;
		const innerRadius = radius * 0.7;
		const toothDepth = radius * 0.2;

		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(angle);

		ctx.beginPath();
		for (let i = 0; i < teeth; i++) {
			const angle1 = (i / teeth) * Math.PI * 2;
			const angle2 = ((i + 0.5) / teeth) * Math.PI * 2;
			const angle3 = ((i + 1) / teeth) * Math.PI * 2;

			// Outer tooth edge
			ctx.lineTo(Math.cos(angle1) * outerRadius, Math.sin(angle1) * outerRadius);
			ctx.lineTo(Math.cos(angle1) * (outerRadius + toothDepth), Math.sin(angle1) * (outerRadius + toothDepth));
			ctx.lineTo(Math.cos(angle2) * (outerRadius + toothDepth), Math.sin(angle2) * (outerRadius + toothDepth));
			ctx.lineTo(Math.cos(angle3) * outerRadius, Math.sin(angle3) * outerRadius);
		}
		ctx.closePath();

		// Gradient fill
		const gradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
		gradient.addColorStop(0, "#83F6BD");
		gradient.addColorStop(0.5, "#70e0aa");
		gradient.addColorStop(1, "#5ad097");
		ctx.fillStyle = gradient;
		ctx.fill();

		// Stroke
		ctx.strokeStyle = "#060606";
		ctx.lineWidth = 2;
		ctx.stroke();

		// Inner circle
		ctx.beginPath();
		ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
		ctx.fillStyle = "#FFEDCC";
		ctx.fill();
		ctx.strokeStyle = "#060606";
		ctx.stroke();

		// Center hole
		ctx.beginPath();
		ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
		ctx.fillStyle = "#060606";
		ctx.fill();

		ctx.restore();
	}

	drawParticle(particle) {
		const ctx = this.ctx;
		const x = particle.x * this.canvas.width;
		const y = particle.y * this.canvas.height;

		ctx.save();
		ctx.globalAlpha = particle.opacity;
		ctx.fillStyle = "#FF6398";
		ctx.beginPath();
		ctx.arc(x, y, particle.size, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	drawCardShape(progress) {
		const ctx = this.ctx;
		const centerX = this.canvas.width / 2;
		const centerY = this.canvas.height / 2;
		const cardWidth = 100;
		const cardHeight = 140;

		// Card appears gradually
		const scale = Math.min(progress * 2, 1);

		ctx.save();
		ctx.translate(centerX, centerY);
		ctx.scale(scale, scale);

		// Card outline
		ctx.strokeStyle = "#FF6398";
		ctx.lineWidth = 3;
		ctx.setLineDash([5, 5]);
		ctx.lineDashOffset = -progress * 50;
		ctx.strokeRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);

		// Card fill (gradually appears)
		if (progress > 0.5) {
			const fillAlpha = (progress - 0.5) * 2;
			ctx.globalAlpha = fillAlpha * 0.3;
			ctx.fillStyle = "#FFEDCC";
			ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
		}

		ctx.restore();
	}

	drawConnections() {
		const ctx = this.ctx;
		const w = this.canvas.width;
		const h = this.canvas.height;

		ctx.strokeStyle = "rgba(131, 246, 189, 0.3)";
		ctx.lineWidth = 2;
		ctx.setLineDash([5, 5]);

		// Draw connections between gears
		for (let i = 0; i < this.gears.length - 1; i++) {
			const g1 = this.gears[i];
			const g2 = this.gears[i + 1];
			ctx.beginPath();
			ctx.moveTo(g1.x * w, g1.y * h);
			ctx.lineTo(g2.x * w, g2.y * h);
			ctx.stroke();
		}

		ctx.setLineDash([]);
	}

	animate() {
		if (!this.isRunning) return;

		const ctx = this.ctx;
		const w = this.canvas.width;
		const h = this.canvas.height;

		// Clear canvas
		ctx.fillStyle = "#060606";
		ctx.fillRect(0, 0, w, h);

		// Calculate progress (for card shape animation)
		const elapsed = (Date.now() - this.startTime) / 1000;
		const progress = Math.min(elapsed / 3, 1); // 3 second animation cycle

		// Draw connections
		this.drawConnections();

		// Update and draw gears
		this.gears.forEach((gear) => {
			gear.angle += gear.speed;
			this.drawGear(gear.x * w, gear.y * h, gear.radius, gear.teeth, gear.angle);
		});

		// Update and draw particles
		this.particles.forEach((particle) => {
			particle.x += particle.speedX;
			particle.y += particle.speedY;

			// Wrap around
			if (particle.x < 0) particle.x = 1;
			if (particle.x > 1) particle.x = 0;
			if (particle.y < 0) particle.y = 1;
			if (particle.y > 1) particle.y = 0;

			this.drawParticle(particle);
		});

		// Draw status text
		ctx.save();
		ctx.font = 'bold 24px "Nippo", monospace';
		ctx.fillStyle = "#83F6BD";
		ctx.textAlign = "center";
		ctx.shadowColor = "#83F6BD";
		ctx.shadowBlur = 10;
		ctx.fillText("GENERATING HYBRID", w / 2, h - 40);
		ctx.restore();

		this.animationFrame = requestAnimationFrame(() => this.animate());
	}

	start() {
		if (this.isRunning) return;

		this.init();
		this.startTime = Date.now();
		this.isRunning = true;

		// Add canvas to container
		if (!this.canvas.parentElement) {
			// Clear container first
			while (this.container.firstChild) {
				this.container.removeChild(this.container.firstChild);
			}
			this.container.appendChild(this.canvas);
		}

		this.animate();
	}

	stop() {
		this.isRunning = false;
		if (this.animationFrame) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}
	}

	destroy() {
		this.stop();
		if (this.canvas && this.canvas.parentElement) {
			this.canvas.parentElement.removeChild(this.canvas);
		}
		this.canvas = null;
		this.ctx = null;
	}
}

export default LoadingAnimation;
