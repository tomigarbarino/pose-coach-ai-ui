export interface FeedbackItem {
  title: string;
  description: string;
  status: 'success' | 'warning' | 'error';
}

export interface PoseEvaluationResult {
  score: number;
  feedback: FeedbackItem[];
  keypoints: Array<{
    part: string;
    position: { x: number; y: number };
    score: number;
  }>;
}
