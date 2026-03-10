import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/* ══════════════════════════════════════════════
   IRIS SHADER (plain THREE.ShaderMaterial)
   No extend/shaderMaterial factory needed.
   ══════════════════════════════════════════════ */
function useIrisShaderMaterial() {
    const mat = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPupilRadius: { value: 0.28 },
                uColorInner: { value: new THREE.Color("#2563eb") },
                uColorOuter: { value: new THREE.Color("#1e3a8a") },
                uColorHighlight: { value: new THREE.Color("#93c5fd") },
            },
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform float uTime;
        uniform float uPupilRadius;
        uniform vec3 uColorInner;
        uniform vec3 uColorOuter;
        uniform vec3 uColorHighlight;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 6; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = (vUv - 0.5) * 2.0;
          float dist = length(uv);
          float angle = atan(uv.y, uv.x);

          // Outside circle -> transparent
          if (dist > 1.0) discard;

          // Pupil
          float pupilEdge = smoothstep(uPupilRadius, uPupilRadius - 0.04, dist);

          // Radial fibers
          float fiberNoise = fbm(vec2(angle * 12.0, dist * 8.0 + uTime * 0.03));
          float fiberSharp = smoothstep(0.3, 0.75, fiberNoise);

          // Color gradient
          float t = smoothstep(uPupilRadius, 1.0, dist);
          vec3 baseColor = mix(uColorInner, uColorOuter, t);

          // Fiber highlights
          baseColor += fiberSharp * 0.25 * uColorHighlight;

          // Collarette ring
          float collarette = smoothstep(0.06, 0.0, abs(dist - uPupilRadius - 0.12));
          baseColor += collarette * 0.4 * uColorHighlight;

          // Limbal ring
          float limbal = smoothstep(0.85, 1.0, dist);
          baseColor = mix(baseColor, vec3(0.02, 0.02, 0.05), limbal);

          // Apply pupil
          baseColor = mix(baseColor, vec3(0.0), pupilEdge);

          // Edge alpha
          float edgeAlpha = 1.0 - smoothstep(0.95, 1.0, dist);

          gl_FragColor = vec4(baseColor, edgeAlpha);
        }
      `,
            transparent: true,
            side: THREE.DoubleSide,
        });
    }, []);
    return mat;
}

/* ══════════════════════════════════════
   PROCEDURAL SCLERA TEXTURE (Canvas)
   ══════════════════════════════════════ */
function useScleraTexture() {
    const canvas = useMemo(() => {
        const c = document.createElement("canvas");
        c.width = 2048;
        c.height = 2048;
        const ctx = c.getContext("2d");

        const grd = ctx.createRadialGradient(1024, 1024, 300, 1024, 1024, 1024);
        grd.addColorStop(0, "#ffffff");
        grd.addColorStop(0.7, "#fef2f2");
        grd.addColorStop(1, "#fecaca");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 2048, 2048);

        // Tissue noise
        ctx.globalAlpha = 0.08;
        for (let i = 0; i < 80000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? "#fff1f2" : "#ffffff";
            ctx.fillRect(Math.random() * 2048, Math.random() * 2048, 2, 2);
        }

        // Recursive veins
        const drawVein = (x, y, len, angle, w, color, depth) => {
            if (depth > 4 || len < 10) return;
            ctx.beginPath();
            ctx.moveTo(x, y);
            let cx = x, cy = y;
            const seg = 15, step = len / seg;
            for (let i = 0; i < seg; i++) {
                cx += Math.cos(angle) * step;
                cy += Math.sin(angle) * step;
                angle += (Math.random() - 0.5) * 0.6;
                ctx.lineTo(cx, cy);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = w;
            ctx.lineCap = "round";
            ctx.globalAlpha = 0.45;
            ctx.stroke();
            if (Math.random() < 0.5)
                drawVein(cx, cy, len * 0.55, angle + (Math.random() - 0.5) * 1.2, w * 0.6, color, depth + 1);
            if (Math.random() < 0.3)
                drawVein(cx, cy, len * 0.4, angle - (Math.random() - 0.5) * 1.2, w * 0.5, color, depth + 1);
        };

        for (let i = 0; i < 70; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 650 + Math.random() * 200;
            const x = 1024 + Math.cos(a) * r;
            const y = 1024 + Math.sin(a) * r;
            const color = Math.random() > 0.6 ? "#be123c" : "#e11d48";
            drawVein(x, y, 200 + Math.random() * 250, a + Math.PI + (Math.random() - 0.5) * 0.5, 2.5 + Math.random() * 2.5, color, 0);
        }

        ctx.globalAlpha = 0.25;
        for (let i = 0; i < 150; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 500 + Math.random() * 500;
            const x = 1024 + Math.cos(a) * r;
            const y = 1024 + Math.sin(a) * r;
            drawVein(x, y, 40 + Math.random() * 80, Math.random() * Math.PI * 2, 1, "#fda4af", 2);
        }

        return c;
    }, []);
    return new THREE.CanvasTexture(canvas);
}

/* ══════════════════════════════════════
   REALISTIC EYE ASSEMBLY
   Sclera (full sphere) + Iris (flat disc ON TOP)
   + Cornea dome
   ══════════════════════════════════════ */
function RealisticEye({ scrollProgress }) {
    const groupRef = useRef();
    const irisMat = useIrisShaderMaterial();
    const scleraMap = useScleraTexture();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const onMove = (e) =>
            setMousePos({
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: -(e.clientY / window.innerHeight) * 2 + 1,
            });
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    // Reusable vectors (avoid GC pressure)
    const _targetPos = useMemo(() => new THREE.Vector3(), []);
    const _lookTarget = useMemo(() => new THREE.Vector3(), []);
    const _dummy = useMemo(() => new THREE.Object3D(), []);
    const _scaleVec = useMemo(() => new THREE.Vector3(1, 1, 1), []);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const p = scrollProgress.current;
        const damp = 4; // Smoothing speed (higher = snappier)

        // ── Section positions ──
        // Hero (0-25%):     Right side, looking at user
        // Features (25-50%): Center, scanning
        // Process (50-75%):  Left side
        // CTA (75-100%):     Center zoom toward camera
        let tx, ty, tz, targetScale;

        if (p < 0.25) {
            const t = p / 0.25;
            tx = THREE.MathUtils.lerp(1.5, 0.5, t);
            ty = THREE.MathUtils.lerp(-0.1, -0.3, t); // Lowered the eye based on user request
            tz = THREE.MathUtils.lerp(0, 0.5, t);
            targetScale = THREE.MathUtils.lerp(1.4, 1.8, t);
        } else if (p < 0.5) {
            const t = (p - 0.25) / 0.25;
            tx = THREE.MathUtils.lerp(0.5, -2.5, t);
            ty = THREE.MathUtils.lerp(-0.3, 0, t);
            tz = THREE.MathUtils.lerp(0.5, -0.5, t);
            targetScale = THREE.MathUtils.lerp(1.8, 1.4, t);
        } else if (p < 0.75) {
            const t = (p - 0.5) / 0.25;
            tx = THREE.MathUtils.lerp(-2.5, 0, t);
            ty = THREE.MathUtils.lerp(0, 0, t);
            tz = THREE.MathUtils.lerp(-0.5, 2.5, t);
            targetScale = THREE.MathUtils.lerp(1.4, 1.2, t);
        } else {
            const t = (p - 0.75) / 0.25;
            tx = THREE.MathUtils.lerp(0, 0, t);
            ty = THREE.MathUtils.lerp(0, 0, t);
            tz = THREE.MathUtils.lerp(2.5, 4.5, t);
            targetScale = THREE.MathUtils.lerp(1.2, 0.8, t);
        }

        // Frame-rate independent damping (buttery smooth)
        const pos = groupRef.current.position;
        pos.x = THREE.MathUtils.damp(pos.x, tx, damp, delta);
        pos.y = THREE.MathUtils.damp(pos.y, ty, damp, delta);
        pos.z = THREE.MathUtils.damp(pos.z, tz, damp, delta);

        const curScale = groupRef.current.scale.x;
        const newScale = THREE.MathUtils.damp(curScale, targetScale, damp, delta);
        groupRef.current.scale.setScalar(newScale);

        // ── Mouse tracking (smooth) ──
        _lookTarget.set(mousePos.x * 6, mousePos.y * 4, 12);
        if (p > 0.85) _lookTarget.set(0, 0, 20); // Stare at user in CTA

        _dummy.position.copy(pos);
        _dummy.lookAt(_lookTarget);

        // Micro-saccades (subtle jitter for life)
        const j = Math.sin(state.clock.elapsedTime * 12) * 0.003;
        _dummy.rotation.x += j;
        _dummy.rotation.y += Math.cos(state.clock.elapsedTime * 9) * 0.002;

        groupRef.current.quaternion.slerp(_dummy.quaternion, 1 - Math.exp(-6 * delta));

        // ── Animate iris shader ──
        irisMat.uniforms.uTime.value = state.clock.elapsedTime;
        irisMat.uniforms.uPupilRadius.value =
            0.28 + Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    });

    return (
        <group ref={groupRef}>
            {/* 1. SCLERA — Full round sphere, stays big */}
            <mesh rotation={[0, -Math.PI / 2, 0]}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshPhysicalMaterial
                    map={scleraMap}
                    color="#fff"
                    roughness={0.2}
                    metalness={0.0}
                    clearcoat={0.4}
                    clearcoatRoughness={0.2}
                />
            </mesh>

            {/* 2. IRIS — Flat disc ON TOP of sclera surface */}
            <mesh position={[0, 0, 1.005]}>
                <circleGeometry args={[0.42, 128]} />
                <primitive object={irisMat} attach="material" />
            </mesh>

            {/* 3. CORNEA — Clear glass dome over iris */}
            <mesh position={[0, 0, 0.85]}>
                <sphereGeometry args={[0.55, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
                <meshPhysicalMaterial
                    transmission={0.98}
                    opacity={1}
                    roughness={0.02}
                    ior={1.4}
                    thickness={0.15}
                    specularIntensity={2}
                    transparent
                    depthWrite={false}
                />
            </mesh>

            {/* 4. LIMBAL RING — dark ring at iris edge */}
            <mesh position={[0, 0, 1.003]}>
                <ringGeometry args={[0.40, 0.46, 128]} />
                <meshBasicMaterial
                    color="#0a0a1a"
                    opacity={0.4}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

/* ══════════════════════════════════════
   FLOATING PARTICLES
   ══════════════════════════════════════ */
function Particles({ count = 100 }) {
    const mesh = useRef();
    const data = useMemo(
        () =>
            Array.from({ length: count }, () => ({
                pos: [
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                ],
                r: Math.random() * 0.06 + 0.02,
            })),
        [count]
    );

    useFrame((_, dt) => {
        if (!mesh.current) return;
        mesh.current.rotation.y += dt * 0.08;
        mesh.current.rotation.x += dt * 0.04;
    });

    return (
        <group ref={mesh}>
            {data.map((p, i) => (
                <mesh key={i} position={p.pos}>
                    <sphereGeometry args={[p.r, 8, 8]} />
                    <meshBasicMaterial color="#93c5fd" transparent opacity={0.5} />
                </mesh>
            ))}
        </group>
    );
}

/* ══════════════════════════════════════
   SCENE WRAPPER (default export)
   ══════════════════════════════════════ */
export default function EyeScene() {
    const scrollProgress = useRef(0);

    useEffect(() => {
        const onScroll = () => {
            const total = document.documentElement.scrollHeight - window.innerHeight;
            scrollProgress.current = Math.max(0, Math.min(1, window.scrollY / total));
        };
        window.addEventListener("scroll", onScroll);
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <Canvas
            camera={{ position: [0, 0, 8], fov: 40 }}
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 0,
            }}
        >
            <ambientLight intensity={0.5} />
            <spotLight
                position={[5, 5, 5]}
                angle={0.25}
                penumbra={1}
                intensity={1.5}
                color="#ffffff"
                castShadow
            />
            <pointLight position={[-5, -5, 5]} intensity={0.6} color="#60a5fa" />

            <RealisticEye scrollProgress={scrollProgress} />
            <Particles />

            <Environment preset="city" />
            <ContactShadows
                position={[0, -2.5, 0]}
                opacity={0.3}
                scale={20}
                blur={2}
                far={4}
                color="#0f172a"
            />
        </Canvas>
    );
}
