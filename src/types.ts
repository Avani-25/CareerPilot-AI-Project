export interface SkillPresent {
  name: string;
  category: string;
}

export interface SkillMissing {
  name: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  recommendedResource: {
    title: string;
    type: 'Course' | 'Book' | 'Project' | 'Documentation';
    platform: string;
    url: string;
  };
}

export interface ImprovementRecommendation {
  category: string;
  description: string;
  actionStep: string;
}

export interface RoadmapMilestone {
  id: string;
  phase: string;
  title: string;
  duration: string;
  skills: string[];
  actionSteps: string[];
  completed?: boolean;
}

export interface MockQuestion {
  id: string;
  question: string;
  type: 'Technical' | 'Behavioral' | 'Scenario';
  sampleAnswer: string;
}

export interface AnalysisResult {
  matchScore: number;
  skillsPresent: SkillPresent[];
  skillsMissing: SkillMissing[];
  recommendedImprovements: ImprovementRecommendation[];
  learningRoadmap: RoadmapMilestone[];
  mockQuestions: MockQuestion[];
  finalCareerAdvice: string;
  analyzedAt: string;
}

export interface InterviewTurn {
  id: string;
  question: string;
  type: 'Technical' | 'Behavioral' | 'Scenario';
  userResponse?: string;
  feedback?: string;
  score?: number; // 0-100
}

export interface MockInterviewSession {
  id: string;
  jobTitle: string;
  turns: InterviewTurn[];
  currentIndex: number;
  isCompleted: boolean;
  overallFeedback?: string;
  overallScore?: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface CareerProfile {
  resumeText: string;
  resumeFileName?: string;
  jobDescriptionText: string;
  jobTitle?: string;
  targetRole?: string;
  analysis?: AnalysisResult;
  interviewSession?: MockInterviewSession;
  chatHistory: ChatMessage[];
}
