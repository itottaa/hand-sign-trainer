'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraFeed } from './camera-feed';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import {
  initializeHandDetector,
  detectHands,
  normalizeKeypoints,
  hasHandDetected,
  type DetectedHand,
} from '@/lib/hand-detection';

interface CollectedSample {
  label: string;
  keypoints: number[];
  timestamp: number;
}

interface DataCollectorProps {
  onSamplesCollected: (samples: CollectedSample[]) => void;
  samples: CollectedSample[];
  onClearSamples: () => void;
}

export const DataCollector: React.FC<DataCollectorProps> = ({
  onSamplesCollected,
  samples,
  onClearSamples,
}) => {
  const [signName, setSignName] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);
  const [count, setCount] = useState(0);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const detectorRef = useRef<boolean>(false);
  const collectIntervalRef = useRef<NodeJS.Timeout>();
  const processFrameRef = useRef(false);
  const lastFrameTimeRef = useRef(0);

  useEffect(() => {
    const initDetector = async () => {
      try {
        await initializeHandDetector();
        detectorRef.current = true;
      } catch (error) {
        console.error('Failed to initialize detector:', error);
      }
    };

    initDetector();
  }, []);

  const handleFrameCapture = useCallback(
    async (canvas: HTMLCanvasElement) => {
      if (!isCollecting || !detectorRef.current || processFrameRef.current) return;

      processFrameRef.current = true;

      try {
        const hands = await detectHands(canvas);
        const handFound = hasHandDetected(hands);
        setIsHandDetected(handFound);

        if (
          handFound &&
          hands.length > 0 &&
          signName &&
          Date.now() - lastFrameTimeRef.current > 100
        ) {
          const hand = hands[0];
          const normalized = normalizeKeypoints(hand.landmarks);

          if (normalized.length === 42) {
            const newSample: CollectedSample = {
              label: signName,
              keypoints: normalized,
              timestamp: Date.now(),
            };

            const updatedSamples = [...samples, newSample];
            onSamplesCollected(updatedSamples);
            setCount(updatedSamples.length);
            lastFrameTimeRef.current = Date.now();

            if (updatedSamples.length >= 30) {
              setIsCollecting(false);
            }
          }
        }
      } catch (error) {
        console.error('Error processing frame:', error);
      } finally {
        processFrameRef.current = false;
      }
    },
    [isCollecting, signName, samples, onSamplesCollected]
  );

  const startCollecting = () => {
    if (!signName.trim()) {
      alert('Please enter a sign name');
      return;
    }

    setIsCollecting(true);
    setCount(samples.filter(s => s.label === signName).length);
    lastFrameTimeRef.current = Date.now();
  };

  const stopCollecting = () => {
    setIsCollecting(false);
  };

  const groupedSamples = samples.reduce(
    (acc, sample) => {
      if (!acc[sample.label]) {
        acc[sample.label] = [];
      }
      acc[sample.label].push(sample);
      return acc;
    },
    {} as Record<string, CollectedSample[]>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">📷 Camera Feed</h3>
            <CameraFeed onFrameCapture={handleFrameCapture} />
            
            {!isHandDetected && isCollecting && (
              <Alert variant="default" className="mt-4">
                <p className="text-sm">Waiting for hand detection...</p>
              </Alert>
            )}

            {isCollecting && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">{count}/30</p>
                <p className="text-sm text-blue-700">samples collected</p>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="p-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-3">✏️ Collect Samples</h3>
              <p className="text-xs text-gray-600 mb-3">
                Need 30 samples per sign for good accuracy
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sign Name</label>
              <Input
                type="text"
                placeholder="e.g. Hello, A, Thank You"
                value={signName}
                onChange={(e) => setSignName(e.target.value)}
                disabled={isCollecting}
              />
            </div>

            <div className="flex gap-2">
              {!isCollecting ? (
                <Button
                  onClick={startCollecting}
                  className="flex-1"
                  variant="default"
                >
                  ▶ Start Collecting (30)
                </Button>
              ) : (
                <Button
                  onClick={stopCollecting}
                  className="flex-1"
                  variant="destructive"
                >
                  ⏹ Stop
                </Button>
              )}
            </div>

            <hr className="my-4" />

            <div>
              <div className="font-semibold mb-3">🗂️ Collected Signs</div>
              {Object.keys(groupedSamples).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(groupedSamples).map(([label, items]) => (
                    <div
                      key={label}
                      className="px-3 py-2 bg-green-100 text-green-900 rounded-full text-sm flex justify-between items-center"
                    >
                      <span>{label}</span>
                      <span className="font-semibold">{items.length}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">
                  No samples collected yet
                </p>
              )}
            </div>

            {Object.keys(groupedSamples).length > 0 && (
              <Button
                onClick={onClearSamples}
                variant="outline"
                className="w-full"
              >
                🗑️ Clear All Samples
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
