import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';

export const FEATURES = ['PAA', 'KSM', 'TS', 'CM', 'AL', 'GO'];
export const TARGET = 'GEN AVG';
export const METRIC_FAILURE_THRESHOLD = 3.0;
export const MODEL_SAVE_PATH = path.join(
  process.cwd(),
  'models',
  'performance-predictor',
);

export interface TrainingData {
  features: number[][];
  targets: number[];
}

export interface ModelMetrics {
  loss: number;
  valLoss?: number;
  mse: number;
  mae: number;
}

export interface TrainingHistory {
  epoch: number[];
  loss: number[];
  valLoss: number[];
  mse: number[];
  mae: number[];
}

/**
 * Normalizes the input data using min-max normalization
 */
export class DataNormalizer {
  private featureMin: number[] = [];
  private featureMax: number[] = [];
  private targetMin = 0;
  private targetMax = 0;

  /**
   * Fit the normalizer to the training data
   */
  fit(features: number[][], targets: number[]): void {
    // Calculate min and max for each feature
    this.featureMin = new Array(features[0].length).fill(Infinity);
    this.featureMax = new Array(features[0].length).fill(-Infinity);

    for (const sample of features) {
      for (let i = 0; i < sample.length; i++) {
        this.featureMin[i] = Math.min(this.featureMin[i], sample[i]);
        this.featureMax[i] = Math.max(this.featureMax[i], sample[i]);
      }
    }

    // Calculate min and max for target
    this.targetMin = Math.min(...targets);
    this.targetMax = Math.max(...targets);
  }

  /**
   * Normalize features
   */
  normalizeFeatures(features: number[][]): number[][] {
    return features.map((sample) =>
      sample.map((value, i) => {
        const range = this.featureMax[i] - this.featureMin[i];
        return range === 0 ? 0 : (value - this.featureMin[i]) / range;
      }),
    );
  }

  /**
   * Normalize targets
   */
  normalizeTargets(targets: number[]): number[] {
    const range = this.targetMax - this.targetMin;
    return targets.map((value) =>
      range === 0 ? 0 : (value - this.targetMin) / range,
    );
  }

  /**
   * Denormalize predictions back to original scale
   */
  denormalizePredictions(predictions: number[]): number[] {
    const range = this.targetMax - this.targetMin;
    return predictions.map((value) => value * range + this.targetMin);
  }

  /**
   * Get normalization parameters for saving
   */
  getParams() {
    return {
      featureMin: this.featureMin,
      featureMax: this.featureMax,
      targetMin: this.targetMin,
      targetMax: this.targetMax,
    };
  }

  /**
   * Load normalization parameters
   */
  loadParams(params: {
    featureMin: number[];
    featureMax: number[];
    targetMin: number;
    targetMax: number;
  }): void {
    this.featureMin = params.featureMin;
    this.featureMax = params.featureMax;
    this.targetMin = params.targetMin;
    this.targetMax = params.targetMax;
  }
}

/**
 * Creates a TensorFlow neural network model for performance prediction
 */
export function createPerformanceModel(inputDim: number): tf.LayersModel {
  const model = tf.sequential();

  // Input layer + first hidden layer
  model.add(
    tf.layers.dense({
      inputShape: [inputDim],
      units: 32,
      activation: 'relu',
      kernelInitializer: 'heNormal',
    }),
  );

  // Dropout for regularization
  model.add(tf.layers.dropout({ rate: 0.2 }));

  // Second hidden layer
  model.add(
    tf.layers.dense({
      units: 16,
      activation: 'relu',
      kernelInitializer: 'heNormal',
    }),
  );

  // Dropout for regularization
  model.add(tf.layers.dropout({ rate: 0.2 }));

  // Third hidden layer
  model.add(
    tf.layers.dense({
      units: 8,
      activation: 'relu',
      kernelInitializer: 'heNormal',
    }),
  );

  // Output layer (single value for GEN AVG prediction)
  model.add(
    tf.layers.dense({
      units: 1,
      activation: 'linear',
    }),
  );

  // Compile the model with Adam optimizer
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae', 'mse'],
  });

  return model;
}

/**
 * Prepares training data from raw records
 */
export function prepareTrainingData(
  data: Record<string, number>[],
): TrainingData {
  const features: number[][] = [];
  const targets: number[] = [];

  for (const record of data) {
    const featureVector = FEATURES.map((feat) => record[feat] || 0);
    features.push(featureVector);
    targets.push(record[TARGET] || 0);
  }

  return { features, targets };
}

/**
 * Trains the TensorFlow model
 */
