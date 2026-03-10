import * as tf from '@tensorflow/tfjs';

export interface TrainingSample {
  keypoints: number[];
  label: string;
  timestamp: number;
}

export interface TrainingData {
  samples: TrainingSample[];
  labels: string[];
}

export interface PredictionResult {
  label: string;
  confidence: number;
  allPredictions: { label: string; confidence: number }[];
}

let model: tf.LayersModel | null = null;
let labelMap: Map<string, number> = new Map();
let numberToLabel: Map<number, string> = new Map();

export const createModel = (numClasses: number): tf.LayersModel => {
  const input = tf.input({ shape: [42] }); // 21 keypoints * 2 (x, y)

  let x = tf.layers.dense({
    units: 128,
    activation: 'relu',
  }).apply(input) as tf.SymbolicTensor;

  x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
  x = tf.layers.dropout({ rate: 0.3 }).apply(x) as tf.SymbolicTensor;

  x = tf.layers.dense({
    units: 64,
    activation: 'relu',
  }).apply(x) as tf.SymbolicTensor;

  x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
  x = tf.layers.dropout({ rate: 0.3 }).apply(x) as tf.SymbolicTensor;

  x = tf.layers.dense({
    units: 32,
    activation: 'relu',
  }).apply(x) as tf.SymbolicTensor;

  const output = tf.layers.dense({
    units: numClasses,
    activation: 'softmax',
  }).apply(x) as tf.SymbolicTensor;

  const compiledModel = tf.model({ inputs: input, outputs: output });

  compiledModel.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return compiledModel;
};

export const trainModel = async (
  data: TrainingData,
  epochs: number = 80,
  batchSize: number = 16,
  validationSplit: number = 0.15,
  onEpochEnd?: (epoch: number, logs: any) => void
): Promise<tf.LayersModel> => {
  if (data.samples.length === 0) {
    throw new Error('No training data provided');
  }

  // Create label mapping
  labelMap.clear();
  numberToLabel.clear();
  data.labels.forEach((label, idx) => {
    labelMap.set(label, idx);
    numberToLabel.set(idx, label);
  });

  // Prepare training data
  const keypoints = data.samples.map(s => s.keypoints);
  const labels = data.samples.map(s => {
    const idx = labelMap.get(s.label) || 0;
    const oneHot = new Array(data.labels.length).fill(0);
    oneHot[idx] = 1;
    return oneHot;
  });

  const xs = tf.tensor2d(keypoints, [keypoints.length, 42]);
  const ys = tf.tensor2d(labels, [labels.length, data.labels.length]);

  // Create and train model
  model = createModel(data.labels.length);

  await model.fit(xs, ys, {
    epochs,
    batchSize,
    validationSplit,
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (onEpochEnd) {
          onEpochEnd(epoch, logs);
        }
      },
    },
  });

  // Clean up tensors
  xs.dispose();
  ys.dispose();

  return model;
};

export const predict = (keypoints: number[]): PredictionResult | null => {
  if (!model) {
    return null;
  }

  const input = tf.tensor2d([keypoints], [1, 42]);
  const predictions = model.predict(input) as tf.Tensor;
  const predArray = predictions.dataSync();

  const results = Array.from(predArray).map((conf, idx) => ({
    label: numberToLabel.get(idx) || `Class ${idx}`,
    confidence: conf,
  }));

  const maxIdx = Array.from(predArray).indexOf(Math.max(...Array.from(predArray)));
  const label = numberToLabel.get(maxIdx) || `Class ${maxIdx}`;
  const confidence = predArray[maxIdx];

  input.dispose();
  predictions.dispose();

  return {
    label,
    confidence,
    allPredictions: results,
  };
};

export const saveModel = async (name: string = 'hand-sign-model'): Promise<void> => {
  if (!model) {
    throw new Error('No model to save');
  }

  // Save to IndexedDB
  await model.save(`indexeddb://${name}`);

  // Also save label mapping to localStorage
  const labelMapObj = Object.fromEntries(labelMap);
  const numberToLabelObj = Object.fromEntries(numberToLabel);
  localStorage.setItem(`${name}-labelmap`, JSON.stringify(labelMapObj));
  localStorage.setItem(`${name}-numbertolabel`, JSON.stringify(numberToLabelObj));
};

export const loadModel = async (name: string = 'hand-sign-model'): Promise<tf.LayersModel | null> => {
  try {
    model = await tf.loadLayersModel(`indexeddb://${name}`);

    // Load label mapping
    const labelMapStr = localStorage.getItem(`${name}-labelmap`);
    const numberToLabelStr = localStorage.getItem(`${name}-numbertolabel`);

    if (labelMapStr) {
      const labelMapObj = JSON.parse(labelMapStr);
      labelMap = new Map(Object.entries(labelMapObj));
    }

    if (numberToLabelStr) {
      const numberToLabelObj = JSON.parse(numberToLabelStr);
      numberToLabel = new Map(
        Object.entries(numberToLabelObj).map(([k, v]) => [parseInt(k), v as string])
      );
    }

    return model;
  } catch (error) {
    console.warn('Could not load model:', error);
    return null;
  }
};

export const getModelLabels = (): string[] => {
  return Array.from(numberToLabel.values()).sort();
};

export const disposeModel = (): void => {
  if (model) {
    model.dispose();
    model = null;
  }
  labelMap.clear();
  numberToLabel.clear();
};
