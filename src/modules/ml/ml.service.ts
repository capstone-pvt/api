import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as xlsx from 'xlsx';
import * as tf from '@tensorflow/tfjs';
import { PersonnelService } from '../personnel/personnel.service';
import { PerformanceEvaluationsService } from '../performance-evaluations/performance-evaluations.service';
import { InjectModel } from '@nestjs/mongoose';
import {
  PerformanceEvaluation,
  PerformanceEvaluationDocument,
} from '../performance-evaluations/schemas/performance-evaluation.schema';
import { Model } from 'mongoose';
import {
  FEATURES,
  TARGET,
  METRIC_FAILURE_THRESHOLD,
  DataNormalizer,
  createPerformanceModel,
  prepareTrainingData,
  trainModel,
  predict,
  evaluateModel,
  TrainingHistory,
  ModelMetrics,
  saveModel,
  loadModel,
  modelExists,
} from './tensorflow-model';

let tensorflowModel: {
  model: tf.LayersModel;
  normalizer: DataNormalizer;
  trainedAt: Date;
  trainingHistory: TrainingHistory;
  metrics: ModelMetrics;
} | null = null;

export interface PredictionResponse {
  prediction: number;
  trainedAt: Date;
  failedMetrics: string[];
  modelMetrics?: ModelMetrics;
}

export interface TrainingResponse {
  message: string;
  records: number;
  trainingHistory: TrainingHistory;
  metrics: ModelMetrics;
  trainedAt: Date;
}

@Injectable()
export class MlService {
  constructor(
    private readonly personnelService: PersonnelService,
    private readonly performanceEvaluationsService: PerformanceEvaluationsService,
    @InjectModel(PerformanceEvaluation.name)
    private readonly performanceEvaluationModel: Model<PerformanceEvaluationDocument>,
  ) {
    this.initializeModel();
  }

  /**
   * Initialize the model by loading from disk if available
   */
  private async initializeModel() {
    try {
      if (modelExists()) {
        console.log('Loading existing TensorFlow model...');
        const loadedModel = await loadModel();
        if (loadedModel) {
          tensorflowModel = loadedModel;
          console.log('TensorFlow model loaded successfully');
        }
      } else {
        console.log(
          'No existing model found. Train a new model to get started.',
        );
      }
    } catch (error) {
      console.error('Error initializing model:', error);
    }
  }

  @Cron('0 0 * * *')
  handleCron() {
    console.log('Scheduled task: Checking for model updates...');
  }

