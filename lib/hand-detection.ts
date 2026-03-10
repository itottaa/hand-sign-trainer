'use client';

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface DetectedHand {
  landmarks: Landmark[];
  handedness: string;
  score: number;
}

declare global {
  interface Window {
    Hands: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

let handsInstance: any = null;
let initPromise: Promise<boolean> | null = null;

const loadScript = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });

export const initializeHandDetector = async (): Promise<boolean> => {
  if (handsInstance) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.js');

      const HandsClass = (window as any).Hands;
      if (!HandsClass) throw new Error('Hands not loaded');

      handsInstance = new HandsClass({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
      });

      handsInstance.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      await handsInstance.initialize();
      return true;
    } catch (err) {
      console.error('MediaPipe init failed:', err);
      handsInstance = null;
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
};

export const detectHands = (canvas: HTMLCanvasElement): Promise<DetectedHand[]> => {
  if (!handsInstance) return Promise.resolve([]);

  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve([]), 1000);

    handsInstance.onResults((results: any) => {
      clearTimeout(timeout);
      if (!results.multiHandLandmarks?.length) { resolve([]); return; }

      const hands: DetectedHand[] = results.multiHandLandmarks.map(
        (landmarks: any[], i: number) => ({
          landmarks: landmarks.map((lm: any) => ({ x: lm.x, y: lm.y, z: lm.z || 0, visibility: 1 })),
          handedness: results.multiHandedness?.[i]?.label || 'Unknown',
          score: results.multiHandedness?.[i]?.score || 0.9,
        })
      );
      resolve(hands);
    });

    handsInstance.send({ image: canvas }).catch(() => { clearTimeout(timeout); resolve([]); });
  });
};

export const normalizeKeypoints = (landmarks: Landmark[]): number[] => {
  if (!landmarks?.length) return [];
  const xs = landmarks.map(l => l.x);
  const ys = landmarks.map(l => l.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.max(maxX - minX, maxY - minY) || 1;
  return landmarks.flatMap(l => [(l.x - minX) / scale, (l.y - minY) / scale]);
};

export const drawHands = (
  ctx: CanvasRenderingContext2D,
  hands: DetectedHand[],
  width: number,
  height: number
) => {
  const CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],
    [5,9],[9,13],[13,17],
  ];

  hands.forEach(hand => {
    const lms = hand.landmarks;
    ctx.strokeStyle = 'rgba(0,255,128,0.85)';
    ctx.lineWidth = 2.5;
    CONNECTIONS.forEach(([a, b]) => {
      if (lms[a] && lms[b]) {
        ctx.beginPath();
        ctx.moveTo(lms[a].x * width, lms[a].y * height);
        ctx.lineTo(lms[b].x * width, lms[b].y * height);
        ctx.stroke();
      }
    });
    lms.forEach((lm, i) => {
      const isTip = [4,8,12,16,20].includes(i);
      ctx.fillStyle = isTip ? '#ff4d4d' : '#00ff80';
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, isTip ? 7 : 4, 0, Math.PI * 2);
      ctx.fill();
    });
    // Hand label
    if (lms[0]) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(lms[0].x * width - 2, lms[0].y * height - 22, 60, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(hand.handedness, lms[0].x * width, lms[0].y * height - 7);
    }
  });
};

export const hasHandDetected = (hands: DetectedHand[]): boolean => hands.length > 0;
export const getHandCount = (hands: DetectedHand[]): number => hands.length;