export async function trainModel(
  model: tf.LayersModel,
  normalizer: DataNormalizer,
  trainingData: TrainingData,
  epochs = 100,
  validationSplit = 0.2,
): Promise<TrainingHistory> {
  // Fit normalizer to data
  normalizer.fit(trainingData.features, trainingData.targets);

  // Normalize data
  const normalizedFeatures = normalizer.normalizeFeatures(
    trainingData.features,
  );
  const normalizedTargets = normalizer.normalizeTargets(trainingData.targets);

  // Convert to tensors
  const xs = tf.tensor2d(normalizedFeatures);
  const ys = tf.tensor2d(normalizedTargets, [normalizedTargets.length, 1]);

  // Train the model
  const history = await model.fit(xs, ys, {
    epochs,
    validationSplit,
    shuffle: true,
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 10 === 0) {
          console.log(
            `Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}, val_loss = ${logs?.val_loss?.toFixed(4) || 'N/A'}`,
          );
        }
      },
    },
  });

  // Clean up tensors
  xs.dispose();
  ys.dispose();

  // Extract history
  const trainingHistory: TrainingHistory = {
    epoch: Array.from({ length: epochs }, (_, i) => i + 1),
    loss: history.history.loss as number[],
    valLoss: (history.history.val_loss as number[]) || [],
    mse: history.history.mse as number[],
    mae: history.history.mae as number[],
  };

  return trainingHistory;
}

/**
 * Makes predictions using the trained model
 */
export async function predict(
  model: tf.LayersModel,
  normalizer: DataNormalizer,
  features: Record<string, number>,
): Promise<number> {
  // Convert features to array
  const featureVector = FEATURES.map((feat) => features[feat] || 0);

  // Normalize
  const normalizedFeatures = normalizer.normalizeFeatures([featureVector]);

  // Convert to tensor
  const inputTensor = tf.tensor2d(normalizedFeatures);

  // Make prediction
  const predictionTensor = model.predict(inputTensor) as tf.Tensor;
  const normalizedPrediction = await predictionTensor.data();

  // Denormalize
  const prediction = normalizer.denormalizePredictions([
    normalizedPrediction[0],
  ])[0];

  // Clean up tensors
  inputTensor.dispose();
  predictionTensor.dispose();

  return prediction;
}

/**
 * Evaluates model performance on test data
 */
export async function evaluateModel(
  model: tf.LayersModel,
  normalizer: DataNormalizer,
  testData: TrainingData,
): Promise<ModelMetrics> {
  const normalizedFeatures = normalizer.normalizeFeatures(testData.features);
  const normalizedTargets = normalizer.normalizeTargets(testData.targets);

  const xs = tf.tensor2d(normalizedFeatures);
  const ys = tf.tensor2d(normalizedTargets, [normalizedTargets.length, 1]);

  const result = model.evaluate(xs, ys) as tf.Scalar[];
  const loss = await result[0].data();
  const mae = await result[1].data();
  const mse = await result[2].data();

  xs.dispose();
  ys.dispose();
  result.forEach((tensor) => tensor.dispose());

  return {
    loss: loss[0],
    mse: mse[0],
    mae: mae[0],
  };
}

/**
 * Saves the TensorFlow model and normalizer to disk
 */
export async function saveModel(
  model: tf.LayersModel,
  normalizer: DataNormalizer,
  trainingHistory: TrainingHistory,
  metrics: ModelMetrics,
): Promise<void> {
  // Create models directory if it doesn't exist
  const modelsDir = path.dirname(MODEL_SAVE_PATH);
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  // Save the TensorFlow model
  await model.save(`file://${MODEL_SAVE_PATH}`);

  // Save normalizer parameters and metadata
  const metadata = {
    normalizerParams: normalizer.getParams(),
    trainingHistory,
    metrics,
    trainedAt: new Date().toISOString(),
    modelVersion: '1.0.0',
  };

  const metadataPath = path.join(MODEL_SAVE_PATH, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  console.log(`Model saved successfully to ${MODEL_SAVE_PATH}`);
}

/**
 * Loads the TensorFlow model and normalizer from disk
 */
export async function loadModel(): Promise<{
  model: tf.LayersModel;
  normalizer: DataNormalizer;
  trainingHistory: TrainingHistory;
  metrics: ModelMetrics;
  trainedAt: Date;
} | null> {
  try {
    // Check if model exists
    const modelJsonPath = path.join(MODEL_SAVE_PATH, 'model.json');
    const metadataPath = path.join(MODEL_SAVE_PATH, 'metadata.json');

    if (!fs.existsSync(modelJsonPath) || !fs.existsSync(metadataPath)) {
      console.log('No saved model found');
      return null;
    }

    // Load the TensorFlow model
    const model = await tf.loadLayersModel(`file://${modelJsonPath}`);

    // Load metadata
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    // Restore normalizer
    const normalizer = new DataNormalizer();
    normalizer.loadParams(metadata.normalizerParams);

    console.log(`Model loaded successfully from ${MODEL_SAVE_PATH}`);
    console.log(`Model was trained at: ${metadata.trainedAt}`);

    return {
      model,
      normalizer,
      trainingHistory: metadata.trainingHistory,
      metrics: metadata.metrics,
      trainedAt: new Date(metadata.trainedAt),
    };
  } catch (error) {
    console.error('Error loading model:', error);
    return null;
  }
}

/**
 * Checks if a saved model exists
 */
export function modelExists(): boolean {
  const modelJsonPath = path.join(MODEL_SAVE_PATH, 'model.json');
  return fs.existsSync(modelJsonPath);
}
