import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import '../styles/GenerationAnimation.css';

interface GenerationAnimationProps {
  colors: string[];
  onComplete: () => void;
}

const DURATION = 2500; // ms
const PARTICLE_COUNT = 120;
const CONNECTION_DISTANCE = 40;

type Shape3D = 'cube' | 'octahedron' | 'icosahedron';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  target3d: Vec3;
  color: string;
  size: number;
  speed: number;
  opacity: number;
  // Per-particle chaos offset for the burst phase
  chaosAngle: number;
  chaosSpeed: number;
}

// --- 3D math ---

function rotateX(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x, y: v.y * cos - v.z * sin, z: v.y * sin + v.z * cos };
}

function rotateY(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos + v.z * sin, y: v.y, z: -v.x * sin + v.z * cos };
}

function project(v: Vec3, cx: number, cy: number): { x: number; y: number } {
  const perspective = 300;
  const scale = perspective / (perspective + v.z);
  return { x: cx + v.x * scale, y: cy + v.y * scale };
}

// --- Shape vertex generators ---

function cubeVertices(radius: number, count: number): Vec3[] {
  const verts: Vec3[] = [];
  const corners: Vec3[] = [
    { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 },
    { x: 1, y: 1, z: -1 },  { x: -1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 },  { x: 1, y: -1, z: 1 },
    { x: 1, y: 1, z: 1 },   { x: -1, y: 1, z: 1 },
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  // Also add face diagonals for density
  const faceDiags: [number, number][] = [
    [0, 2], [4, 6], [0, 5], [1, 4], [1, 7], [2, 5], [3, 6], [0, 7],
  ];
  const allEdges = [...edges, ...faceDiags];
  const perEdge = Math.ceil(count / allEdges.length);
  for (const [a, b] of allEdges) {
    for (let i = 0; i < perEdge && verts.length < count; i++) {
      const t = perEdge === 1 ? 0.5 : i / (perEdge - 1);
      verts.push({
        x: (corners[a].x + (corners[b].x - corners[a].x) * t) * radius,
        y: (corners[a].y + (corners[b].y - corners[a].y) * t) * radius,
        z: (corners[a].z + (corners[b].z - corners[a].z) * t) * radius,
      });
    }
  }
  return verts.slice(0, count);
}

function octahedronVertices(radius: number, count: number): Vec3[] {
  const verts: Vec3[] = [];
  const corners: Vec3[] = [
    { x: 0, y: -1, z: 0 }, { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },  { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 },
  ];
  const edges: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [5, 1], [5, 2], [5, 3], [5, 4],
    [1, 2], [2, 3], [3, 4], [4, 1],
  ];
  // Add cross-connections for density
  const crossEdges: [number, number][] = [
    [1, 3], [2, 4], [0, 5],
  ];
  const allEdges = [...edges, ...crossEdges];
  const perEdge = Math.ceil(count / allEdges.length);
  for (const [a, b] of allEdges) {
    for (let i = 0; i < perEdge && verts.length < count; i++) {
      const t = perEdge === 1 ? 0.5 : i / (perEdge - 1);
      verts.push({
        x: (corners[a].x + (corners[b].x - corners[a].x) * t) * radius,
        y: (corners[a].y + (corners[b].y - corners[a].y) * t) * radius,
        z: (corners[a].z + (corners[b].z - corners[a].z) * t) * radius,
      });
    }
  }
  return verts.slice(0, count);
}

function icosahedronVertices(radius: number, count: number): Vec3[] {
  const verts: Vec3[] = [];
  const phi = (1 + Math.sqrt(5)) / 2;
  const corners: Vec3[] = [
    { x: -1, y: phi, z: 0 },  { x: 1, y: phi, z: 0 },
    { x: -1, y: -phi, z: 0 }, { x: 1, y: -phi, z: 0 },
    { x: 0, y: -1, z: phi },  { x: 0, y: 1, z: phi },
    { x: 0, y: -1, z: -phi }, { x: 0, y: 1, z: -phi },
    { x: phi, y: 0, z: -1 },  { x: phi, y: 0, z: 1 },
    { x: -phi, y: 0, z: -1 }, { x: -phi, y: 0, z: 1 },
  ].map(v => {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  });
  const edges: [number, number][] = [
    [0, 1], [0, 5], [0, 7], [0, 10], [0, 11],
    [1, 5], [1, 7], [1, 8], [1, 9],
    [2, 3], [2, 4], [2, 6], [2, 10], [2, 11],
    [3, 4], [3, 6], [3, 8], [3, 9],
    [4, 5], [4, 9], [4, 11],
    [5, 9], [5, 11],
    [6, 7], [6, 8], [6, 10],
    [7, 8], [7, 10],
    [8, 9], [10, 11],
  ];
  const perEdge = Math.max(1, Math.ceil(count / edges.length));
  for (const [a, b] of edges) {
    for (let i = 0; i < perEdge && verts.length < count; i++) {
      const t = perEdge === 1 ? 0.5 : i / (perEdge - 1);
      verts.push({
        x: (corners[a].x + (corners[b].x - corners[a].x) * t) * radius,
        y: (corners[a].y + (corners[b].y - corners[a].y) * t) * radius,
        z: (corners[a].z + (corners[b].z - corners[a].z) * t) * radius,
      });
    }
  }
  return verts.slice(0, count);
}

