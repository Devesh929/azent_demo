"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion, type MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// Many client signal clusters converge into one governed intelligence core as `progress`
// goes 0 → 1. Points are animated entirely on the GPU; React never re-renders per frame.

const COUNT = 14000;

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uMouse;
  uniform float uPixelRatio;
  uniform float uSize;
  attribute vec3 aCore;
  attribute float aSeed;
  attribute float aCluster;
  varying float vAlpha;
  varying float vCluster;
  varying float vMix;

  void main() {
    float delay = aSeed * 0.4;
    float t = clamp((uProgress - delay) / 0.6, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);

    vec3 scatter = position + 0.16 * vec3(
      sin(uTime * 0.55 + aSeed * 40.0),
      cos(uTime * 0.45 + aSeed * 31.0),
      sin(uTime * 0.35 + aSeed * 17.0)
    );
    vec3 core = aCore * (1.0 + 0.025 * sin(uTime * 1.4 + aSeed * 20.0));
    vec3 p = mix(scatter, core, t);

    float swirl = (1.0 - abs(t * 2.0 - 1.0)) * 1.6 * (aSeed - 0.5);
    float c = cos(swirl), s = sin(swirl);
    p.xz = mat2(c, -s, s, c) * p.xz;
    p.xy += uMouse * 0.22 * (0.4 + aSeed);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.55 + aSeed) * (1.0 + (1.0 - t) * 0.45) / -mv.z;
    vAlpha = (0.3 + 0.7 * fract(aSeed * 13.7)) * (aCluster > 2.5 ? 0.55 : 1.0);
    vCluster = aCluster;
    vMix = t;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  uniform vec3 uDust;
  varying float vAlpha;
  varying float vCluster;
  varying float vMix;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 1.7);
    vec3 cluster = vCluster < 0.5 ? uA : vCluster < 1.5 ? uB : vCluster < 2.5 ? uC : uDust;
    vec3 col = mix(cluster, uCore, vMix);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

function gaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function buildGeometry() {
  const scatter = new Float32Array(COUNT * 3);
  const core = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  const cluster = new Float32Array(COUNT);
  // Four client clusters arranged around where the core will form.
  const centres = [
    [-1.9, 1.75, -0.4],
    [2.4, 1.95, -0.8],
    [-1.6, -1.85, 0.3],
    [2.7, -1.55, 0.6],
  ];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const shell = Math.floor(COUNT * 0.68);

  for (let i = 0; i < COUNT; i++) {
    const r = Math.random();
    seed[i] = r;
    // Scatter: four client clusters plus wide ambient dust.
    const isDust = Math.random() < 0.07;
    const k = isDust ? 3 : i % 3;
    cluster[i] = k;
    if (isDust) {
      scatter.set([(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6], i * 3);
    } else {
      // Each cluster is a small spiral-armed swarm, so it reads as one organisation's signal.
      const c = centres[i % 4];
      const arm = Math.random() * Math.PI * 2;
      const dist = Math.abs(gaussian()) * 0.42;
      const twist = arm + dist * 3.2;
      scatter.set([
        c[0] + Math.cos(twist) * dist + gaussian() * 0.08,
        c[1] + Math.sin(twist) * dist * 0.7 + gaussian() * 0.08,
        c[2] + gaussian() * 0.22,
      ], i * 3);
    }
    // Core: a fibonacci shell plus three tilted orbital rings.
    if (i < shell) {
      const y = 1 - (i / (shell - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = golden * i;
      const R = 1.55 + (Math.random() - 0.5) * 0.05;
      core.set([Math.cos(th) * rad * R, y * R, Math.sin(th) * rad * R], i * 3);
    } else {
      const ring = i % 3;
      const a = Math.random() * Math.PI * 2;
      const R = 2.05 + ring * 0.32 + (Math.random() - 0.5) * 0.06;
      const v = new THREE.Vector3(Math.cos(a) * R, (Math.random() - 0.5) * 0.04, Math.sin(a) * R);
      v.applyEuler(new THREE.Euler(0.35 + ring * 0.5, ring * 1.1, ring * 0.3));
      core.set([v.x, v.y, v.z], i * 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(scatter, 3));
  g.setAttribute("aCore", new THREE.BufferAttribute(core, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  g.setAttribute("aCluster", new THREE.BufferAttribute(cluster, 1));
  return g;
}

function Particles({ progress, still, settled, centered }: { progress?: MotionValue<number>; still: boolean; settled?: boolean; centered?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const lattice = useRef<THREE.LineSegments>(null);
  const mouse = useRef(new THREE.Vector2());
  const target = useRef(new THREE.Vector2());
  const { size, gl } = useThree();
  const geometry = useMemo(() => buildGeometry(), []);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const latticeGeo = useMemo(() => new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.58, 3)), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: still || settled ? 1 : 0 },
          uMouse: { value: new THREE.Vector2() },
          uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.75) },
          uSize: { value: 26 },
          uCore: { value: new THREE.Color("#3ee6c4") },
          uA: { value: new THREE.Color("#6c8cff") },
          uB: { value: new THREE.Color("#9fb3ff") },
          uC: { value: new THREE.Color("#5fd0ff") },
          uDust: { value: new THREE.Color("#3a4a86") },
        },
      }),
    [gl, still, settled],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => () => {
    geometry.dispose();
    latticeGeo.dispose();
    material.dispose();
  }, [geometry, latticeGeo, material]);

  // Per-frame mutation goes through refs, which is how R3F expects animation to work.
  useFrame((state, delta) => {
    if (!matRef.current) return;
    const p = still || settled ? 1 : progress?.get() ?? 0;
    const u = matRef.current.uniforms;
    u.uTime.value += still ? 0 : delta;
    u.uProgress.value = THREE.MathUtils.damp(u.uProgress.value, p, 6, delta);
    mouse.current.lerp(target.current, 1 - Math.pow(0.001, delta));
    u.uMouse.value.copy(mouse.current);
    if (group.current) {
      group.current.rotation.y += still ? 0 : delta * (0.04 + u.uProgress.value * 0.08);
      group.current.rotation.x = mouse.current.y * 0.12;
      const narrow = size.width < 768;
      const s = narrow ? 0.62 : 1;
      group.current.scale.setScalar(s);
      group.current.position.x = narrow || centered ? 0 : 1.5;
      group.current.position.y = narrow ? THREE.MathUtils.lerp(-0.9, 0.4, u.uProgress.value) : 0;
    }
    if (lattice.current) {
      (lattice.current.material as THREE.LineBasicMaterial).opacity = Math.max(0, u.uProgress.value - 0.55) * 0.22;
    }
    const cam = state.camera;
    cam.position.set(mouse.current.x * 0.3, mouse.current.y * 0.2, cam.position.z);
    cam.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <points geometry={geometry}>
        <primitive object={material} ref={matRef} attach="material" />
      </points>
      <lineSegments ref={lattice} geometry={latticeGeo}>
        <lineBasicMaterial color="#3ee6c4" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  );
}

export default function IntelligenceCore({ progress, className, settled, centered }: { progress?: MotionValue<number>; className?: string; settled?: boolean; centered?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const still = !!useReducedMotion();

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    if (wrap.current) io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 7.2], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        frameloop={visible ? (still ? "demand" : "always") : "never"}
      >
        <Particles progress={progress} still={still} settled={settled} centered={centered} />
      </Canvas>
    </div>
  );
}