  async getAnalytics() {
    const overallAverages = await this.performanceEvaluationModel.aggregate([
      {
        $group: {
          _id: null,
          PAA: { $avg: '$scores.PAA' },
          KSM: { $avg: '$scores.KSM' },
          TS: { $avg: '$scores.TS' },
          CM: { $avg: '$scores.CM' },
          AL: { $avg: '$scores.AL' },
          GO: { $avg: '$scores.GO' },
          totalEvaluations: { $sum: 1 },
        },
      },
    ]);

    const semesterTrends = await this.performanceEvaluationModel.aggregate([
      {
        $group: {
          _id: '$semester',
          avgScore: {
            $avg: {
              $avg: [
                '$scores.PAA',
                '$scores.KSM',
                '$scores.TS',
                '$scores.CM',
                '$scores.AL',
                '$scores.GO',
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      overallAverages: overallAverages[0] || {},
      semesterTrends,
    };
  }

  async trainModelFromFile(fileBuffer: Buffer): Promise<TrainingResponse> {
    console.log('Starting TensorFlow model training...');

    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      throw new Error('No data found in the uploaded file');
    }

    // Prepare training data
    const trainingData = prepareTrainingData(data);

    // Split data for validation (80-20 split)
    const splitIndex = Math.floor(trainingData.features.length * 0.8);
    const trainFeatures = trainingData.features.slice(0, splitIndex);
    const trainTargets = trainingData.targets.slice(0, splitIndex);
    const testFeatures = trainingData.features.slice(splitIndex);
    const testTargets = trainingData.targets.slice(splitIndex);

    // Dispose of previous model if it exists
    if (tensorflowModel?.model) {
      tensorflowModel.model.dispose();
    }

    // Create new model and normalizer
    const model = createPerformanceModel(FEATURES.length);
    const normalizer = new DataNormalizer();

    console.log(
      `Training on ${trainFeatures.length} samples, validating on ${testFeatures.length} samples`,
    );

    // Train the model
    const history = await trainModel(
      model,
      normalizer,
      { features: trainFeatures, targets: trainTargets },
      100, // epochs
      0.2, // validation split
    );

    // Evaluate on test set
    const metrics = await evaluateModel(model, normalizer, {
      features: testFeatures,
      targets: testTargets,
    });

    console.log('Model training completed!');
    console.log(
      `Test Metrics - Loss: ${metrics.loss.toFixed(4)}, MAE: ${metrics.mae.toFixed(4)}, MSE: ${metrics.mse.toFixed(4)}`,
    );

    // Store the trained model
    const trainedAt = new Date();
    tensorflowModel = {
      model,
      normalizer,
      trainedAt,
      trainingHistory: history,
      metrics,
    };

    // Save the model to disk
    try {
      await saveModel(model, normalizer, history, metrics);
      console.log('Model saved to disk successfully');
    } catch (error) {
      console.error('Error saving model to disk:', error);
      // Continue even if save fails
    }

    return {
      message: 'TensorFlow model trained successfully from file.',
      records: data.length,
      trainingHistory: history,
      metrics,
      trainedAt,
    };
  }

  async predictPerformance(personnelId: string): Promise<PredictionResponse> {
    if (!tensorflowModel) {
      throw new NotFoundException(
        'TensorFlow model not trained yet. Please upload a training file.',
      );
    }

    const latestEvaluation =
      await this.performanceEvaluationsService.findLatestByPersonnelId(
        personnelId,
      );
    if (!latestEvaluation) {
      throw new NotFoundException(
        'No performance evaluation found for this person. Please add an evaluation first.',
      );
    }

    const features = latestEvaluation.scores as unknown as Record<
      string,
      number
    >;
    const prediction = await predict(
      tensorflowModel.model,
      tensorflowModel.normalizer,
      features,
    );
    const roundedPrediction = Number.parseFloat(prediction.toFixed(2));

    const failedMetrics = FEATURES.filter(
      (feat) => features[feat] < METRIC_FAILURE_THRESHOLD,
    );

    await this.personnelService.update(personnelId, {
      predictedPerformance: roundedPrediction.toString(),
    });

    return {
      prediction: roundedPrediction,
      trainedAt: tensorflowModel.trainedAt,
      failedMetrics,
      modelMetrics: tensorflowModel.metrics,
    };
  }

  async predictManual(
    metrics: Record<string, number>,
    personnelId: string,
    semester: string,
  ): Promise<PredictionResponse> {
    if (!tensorflowModel) {
      throw new NotFoundException(
        'TensorFlow model not trained yet. Please upload a training file.',
      );
    }

    // Check if prediction already exists for this personnel and semester
    const hasExisting =
      await this.performanceEvaluationsService.hasEvaluationForSemester(
        personnelId,
        semester,
      );

    if (hasExisting) {
      throw new BadRequestException(
        `A prediction already exists for this personnel in ${semester}. Cannot create duplicate predictions for the same semester.`,
      );
    }

    const prediction = await predict(
      tensorflowModel.model,
      tensorflowModel.normalizer,
      metrics,
    );
    const roundedPrediction = Number.parseFloat(prediction.toFixed(2));
    const failedMetrics = FEATURES.filter(
      (feat) => metrics[feat] < METRIC_FAILURE_THRESHOLD,
    );

    // Update personnel with predicted performance
    await this.personnelService.update(personnelId, {
      predictedPerformance: roundedPrediction.toString(),
    });

    return {
      prediction: roundedPrediction,
      trainedAt: tensorflowModel.trainedAt,
      failedMetrics,
      modelMetrics: tensorflowModel.metrics,
    };
  }

  /**
   * Get training history and model metrics
   */
  getModelInfo() {
    if (!tensorflowModel) {
      throw new NotFoundException('TensorFlow model not trained yet.');
    }

    return {
      trainedAt: tensorflowModel.trainedAt,
      trainingHistory: tensorflowModel.trainingHistory,
      metrics: tensorflowModel.metrics,
      modelSummary: {
        inputFeatures: FEATURES,
        targetVariable: TARGET,
        architecture: 'Neural Network (32-16-8-1)',
      },
    };
  }

  /**
   * Check if the model is trained
   */
  isModelTrained(): boolean {
    return tensorflowModel !== null;
  }

  /**
   * Check if a personnel already has a prediction for a specific semester
   */
  async checkExistingPrediction(
    personnelId: string,
    semester: string,
  ): Promise<{ exists: boolean; evaluation?: any }> {
    const evaluation =
      await this.performanceEvaluationsService.findByPersonnelAndSemester(
        personnelId,
        semester,
      );

    if (evaluation) {
      return {
        exists: true,
        evaluation: {
          _id: (evaluation as any)._id,
          personnel: evaluation.personnel,
          semester: evaluation.semester,
          evaluationDate: evaluation.evaluationDate,
          scores: evaluation.scores,
          feedback: evaluation.feedback,
        },
      };
    }

    return { exists: false };
  }
}
