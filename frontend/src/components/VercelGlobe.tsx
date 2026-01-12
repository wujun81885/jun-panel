import { useEffect, useRef } from 'react';

interface VercelGlobeProps {
  className?: string;
}

export function VercelGlobe({ className }: VercelGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let frameId = 0;

    // Configuration
    const GLOBE_RADIUS = 300;
    const PERSPECTIVE = 800;
    const ROTATION_SPEED = 0.002;
    
    // Sphere definition
    const LATITUDES = 10; // 纬线数量
    const LONGITUDES = 12; // 经线数量

    interface Point3D {
      x: number;
      y: number;
      z: number;
    }

    let rotationY = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const project = (p: Point3D) => {
      const scale = PERSPECTIVE / (PERSPECTIVE + p.z + 400); // Move globe back a bit
      return {
        x: width / 2 + p.x * scale,
        y: height / 2 + p.y * scale + 100, // Move down a bit to show upper half nicely
        scale: scale,
        visible: (p.z + 400) > -PERSPECTIVE // Simple clipping
      };
    };

    const drawLine = (p1: Point3D, p2: Point3D, opacityMultiplier = 1) => {
      // 简单的背面剔除：如果中点的 z < 0 ?? Globe 中心在 0,0,0
      // 其实应该剔除 z 最大的（远离这种视角），或者 z 最小的（远离屏幕）。
      // 这里的坐标系：+z 是远离屏幕？通常 Canvas 3D 是 +z 向屏幕外？
      // 我们自定义：z 越大越远。
      
      const v1 = project(p1);
      const v2 = project(p2);

      if (!v1.visible || !v2.visible) return;

      // 深度渐变：越远越淡
      const avgZ = (p1.z + p2.z) / 2;
      // Z range approx -300 to 300
      // Opacity 1 at -300 (front), 0.1 at 300 (back)
      const depthAlpha = Math.max(0.1, 1 - (avgZ + GLOBE_RADIUS) / (2 * GLOBE_RADIUS));
      
      ctx.beginPath();
      ctx.moveTo(v1.x, v1.y);
      ctx.lineTo(v2.x, v2.y);
      
      // Vercel 风格：青色/白色，非常细
      ctx.strokeStyle = `rgba(100, 200, 255, ${depthAlpha * opacityMultiplier * 0.4})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      
      rotationY += ROTATION_SPEED;

      // Generate points and draw
      // Draw Longitudes (经线)
      for (let i = 0; i < LONGITUDES; i++) {
        const theta = (Math.PI * 2 * i) / LONGITUDES + rotationY;
        
        let prevPoint: Point3D | null = null;
        
        // Iterate latitude to draw smooth curve
        const STEPS = 50; 
        for (let j = 0; j <= STEPS; j++) {
            const phi = (Math.PI * j) / STEPS; // 0 to PI (North to South)
            
            const x = GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
            const y = GLOBE_RADIUS * Math.cos(phi); // y is up/down
            const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
            
            const p = { x, y, z };
            if (prevPoint) drawLine(prevPoint, p);
            prevPoint = p;
        }
      }

      // Draw Latitudes (纬线)
      for (let i = 1; i < LATITUDES; i++) {
          const phi = (Math.PI * i) / LATITUDES; 
          const y = GLOBE_RADIUS * Math.cos(phi);
          const r = GLOBE_RADIUS * Math.sin(phi); // Radius of this latitude ring
          
          let prevPoint: Point3D | null = null;
          const STEPS = 60;
          for (let j = 0; j <= STEPS; j++) {
              const theta = (Math.PI * 2 * j) / STEPS + rotationY;
              const x = r * Math.cos(theta);
              const z = r * Math.sin(theta);
              
              const p = { x, y, z };
              if (prevPoint) drawLine(prevPoint, p, 0.5); // Latitudes dimmer
              prevPoint = p;
          }
      }

      // Draw dashed glow or particles? Keep it clean for now.
      
      frameId = requestAnimationFrame(loop);
    };

    window.addEventListener('resize', resize);
    resize();
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0, // 最底层
        opacity: 0.6, // 稍微透明一点，不要抢眼
      }}
    />
  );
}
