/*
 * BrainScene.tsx — Realistic 3D Brain (Three.js)
 *
 * เป้าหมาย:
 * - แสดงสมองสวย ๆ สมจริง (PBR + envMap + rim/key/fill lights)
 * - Scroll-driven: เปลี่ยน tint/zoom/rotation ตาม activeScene + scrollProgress
 * - ลื่นไหลทุกอุปกรณ์: DPR clamp, suspend on hidden tab, resize-aware
 * - ผู้ใช้สามารถ "ใส่ลิงก์โมเดลเอง" ได้:
 *     ใช้ ENV: VITE_BRAIN_MODEL_URL (.glb/.gltf)
 *     หรือใช้ default ที่อยู่ใน /models/brain.glb
 *   แนะนำ: glTF 2.0 (.glb) บีบอัดด้วย Draco/Meshopt, ขนาด < 25MB
 *           1 root, ไม่มี animation track ก็ได้, มี normal/roughness map ยิ่งดี
 */

import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

interface BrainSceneProps {
  activeScene: number;
  scrollProgress: number;
}

const DEFAULT_MODEL_URL = "/models/brain.glb";
const MODEL_URL =
  (import.meta.env.VITE_BRAIN_MODEL_URL as string | undefined) || DEFAULT_MODEL_URL;

const TINTS = [
  0xd8d2ff, 0xd8d2ff, 0x70f5e5, 0xff4b3e, 0xff8a28, 0xff245f, 0x70f5e5,
].map(color => new THREE.Color(color));

