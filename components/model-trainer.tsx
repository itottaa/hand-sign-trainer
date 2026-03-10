'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { trainModel, saveModel, TrainingSample } from '@/lib/model-training';

interface TrainingLog {
  epoch: number;
  loss: number;
  acc: number;
  valAcc: number;
  timestamp: number;
}

interface ModelTrainerProps {
  samples: TrainingSample[];
  onModelTrained: () => void;
}

export const ModelTrainer: React.FC<ModelTrainerProps> = ({ samples, onModelTrained }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    loss: 0,
    acc: 0,
    valAcc: 0,
  });

  // Group samples by label
  const labels = Array.from(new Set(samples.map(s => s.label)));
  const groupedSamples = samples.reduce(
    (acc, sample) => {
      const idx = acc.findIndex(g => g.label === sample.label);
      if (idx === -1) {
        acc.push({ label: sample.label, samples: [sample] });
      } else {
        acc[idx].samples.push(sample);
      }
      return acc;
    },
    [] as Array<{ label: string; samples: TrainingSample[] }>
  );

  const startTraining = async () => {
    if (samples.length < 10) {
      alert('Collect at least 10 samples before training');
      return;
    }

    if (labels.length < 2) {
      alert('You need at least 2 different signs to train a model');
      return;
    }

    setIsTraining(true);
    setLogs([]);
    setProgress(0);

    try {
      const trainingData = {
        samples,
        labels,
      };

      const epochs = 80;
      await trainModel(
        trainingData,
        epochs,
        16,
        0.15,
        (epoch, logsData) => {
          setProgress((epoch / epochs) * 100);
          setStats({
            loss: logsData.loss,
            acc: logsData.acc,
            valAcc: logsData.val_acc,
          });

          const newLog: TrainingLog = {
            epoch: epoch + 1,
            loss: logsData.loss,
            acc: logsData.acc,
            valAcc: logsData.val_acc,
            timestamp: Date.now(),
          };

          setLogs(prev => [...prev, newLog]);
        }
      );

      // Save model
      await saveModel('hand-sign-model');

      alert('Training complete! Model saved.');
      onModelTrained();
    } catch (error) {
      console.error('Training error:', error);
      alert('Training failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Card className="p-4">
            <h3 className="font-semibold mb-4">📊 Training Dataset</h3>
            {samples.length > 0 ? (
              <div className="space-y-2">
                {groupedSamples.map(group => (
                  <div
                    key={group.label}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="font-medium">{group.label}</span>
                    <span className="text-sm text-gray-600">{group.samples.length} samples</span>
                  </div>
                ))}
                <hr className="my-3" />
                <div className="flex justify-between items-center font-semibold">
                  <span>Total</span>
                  <span>{samples.length} samples</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Classes</span>
                  <span>{labels.length} labels</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600">
                  No data yet — collect samples first
                </p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">⚙️ Training Settings</h3>
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-xs text-gray-600">Epochs</p>
                <p className="text-lg font-semibold">80</p>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-xs text-gray-600">Batch</p>
                <p className="text-lg font-semibold">16</p>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-xs text-gray-600">Val Split</p>
                <p className="text-lg font-semibold">15%</p>
              </div>
            </div>

            <Alert variant="default" className="text-xs mb-4">
              <p>
                Architecture: Dense(128) → BN → Dropout → Dense(64) → BN → Dropout → Dense(32) → Softmax
              </p>
            </Alert>

            <Button
              onClick={startTraining}
              disabled={isTraining || samples.length < 10}
              className="w-full"
              variant={isTraining ? 'outline' : 'default'}
            >
              {isTraining ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Training...
                </>
              ) : (
                '🧠 Start Training'
              )}
            </Button>
          </Card>
        </div>
      </div>

      {isTraining && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">📈 Live Training Progress</h3>

          <div className="mb-4">
            <p className="text-sm font-medium mb-2">
              Epoch {Math.round(progress / (100 / 80))} / 80
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">Loss</p>
              <p className="text-lg font-semibold">{stats.loss.toFixed(4)}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">Train Acc</p>
              <p className="text-lg font-semibold">{(stats.acc * 100).toFixed(1)}%</p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">Val Acc</p>
              <p className="text-lg font-semibold text-green-600">
                {(stats.valAcc * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {logs.length > 0 && (
            <div className="max-h-48 overflow-y-auto bg-gray-50 rounded p-3 font-mono text-xs space-y-1">
              {logs.slice(-10).map((log, idx) => (
                <div key={idx} className="text-gray-700">
                  <span className="text-gray-500">// Epoch {log.epoch}</span>
                  <div className="ml-4">
                    loss: {log.loss.toFixed(4)} | acc: {(log.acc * 100).toFixed(1)}% | val_acc:{' '}
                    {(log.valAcc * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