function generateShapeVertices(shape: Shape3D, radius: number, count: number): Vec3[] {
  switch (shape) {
    case 'cube': return cubeVertices(radius, count);
    case 'octahedron': return octahedronVertices(radius, count);
    case 'icosahedron': return icosahedronVertices(radius, count);
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function GenerationAnimation({ colors, onComplete }: GenerationAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const completedRef = useRef(false);
  const shapeRef = useRef<Shape3D>('cube');

  const initParticles = useCallback((width: number, height: number) => {
    const cx = width / 2;
    const cy = height / 2;
    const particles: Particle[] = [];
    const shapes: Shape3D[] = ['cube', 'octahedron', 'icosahedron'];
    shapeRef.current = shapes[Math.floor(Math.random() * shapes.length)];

    // Compact radius — roughly 60-70px so the shape is tight
    const shapeRadius = 60;
    const targets = generateShapeVertices(shapeRef.current, shapeRadius, PARTICLE_COUNT);

    for (let i = 0; i < targets.length; i++) {
      const color = colors[i % colors.length];

      const spawnRadius = Math.max(width, height) * 0.5 + Math.random() * 80;
      const spawnAngle = Math.random() * Math.PI * 2;
      const originX = cx + Math.cos(spawnAngle) * spawnRadius;
      const originY = cy + Math.sin(spawnAngle) * spawnRadius;

      particles.push({
        x: originX,
        y: originY,
        originX,
        originY,
        target3d: targets[i],
        color,
        size: 1.5 + Math.random() * 1.5,
        speed: 0.8 + Math.random() * 0.4,
        opacity: 0,
        chaosAngle: Math.random() * Math.PI * 2,
        chaosSpeed: 0.5 + Math.random() * 1.5,
      });
    }
    return particles;
  }, [colors]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const elapsed = performance.now() - startTimeRef.current;
    const progress = Math.min(elapsed / DURATION, 1);
    const w = container.clientWidth;
    const h = container.clientHeight;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid
    const gridSpacing = 20;
    const gridOpacity = progress < 0.4
      ? Math.min(progress / 0.4, 1) * 0.06
      : progress < 0.8
        ? 0.06
        : 0.06 * Math.max(0, 1 - (progress - 0.8) / 0.2);

    ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity})`;
    ctx.lineWidth = 0.5;
    for (let x = cx % gridSpacing; x < w; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = cy % gridSpacing; y < h; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const particles = particlesRef.current;

    // Accelerating rotation — cubic ramp for dramatic speed increase
    // Starts very slow, ends spinning fast
    const rotAmount = progress * progress * progress * 5;
    const rotY = rotAmount;
    const rotX = rotAmount * 0.5;

    for (const p of particles) {
      if (progress < 0.4) {
        // Phase 1: converge from scattered origins toward 3D shape
        const t = Math.min((progress / 0.4) * p.speed, 1);
        const ease = t * t * (3 - 2 * t);

        let rv = rotateX(p.target3d, rotX);
        rv = rotateY(rv, rotY);
        const proj = project(rv, cx, cy);

        p.x = p.originX + (proj.x - p.originX) * ease;
        p.y = p.originY + (proj.y - p.originY) * ease;
        p.opacity = Math.min(t * 2.5, 1);
      } else if (progress < 0.8) {
        // Phase 2: locked onto rotating 3D shape with pulse
        const t2 = (progress - 0.4) / 0.4;
        const pulse = 1 + Math.sin(t2 * Math.PI * 4) * 0.04;
        let rv = { x: p.target3d.x * pulse, y: p.target3d.y * pulse, z: p.target3d.z * pulse };
        rv = rotateX(rv, rotX);
        rv = rotateY(rv, rotY);
        const proj = project(rv, cx, cy);

        p.x = proj.x;
        p.y = proj.y;
        p.opacity = 1;
      } else {
        // Phase 3: chaotic burst — particles fly out with individual trajectories
        const t = (progress - 0.8) / 0.2;
        // Exponential burst for more explosive feel
        const ease = t * t * t;
        const burstScale = 1 + ease * 6;

        // Add per-particle chaos that increases with progress
        const chaosAmount = ease * 30;
        const chaosX = Math.cos(p.chaosAngle) * chaosAmount * p.chaosSpeed;
        const chaosY = Math.sin(p.chaosAngle) * chaosAmount * p.chaosSpeed;

        let rv = { x: p.target3d.x * burstScale, y: p.target3d.y * burstScale, z: p.target3d.z * burstScale };
        rv = rotateX(rv, rotX);
        rv = rotateY(rv, rotY);
        const proj = project(rv, cx, cy);

        p.x = proj.x + chaosX;
        p.y = proj.y + chaosY;
        p.opacity = Math.max(0, 1 - t * 1.3);
      }
    }

    // Draw connections between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        if (a.opacity <= 0 || b.opacity <= 0) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DISTANCE) {
          const lineAlpha = (1 - dist / CONNECTION_DISTANCE) * Math.min(a.opacity, b.opacity) * 0.5;
          ctx.strokeStyle = hexToRgba(a.color, lineAlpha);
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Draw particles as solid nodes
    for (const p of particles) {
      if (p.opacity <= 0) continue;
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (progress < 1) {
      animFrameRef.current = requestAnimationFrame(animate);
    } else if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particlesRef.current = initParticles(w, h);
    };

    resize();
    completedRef.current = false;
    startTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(animate);

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initParticles, animate]);

  return (
    <motion.div
      ref={containerRef}
      className="generation-animation-inline"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <canvas ref={canvasRef} />
    </motion.div>
  );
}
