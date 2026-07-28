import { Question } from '../types';
import { getFullSimulatedQuestions } from './questionGenerator';

// Consolidating 1400 high-quality simulated questions for a top-tier CEBRASPE preparation
export const quizQuestions: Question[] = getFullSimulatedQuestions();
