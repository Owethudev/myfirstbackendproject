import { useEffect, useRef } from "react";
import * as THREE from "three";

export function OrbitalScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (error) {
      console.warn("Three.js scene is unavailable", error);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const crystal = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.05, 1),
      new THREE.MeshStandardMaterial({
        color: 0xcaff43,
        metalness: 0.48,
        roughness: 0.22,
        flatShading: true,
      }),
    );
    group.add(crystal);

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.38, 1),
      new THREE.MeshBasicMaterial({
        color: 0xe9ffbd,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
      }),
    );
    group.add(shell);

    const orbitMaterials = [
      new THREE.MeshBasicMaterial({ color: 0xf0f0d7, transparent: true, opacity: 0.8 }),
      new THREE.MeshBasicMaterial({ color: 0xcaff43, transparent: true, opacity: 0.85 }),
      new THREE.MeshBasicMaterial({ color: 0xe3aaff, transparent: true, opacity: 0.75 }),
    ];
    const orbits = [0.35, -0.5, 1.15].map((rotation, index) => {
      const orbit = new THREE.Mesh(
        new THREE.TorusGeometry(1.85 + index * 0.18, 0.008, 8, 120),
        orbitMaterials[index],
      );
      orbit.rotation.set(0.8 + index * 0.55, rotation, 0.35 + index * 0.3);
      group.add(orbit);
      return orbit;
    });

    const beadGeometry = new THREE.SphereGeometry(0.075, 16, 16);
    const beads = orbits.map((_, index) => {
      const bead = new THREE.Mesh(
        beadGeometry,
        new THREE.MeshBasicMaterial({ color: index === 1 ? 0xcaff43 : 0xf0f0d7 }),
      );
      group.add(bead);
      return bead;
    });

    scene.add(new THREE.AmbientLight(0xffffff, 1.7));
    const keyLight = new THREE.PointLight(0xd5ff7c, 28);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0xc887ff, 14);
    fillLight.position.set(-4, -2, 1);
    scene.add(fillLight);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let animationFrame = 0;
    const resize = () => {
      const bounds = mount.getBoundingClientRect();
      const width = Math.max(bounds.width, 1);
      const height = Math.max(bounds.height, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);
      frame += 0.004;
      group.rotation.y = frame * 0.45;
      group.rotation.x = Math.sin(frame * 0.7) * 0.13;
      crystal.rotation.y = frame * 0.3;

      beads.forEach((bead, index) => {
        const angle = frame * (index % 2 === 0 ? 0.75 : -0.65) + index * 2.1;
        const radius = 1.85 + index * 0.18;
        bead.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.58, Math.sin(angle) * radius * 0.5);
      });

      renderer.render(scene, camera);
    };

    resize();
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(resize);
    resizeObserver?.observe(mount);
    if (!resizeObserver) {
      window.addEventListener("resize", resize);
    }
    if (!prefersReducedMotion.matches) {
      animate();
    }

    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        window.cancelAnimationFrame(animationFrame);
        renderer.render(scene, camera);
      } else {
        animate();
      }
    };
    prefersReducedMotion.addEventListener("change", handleMotionChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      prefersReducedMotion.removeEventListener("change", handleMotionChange);
      resizeObserver?.disconnect();
      if (!resizeObserver) {
        window.removeEventListener("resize", resize);
      }
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={mountRef} className="orbital-scene" aria-hidden="true">
      <div className="orbital-fallback" />
    </div>
  );
}
