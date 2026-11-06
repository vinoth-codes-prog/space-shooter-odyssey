
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function SpaceLoadingScene({ launching = false }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020412);
    scene.fog = new THREE.FogExp2(0x080b25, 0.012);

    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 3, 15);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x8099cc, 1.5));

    const blueLight = new THREE.PointLight(0x168cff, 90, 100);
    blueLight.position.set(-5, 4, 5);
    scene.add(blueLight);

    const engineLight = new THREE.PointLight(0x00dfff, 70, 35);
    engineLight.position.set(0, 0, -5);
    scene.add(engineLight);

    const ship = new THREE.Group();
    scene.add(ship);

    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x9baabd,
      metalness: 0.85,
      roughness: 0.28
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x152943,
      metalness: 0.75,
      roughness: 0.3
    });

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00dfff
    });

    // Main armored fuselage
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 5.8, 8),
      hullMaterial
    );
    body.rotation.x = -Math.PI / 2;
    ship.add(body);

    // Cockpit
    const cockpit = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 24, 16),
      new THREE.MeshPhysicalMaterial({
        color: 0x168bca,
        metalness: 0.65,
        roughness: 0.12,
        clearcoat: 1
      })
    );
    cockpit.position.set(0, 0.45, 0.7);
    cockpit.scale.set(0.75, 0.55, 1.35);
    ship.add(cockpit);

    // Swept wings
    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.18, 1.8),
        darkMaterial
      );
      wing.position.set(side * 1.8, 0, -0.3);
      wing.rotation.y = side * -0.18;
      ship.add(wing);

      const wingGlow = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.04, 0.12),
        glowMaterial
      );
      wingGlow.position.set(side * 1.8, 0.13, -0.25);
      ship.add(wingGlow);

      const engine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.3, 1.1, 16),
        darkMaterial
      );
      engine.rotation.x = Math.PI / 2;
      engine.position.set(side * 1.35, 0, -2.5);
      ship.add(engine);

      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 2.1, 16),
        new THREE.MeshBasicMaterial({
          color: 0x00cfff,
          transparent: true,
          opacity: 0.85
        })
      );
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(side * 1.35, 0, -4.1);
      ship.add(flame);
    });

    // Star field
    const starPositions = [];
    for (let i = 0; i < 1800; i++) {
      starPositions.push(
        (Math.random() - 0.5) * 180,
        (Math.random() - 0.5) * 100,
        -Math.random() * 350
      );
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starPositions, 3)
    );

    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        color: 0xb8dfff,
        size: 0.22,
        transparent: true,
        opacity: 0.9
      })
    );
    scene.add(stars);

    // Distant planet
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(8, 48, 48),
      new THREE.MeshStandardMaterial({
        color: 0x392b78,
        roughness: 0.9
      })
    );
    planet.position.set(13, 8, -45);
    scene.add(planet);

    // Asteroids
    const asteroids = [];
    const asteroidMaterial = new THREE.MeshStandardMaterial({
      color: 0x657080,
      roughness: 0.95,
      metalness: 0.15
    });

    for (let i = 0; i < 35; i++) {
      const asteroid = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.5 + Math.random() * 1.2, 1),
        asteroidMaterial
      );
      asteroid.position.set(
        (Math.random() - 0.5) * 55,
        (Math.random() - 0.5) * 30,
        -10 - Math.random() * 100
      );
      asteroid.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      scene.add(asteroid);
      asteroids.push(asteroid);
    }

    let frame;
    const clock = new THREE.Clock();

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      ship.position.y = Math.sin(t * 1.5) * 0.22;
      ship.rotation.z = Math.sin(t * 0.65) * 0.08;
      ship.rotation.y = Math.sin(t * 0.4) * 0.12;

      ship.scale.setScalar(
        launching ? 1 + Math.min(t * 0.15, 2) : 1
      );

      stars.position.z += launching ? 1.2 : 0.08;
      if (stars.position.z > 100) stars.position.z = 0;

      asteroids.forEach((asteroid) => {
        asteroid.rotation.x += 0.002;
        asteroid.rotation.y += 0.003;
      });

      renderer.render(scene, camera);
    };

    animate();

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [launching]);

  return <div ref={mountRef} className="space-loading-3d" />;
}
