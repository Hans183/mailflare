"use client";

import { useEffect, useRef } from "react";

type Ember = {
	x: number;
	y: number;
	r: number;
	vy: number;
	vx: number;
	sway: number;
	phase: number;
	life: number;
	maxLife: number;
	hue: number;
};

const EMBERS_PER_MEGAPIXEL = 110;

function spawn(width: number, height: number, anywhere: boolean): Ember {
	const maxLife = 6 + Math.random() * 10;
	return {
		x: Math.random() * width,
		y: anywhere ? Math.random() * height : height + Math.random() * 40,
		r: 0.8 + Math.random() * Math.random() * 3.6,
		vy: 14 + Math.random() * 38,
		vx: (Math.random() - 0.5) * 8,
		sway: 6 + Math.random() * 22,
		phase: Math.random() * Math.PI * 2,
		life: anywhere ? Math.random() * maxLife : 0,
		maxLife,
		// 8 (red) .. 48 (amber)
		hue: 8 + Math.random() * 40,
	};
}

/**
 * Full-screen canvas of embers drifting up from the bottom, flickering and
 * fading out. Pauses while the tab is hidden and draws a still frame when the
 * user prefers reduced motion.
 */
export function EmberBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let width = 0;
		let height = 0;
		let embers: Ember[] = [];
		let frame = 0;
		let last = performance.now();

		const resize = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			const target = Math.max(30, Math.round((width * height) / 1e6 * EMBERS_PER_MEGAPIXEL));
			if (embers.length > target) embers = embers.slice(0, target);
			while (embers.length < target) embers.push(spawn(width, height, true));
		};

		const draw = (dt: number) => {
			ctx.clearRect(0, 0, width, height);
			ctx.globalCompositeOperation = "lighter";
			for (let i = 0; i < embers.length; i++) {
				const e = embers[i];
				e.life += dt;
				e.phase += dt * 1.6;
				e.y -= e.vy * dt;
				e.x += (e.vx + Math.sin(e.phase) * e.sway * 0.35) * dt;
				if (e.life > e.maxLife || e.y < -20 || e.x < -20 || e.x > width + 20) {
					embers[i] = spawn(width, height, false);
					continue;
				}
				const t = e.life / e.maxLife;
				// Fade in quickly, burn, then die out; flicker on top.
				const fade = Math.min(1, t * 6) * (1 - t) * (1 - t);
				const flicker = 0.7 + 0.3 * Math.sin(e.phase * 3.1 + e.r);
				const alpha = Math.max(0, fade * flicker);
				// Embers cool from amber to red as they rise.
				const hue = e.hue - t * 10;
				const glow = e.r * 5;
				const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, glow);
				g.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha})`);
				g.addColorStop(0.25, `hsla(${hue}, 100%, 55%, ${alpha * 0.55})`);
				g.addColorStop(1, `hsla(${hue}, 100%, 45%, 0)`);
				ctx.fillStyle = g;
				ctx.beginPath();
				ctx.arc(e.x, e.y, glow, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.globalCompositeOperation = "source-over";
		};

		const loop = (now: number) => {
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			draw(dt);
			frame = requestAnimationFrame(loop);
		};

		const onVisibility = () => {
			cancelAnimationFrame(frame);
			if (!document.hidden && !reduced) {
				last = performance.now();
				frame = requestAnimationFrame(loop);
			}
		};

		resize();
		if (reduced) draw(0);
		else frame = requestAnimationFrame(loop);
		window.addEventListener("resize", resize);
		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("resize", resize);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, []);

	return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
}