export default function BrainScene({ activeScene, scrollProgress }: BrainSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const brainRef = useRef<THREE.Group | null>(null);
  const ringsRef = useRef<THREE.Group | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const pulseShellRef = useRef<THREE.Mesh | null>(null);
  const frameRef = useRef(0);
  const clockRef = useRef(new THREE.Clock());
  const sceneIndexRef = useRef(activeScene);
  const scrollRef = useRef(scrollProgress);
  const mouseRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, x: 0, y: 0, rx: 0, ry: 0 });
  const visibleRef = useRef(true);

  useEffect(() => {
    sceneIndexRef.current = activeScene;
  }, [activeScene]);
  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  // ─── Materials / Helpers ─────────────────────────────────────────────────
  const upgradeMaterial = (mat: THREE.Material) => {
    if (
      mat instanceof THREE.MeshStandardMaterial ||
      mat instanceof THREE.MeshPhysicalMaterial
    ) {
      mat.transparent = true;
      mat.opacity = 0.92;
      mat.side = THREE.DoubleSide;
      mat.metalness = mat.metalness ?? 0.05;
      mat.roughness = THREE.MathUtils.clamp(mat.roughness ?? 0.55, 0.35, 0.78);
      mat.emissive = mat.emissive ?? new THREE.Color(0x062826);
      mat.emissiveIntensity = 0.18;

      // Promote to physical for clearcoat sheen if base is Standard
      if (
        mat instanceof THREE.MeshStandardMaterial &&
        !(mat instanceof THREE.MeshPhysicalMaterial)
      ) {
        // leave as standard to avoid heavy GPU cost on mobile; envMap still helps
      } else if (mat instanceof THREE.MeshPhysicalMaterial) {
        mat.clearcoat = 0.35;
        mat.clearcoatRoughness = 0.42;
        mat.sheen = 0.18;
        mat.sheenRoughness = 0.6;
        mat.sheenColor = new THREE.Color(0x9be8e0);
      }
    }
  };

  const fitModel = (model: THREE.Group, pivot: THREE.Group) => {
    model.traverse(child => {
      if (child instanceof THREE.Points) child.visible = false;
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = false;
      child.receiveShadow = false;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(upgradeMaterial);
    });

    const box = new THREE.Box3();
    model.traverse(child => {
      if (child instanceof THREE.Mesh) box.expandByObject(child);
    });
    if (box.isEmpty()) box.setFromObject(model);

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    model.position.copy(center).multiplyScalar(-1);

    const maxAxis = Math.max(size.x, size.y, size.z);
    const baseScale = maxAxis > 0 ? 1.78 / maxAxis : 1;
    pivot.userData.baseScale = baseScale;
    pivot.scale.setScalar(baseScale);
    pivot.clear();
    pivot.add(model);
  };

  const createFallback = (pivot: THREE.Group) => {
    // Procedural “neural sphere” fallback (สวยพอใช้แม้โหลดโมเดลไม่ได้)
    const geo = new THREE.IcosahedronGeometry(0.95, 6);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xa9fff4,
      roughness: 0.42,
      metalness: 0.08,
      transparent: true,
      opacity: 0.78,
      emissive: 0x0a3a36,
      emissiveIntensity: 0.22,
      clearcoat: 0.5,
      clearcoatRoughness: 0.35,
      sheen: 0.4,
      sheenColor: new THREE.Color(0x9be8e0),
    });
    const mesh = new THREE.Mesh(geo, mat);
    pivot.add(mesh);

    // Wireframe halo
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 18),
      new THREE.LineBasicMaterial({ color: 0x70f5e5, transparent: true, opacity: 0.18 })
    );
    pivot.add(wire);

    pivot.userData.baseScale = 1;
  };

  const createRings = () => {
    const group = new THREE.Group();
    group.position.set(0, 0.04, -0.12);
    [1.36, 1.74, 2.05].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.006 + index * 0.002, 14, 220),
        new THREE.MeshBasicMaterial({
          color: 0x00d4aa,
          transparent: true,
          opacity: 0.06,
          depthWrite: false,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = index * 0.7;
      group.add(ring);
    });
    return group;
  };

  const createStars = () => {
    const count = 540;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 9;
      const t = Math.random();
      colors[i * 3] = 0.5 + t * 0.5;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 0.95;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 0.012,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        vertexColors: true,
      })
    );
  };

  const createPulseShell = () => {
    // ผิว pulse บาง ๆ รอบสมอง เลียนแบบ "neural aura"
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0x66ffe6,
        transparent: true,
        opacity: 0.04,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    return mesh;
  };

  // ─── Init ─────────────────────────────────────────────────────────────────
  const init = useCallback(() => {
    if (!hostRef.current) return;

    const probe = document.createElement("canvas");
    const webglSupported =
      !!(probe.getContext("webgl") || probe.getContext("experimental-webgl"));
    if (!webglSupported) {
      console.warn("WebGL is not supported.");
      hostRef.current.style.background =
        "radial-gradient(ellipse at center, #0d1f2d 0%, #05080d 100%)";
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05080d, 0.018);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      52,
      hostRef.current.clientWidth / hostRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0.08, 5.05);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      renderer = new THREE.WebGLRenderer({ alpha: true });
    }

    renderer.setSize(hostRef.current.clientWidth, hostRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.05;
    hostRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // PMREM environment (ทำให้ PBR สมจริงขึ้นแบบไม่ต้องใช้ HDR ภายนอก)
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new RoomEnvironment();
      const envTex = pmrem.fromScene(envScene, 0.04).texture;
      scene.environment = envTex;
      pmrem.dispose();
    } catch (err) {
      console.warn("PMREM env not available:", err);
    }

    // Lights — cinematic medical
    scene.add(new THREE.AmbientLight(0x9ffff0, 0.38));

    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(2.6, 2.6, 4);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x00d4aa, 1.15);
    rim.position.set(-3.2, 1.3, -2);
    scene.add(rim);

    const back = new THREE.DirectionalLight(0xff5cb3, 0.55);
    back.position.set(0.5, -2, -3);
    scene.add(back);

    const brain = new THREE.Group();
    brain.position.set(0, 0.08, 0);
    brainRef.current = brain;
    scene.add(brain);

    const pulse = createPulseShell();
    brain.add(pulse);
    pulseShellRef.current = pulse;

    const rings = createRings();
    ringsRef.current = rings;
    scene.add(rings);

    const stars = createStars();
    starsRef.current = stars;
    scene.add(stars);

    new GLTFLoader().load(
      MODEL_URL,
      gltf => fitModel(gltf.scene, brain),
      undefined,
      err => {
        console.warn("Brain model load failed, using fallback:", err);
        createFallback(brain);
      }
    );

    // Suspend animation when tab hidden (ประหยัดแบตมือถือ/แท็บเล็ต)
    const onVis = () => {
      visibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    (renderer.domElement as any).__onVis = onVis;
  }, []);

  // ─── Animate ──────────────────────────────────────────────────────────────
  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) {
      frameRef.current = requestAnimationFrame(animate);
      return;
    }
    if (!visibleRef.current) {
      frameRef.current = requestAnimationFrame(animate);
      return;
    }

    const time = clockRef.current.getElapsedTime();
    const tint = TINTS[sceneIndexRef.current] || TINTS[2];
    const brain = brainRef.current;
    const sp = scrollRef.current; // 0..1

    if (brain) {
      const targetY =
        dragRef.current.ry + mouseRef.current.x * 0.12 + time * 0.06 + sp * 0.18;
      const targetX = dragRef.current.rx + mouseRef.current.y * 0.05 + sp * 0.04;
      brain.rotation.y += (targetY - brain.rotation.y) * 0.08;
      brain.rotation.x += (targetX - brain.rotation.x) * 0.08;
      brain.rotation.z = Math.sin(time * 0.35) * 0.006;
      brain.position.x += (0 - brain.position.x) * 0.08;
      brain.position.y += (0.08 - brain.position.y) * 0.08;
      const breathe = 1 + Math.sin(time * 1.6) * 0.012;
      brain.scale.setScalar((brain.userData.baseScale || 1) * breathe);

      brain.traverse(child => {
        if (!(child instanceof THREE.Mesh)) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => {
          if (
            material instanceof THREE.MeshStandardMaterial ||
            material instanceof THREE.MeshPhysicalMaterial
          ) {
            material.color.lerp(tint, 0.022);
            material.emissive.lerp(tint, 0.014);
            material.emissiveIntensity = 0.14 + Math.sin(time * 1.2) * 0.04;
          }
        });
      });
    }

    if (pulseShellRef.current) {
      const m = pulseShellRef.current.material as THREE.MeshBasicMaterial;
      m.color.lerp(tint, 0.018);
      m.opacity = 0.04 + Math.sin(time * 1.8) * 0.02;
      const s =
        ((brainRef.current?.userData.baseScale as number) || 1) *
        (1.05 + Math.sin(time * 1.6) * 0.04);
      pulseShellRef.current.scale.setScalar(s);
    }

    if (ringsRef.current) {
      ringsRef.current.rotation.y = Math.sin(time * 0.25) * 0.05;
      ringsRef.current.children.forEach((child, index) => {
        child.rotation.z += index === 0 ? 0.0012 : -0.0009;
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.color.lerp(tint, 0.02);
        material.opacity = 0.04 + Math.sin(time + index) * 0.014;
      });
    }

    if (starsRef.current) {
      starsRef.current.rotation.y = time * 0.006;
      (starsRef.current.material as THREE.PointsMaterial).color.lerp(tint, 0.018);
    }

    // Cinematic depth-zoom by scene + scroll
    const baseZ =
      sceneIndexRef.current >= 3 && sceneIndexRef.current <= 5 ? 4.8 : 5.05;
    // Smooth zoom based on scene
    const sceneZoomOffset = sceneIndexRef.current * 0.05;
    const targetZ = baseZ - sp * 0.2 - sceneZoomOffset;
    cameraRef.current.position.z += (targetZ - cameraRef.current.position.z) * 0.04;
    cameraRef.current.lookAt(0, 0.04, 0);

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    frameRef.current = requestAnimationFrame(animate);
  }, []);

  // ─── Mouse / Drag ────────────────────────────────────────────────────────
  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (dragRef.current.active) {
        const dx = event.clientX - dragRef.current.x;
        const dy = event.clientY - dragRef.current.y;
        dragRef.current.ry += dx * 0.0028;
        dragRef.current.rx = THREE.MathUtils.clamp(
          dragRef.current.rx + dy * 0.0018,
          -0.42,
          0.42
        );
        dragRef.current.x = event.clientX;
        dragRef.current.y = event.clientY;
        return;
      }
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    const down = (event: MouseEvent) => {
      dragRef.current.active = true;
      dragRef.current.x = event.clientX;
      dragRef.current.y = event.clientY;
    };
    const up = () => {
      dragRef.current.active = false;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("mouseleave", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mouseleave", up);
    };
  }, []);

  // ─── Resize ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      if (!hostRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = hostRef.current.clientWidth;
      const height = hostRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
    };
  }, []);

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  useEffect(() => {
    init();
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameRef.current);
      const r = rendererRef.current;
      if (r && hostRef.current && r.domElement.parentNode === hostRef.current) {
        const onVis = (r.domElement as any).__onVis as
          | (() => void)
          | undefined;
        if (onVis) document.removeEventListener("visibilitychange", onVis);
        hostRef.current.removeChild(r.domElement);
        r.dispose();
      }
    };
  }, [animate, init]);

  return (
    <div
      ref={hostRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}