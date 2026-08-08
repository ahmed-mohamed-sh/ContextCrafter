"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const checkItems = [
  "Auto-generated dependency graphs.",
  "Identify tight coupling visually.",
  "Simulate refactoring impact.",
];

function ThreeGraph() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.appendChild(renderer.domElement);

    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 50; i++) {
      points.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
        ),
      );
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.PointsMaterial({
      color: 0x4f46e5,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
    });
    const cloud = new THREE.Points(geometry, material);

    const group = new THREE.Group();
    scene.add(group);
    group.add(cloud);

    // Lines between points
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x4f46e5,
      transparent: true,
      opacity: 0.2,
    });

    const lines: THREE.Line[] = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        if (points[i].distanceTo(points[j]) < 3) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            points[i],
            points[j],
          ]);
          const line = new THREE.Line(lineGeometry, lineMaterial);
          group.add(line);
          lines.push(line);
        }
      }
    }

    camera.position.z = 10;

    // Interactive Drag Rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = () => {
      isDragging = true;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaMove = {
        x: e.offsetX - previousMousePosition.x,
        y: e.offsetY - previousMousePosition.y,
      };

      if (isDragging) {
        const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            ((deltaMove.y * Math.PI) / 180) * 0.5,
            ((deltaMove.x * Math.PI) / 180) * 0.5,
            0,
            "XYZ",
          ),
        );
        group.quaternion.multiplyQuaternions(
          deltaRotationQuaternion,
          group.quaternion,
        );
      }

      previousMousePosition = {
        x: e.offsetX,
        y: e.offsetY,
      };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    let animationFrameId: number;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      if (!isDragging) {
        group.rotation.y += 0.002;
        group.rotation.x += 0.001;
      }
      renderer.render(scene, camera);
    }

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      lineMaterial.dispose();
      lines.forEach((line) => {
        line.geometry.dispose();
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
    />
  );
}

export function ArchitectureSection() {
  return (
    <section
      className="relative py-32 overflow-hidden"
      id="architecture"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(6,14,32,0.5)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center gap-16">
        {/* Left */}
        <div className="md:w-1/2 space-y-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded"
            style={{
              border: "1px solid rgba(76,215,246,0.2)",
              background: "rgba(76,215,246,0.05)",
              color: "#4cd7f6",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
            >
              visibility
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              Live Topology
            </span>
          </div>
          <h2
            style={{
              fontFamily: "Geist, sans-serif",
              fontSize: "clamp(28px,4vw,40px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#dae2fd",
            }}
          >
            Visualize the Invisible.
          </h2>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
              lineHeight: "24px",
              color: "#c7c4d8",
            }}
          >
            ContextCrafter maps your codebase into a navigable topology.
            Identify technical debt clusters, visualize dependency bottlenecks,
            and navigate architectural layers effortlessly.
          </p>
          <ul className="space-y-4 pt-2">
            {checkItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: "#c3c0ff", marginTop: 2 }}
                >
                  check_circle
                </span>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 16,
                    color: "#dae2fd",
                  }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — Three.js Network Graph */}
        <div
          className="md:w-1/2 w-full h-95 rounded-xl relative overflow-hidden group"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(11,19,38,0.6)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 pointer-events-none"
            style={{ background: "rgba(11,19,38,0.6)" }}
          >
            <span
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: "#dae2fd",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
              >
                pan_tool
              </span>
              Drag to explore
            </span>
          </div>

          <ThreeGraph />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 40%, rgba(79,70,229,0.08) 0%, transparent 65%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
