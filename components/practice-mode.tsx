'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraFeed } from './camera-feed';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  initializeHandDetector,
  detectHands,
  normalizeKeypoints,
  drawHands,
  hasHandDetected,
} from '@/lib/hand-detection';
import { predict, getModelLabels } from '@/lib/model-training';

interface PracticeModeProps {
  modelLoaded: boolean;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({ modelLoaded }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ label: string; confidence: number } | null>(null);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const detectorRef = useRef<boolean>(false);
  const processFrameRef = useRef(false);

  useEffect(() => {
    setLabels(getModelLabels());
  }, [modelLoaded]);

  useEffect(() => {
    const initDetector = async () => {
      try {
        await initializeHandDetector();
        detectorRef.current = true;
      } catch (error) {
        console.error('Failed to initialize detector:', error);
      }
    };

    if (isRunning && !detectorRef.current) {
      initDetector();
    }
  }, [isRunning]);

  const handleFrameCapture = useCallback(
    async (canvas: HTMLCanvasElement) => {
      if (!isRunning || !detectorRef.current || processFrameRef.current) return;

      processFrameRef.current = true;

      try {
        // Detect hands from canvas
        const hands = await detectHands(canvas);
        
        // Update hand detection status
        const handFound = hasHandDetected(hands);
        setIsHandDetected(handFound);

        // Only process if hand is detected
        if (handFound && hands.length > 0 && modelLoaded) {
          const hand = hands[0];
          const normalized = normalizeKeypoints(hand.landmarks);
          
          if (normalized.length === 42) {
            const prediction = predict(normalized);
            if (prediction && prediction.confidence > 0.5) {
              setResult({
                label: prediction.label,
                confidence: prediction.confidence,
              });
            }
          }
        } else {
          setResult(null);
        }
      } catch (error) {
        console.error('Error processing frame:', error);
      } finally {
        processFrameRef.current = false;
      }
    },
    [isRunning, modelLoaded]
  );

  const handleDrawSkeleton = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // This will be called to draw the skeleton - we'll update it during frame processing
      // For now, just a placeholder
    },
    []
  );

  const togglePractice = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      setResult(null);
      setIsHandDetected(false);
    }
  };

  if (!modelLoaded) {
    return (
      <Alert variant="default">
        <p className="text-sm">Train a model first in the Train Model tab to start practicing.</p>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">📷 Live Camera</h3>
            <CameraFeed
              onFrameCapture={handleFrameCapture}
              drawCallback={handleDrawSkeleton}
              showSkeleton={true}
            />
            <Button
              onClick={togglePractice}
              className="w-full mt-4"
              variant={isRunning ? 'destructive' : 'default'}
            >
              {isRunning ? '⏹ Stop Practice' : '▶ Start Practice'}
            </Button>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">🎯 Recognition Result</h3>
            
            {!isHandDetected ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">👋</div>
                <p className="text-sm text-gray-600">
                  Show your hand to the camera
                </p>
              </div>
            ) : result ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {result.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🧠</div>
                <p className="text-sm text-gray-600">
                  Processing...
                </p>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">📋 Known Signs ({labels.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {labels.length > 0 ? (
                labels.map((label, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-blue-100 text-blue-900 rounded-full text-sm"
                  >
                    {label}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No trained labels yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
