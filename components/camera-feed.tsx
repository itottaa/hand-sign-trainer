'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface CameraFeedProps {
  onFrameCapture?: (canvas: HTMLCanvasElement) => void;
  drawCallback?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  label?: string;
  active?: boolean;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  onFrameCapture,
  drawCallback,
  label = 'Camera',
  active = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth || 640;
            canvasRef.current.height = videoRef.current.videoHeight || 480;
          }
          setIsReady(true);
        };
      }
    } catch (err: any) {
      setError(err.message || 'Camera access denied');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsReady(false);
  }, []);

  useEffect(() => {
    if (active) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [active]);

  useEffect(() => {
    if (!isReady) return;

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Mirror effect
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      if (drawCallback) drawCallback(ctx, canvas.width, canvas.height);
      if (onFrameCapture) onFrameCapture(canvas);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isReady, drawCallback, onFrameCapture]);

  if (error) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-4xl mb-3">📷</div>
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <p className="text-gray-500 text-xs mt-2">Check browser permissions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ visibility: 'hidden' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Starting camera...</p>
          </div>
        </div>
      )}
      {isReady && label && (
        <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          🔴 {label}
        </div>
      )}
    </div>
  );
};
