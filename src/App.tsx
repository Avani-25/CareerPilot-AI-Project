import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  GraduationCap, 
  MessageSquare, 
  Send, 
  RefreshCw, 
  Award, 
  BookOpen, 
  TrendingUp, 
  User, 
  Upload, 
  Info, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Book,
  PenTool,
  Check,
  BrainCircuit,
  MessageCircle
} from 'lucide-react';
import { DEMO_RESUME, DEMO_JOB_DESCRIPTION } from './data';
import { 
  AnalysisResult, 
  ChatMessage, 
  MockInterviewSession, 
  SkillMissing, 
  RoadmapMilestone,
  MockQuestion
} from './types';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'analysis' | 'roadmap' | 'interview' | 'chat'>('analysis');

  // Intake State
  const [resumeText, setResumeText] = useState<string>(DEMO_RESUME);
  const [jobDescriptionText, setJobDescriptionText] = useState<string>(DEMO_JOB_DESCRIPTION);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Analysis result state
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Completed roadmap milestones local tracking
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>({});

  // Applied resume improvements tracker to simulate dynamic score increase!
  const [appliedImprovements, setAppliedImprovements] = useState<Record<number, boolean>>({});

  // Mock interview state
  const [interviewSession, setInterviewSession] = useState<MockInterviewSession | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [userAnswerInput, setUserAnswerInput] = useState<string>('');
  const [isGradingAnswer, setIsGradingAnswer] = useState<boolean>(false);
  const [interviewHistory, setInterviewHistory] = useState<{
    question: string;
    answer: string;
    score: number;
    feedback: string;
    strongerPhrasing: string;
  }[]>([]);

  // Chat/Conversation state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am your CareerPilot AI consultant. Upload your resume or copy down your target job description, and I will align them perfectly to guide you into your dream role. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatSending, setIsChatSending] = useState<boolean>(false);

  // Refs
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Load sample template triggers
  const handleLoadSample = () => {
    setResumeText(DEMO_RESUME);
    setJobDescriptionText(DEMO_JOB_DESCRIPTION);
  };

  const handleClear = () => {
    setResumeText('');
    setJobDescriptionText('');
  };

  // Perform core alignment analysis
  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDescriptionText.trim()) {
      setAnalysisError("Please provide both a Resume and a Job Description to begin your coaching alignment!");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAppliedImprovements({});

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescriptionText
        }),
      });

      if (!response.ok) {
        throw new Error("We encountered a temporary server error. Please retry analyzing.");
      }

      const result = await response.json();
      setAnalysis(result);
      
      // Auto transition tab
      setActiveTab('analysis');

      // Prep mock questions for interview session if available
      if (result.mockQuestions && result.mockQuestions.length > 0) {
        const questionsList = result.mockQuestions.map((q: any) => ({
          question: q.question,
          type: q.type,
          sampleAnswer: q.sampleAnswer
        }));

        // Reset interview
        setInterviewHistory([]);
        setActiveQuestionIndex(0);
        setUserAnswerInput('');
      }

      // Add analysis intro chat message
      const coachText = `I've finished aligning your resume with the target job spec. We scored your current resume compatibility as **${result.matchScore}/100**.

I identified ${result.skillsMissing.length} critical skills gaps, notably in high-priority items. I've designed a specialized visual roadmap to close these gaps and formulated tailor-made mock interview scenarios we can practice.

Would you like to start with the **Mock Interview Questions** or check the **Personalized roadmap** first?`;
      
      setChatMessages(prev => [
        ...prev,
        {
          id: 'analysis-alert',
          sender: 'ai',
          text: coachText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Failed to parse alignment details.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Switch milestones completion status
  const toggleMilestone = (id: string) => {
    setCompletedMilestones(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handle local text file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        setResumeText(event.target.result);
      }
    };
    reader.readAsText(file);
  };

  // Simulate dynamic resume improvement points score impact
  const toggleImprovement = (index: number) => {
    setAppliedImprovements(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Calculate adjusted Dynamic Match Score
  const getAdjustedScore = () => {
    if (!analysis) return 0;
    const improvementsCount = Object.values(appliedImprovements).filter(Boolean).length;
    // Each improvement adds a realistic increment to target 95 max
    const bonus = improvementsCount * 3.5;
    return Math.min(Math.round(analysis.matchScore + bonus), 98);
  };

  // Grade user's specific interview response
  const handleGradeAnswer = async (question: string, type: string) => {
    if (!userAnswerInput.trim()) return;

    setIsGradingAnswer(true);
    try {
      const response = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          type,
          userResponse: userAnswerInput
        }),
      });

      if (!response.ok) {
        throw new Error("Temporary evaluation timeout. Please submit again.");
      }

      const feedbackData = await response.json();

      const newHistoryItem = {
        question,
        answer: userAnswerInput,
        score: feedbackData.score || 80,
        feedback: feedbackData.feedback || "Excellent structure but missing details.",
        strongerPhrasing: feedbackData.strongerPhrasing || "Consider highlighting microservice synchronization explicitly."
      };

      setInterviewHistory(prev => [...prev, newHistoryItem]);
      setUserAnswerInput('');

      // Advance to next question index if possible
      if (analysis && activeQuestionIndex < analysis.mockQuestions.length - 1) {
        setActiveQuestionIndex(prev => prev + 1);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsGradingAnswer(false);
    }
  };

  // Send a message in coaching chat
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsChatSending(true);
    const activeMsgText = chatInput;
    setChatInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatHistory: chatMessages.slice(-10), // Send last 10 messages for relevant memory
          userMessage: activeMsgText,
          resumeText,
          jobDescriptionText
        }),
      });

      const result = await response.json();

      const botMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'ai',
        text: result.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'ai',
          text: "My apologies, I had trouble reaching the cloud coach portal. Would you mind repeating that query?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  // Quick Prompt Injection
  const handleQuickPrompt = (prompt: string) => {
    setChatInput(prompt);
  };

  // SVG Radar/Gauge math values
  const circumference = 2 * Math.PI * 88;
  const originalScore = analysis ? analysis.matchScore : 0;
  const currentCalculatedScore = getAdjustedScore();
  const strokeDashoffset = circumference - (currentCalculatedScore / 100) * circumference;

  return (
    <div id="careerpilot-root" className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col antialiased">
      {/* Top Professional Navigation */}
      <nav id="navbar" className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div id="brand" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-md shadow-indigo-200">
            <TrendingUp id="logo-icon" className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight font-display text-zinc-800">
            CareerPilot <span className="text-indigo-600">AI</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">
            Expert Coach
          </span>
        </div>

        {/* Tab Controls only visible when analysis exists */}
        {analysis && (
          <div id="tab-controls" className="flex gap-1 md:gap-4 text-sm font-medium">
            <button 
              id="analysis-nav-btn"
              onClick={() => setActiveTab('analysis')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'analysis' ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'}`}
            >
              Analysis
            </button>
            <button 
              id="roadmap-nav-btn"
              onClick={() => setActiveTab('roadmap')}
              className={`px-3 py-1.5 rounded-md transition relative ${activeTab === 'roadmap' ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'}`}
            >
              Roadmaps
              {Object.keys(completedMilestones).length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
              )}
            </button>
            <button 
              id="interview-nav-btn"
              onClick={() => setActiveTab('interview')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'interview' ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'}`}
            >
              Mock Interview
            </button>
            <button 
              id="chat-nav-btn"
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'chat' ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'}`}
            >
              Coach Chat
            </button>
          </div>
        )}

        <div id="user-profile" className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Candidate Portal</div>
            <div className="text-xs font-semibold text-zinc-700">{analysis ? "Sarah Jenkins (Senior Profile)" : "Guest Candidate"}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            SJ
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">

        {/* Step 1: Intake & Sandbox (Fixed design at top or standalone when no data) */}
        {!analysis && (
          <div id="hero-banner" className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 md:p-10 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
            <div className="max-w-xl z-10">
              <div className="flex items-center gap-2 mb-3 bg-white/10 px-3 py-1 rounded-full w-max text-indigo-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>Next-Gen Career Alignment</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold font-display leading-[1.1] mb-3">
                Your AI Copilot for <span className="text-indigo-300">Career Success</span>
              </h1>
              <p className="text-indigo-100 text-sm md:text-base leading-relaxed font-light">
                Secure top-tier offers. Analyze deep compatibility matching scores, visualize tailored roadmaps, and perform guided mock interviews calibrated directly to missing skills.
              </p>
            </div>
            <div className="flex gap-3 z-10 w-full md:w-auto">
              <button 
                id="load-demo-btn"
                onClick={handleLoadSample} 
                className="flex-1 md:flex-none px-5 py-3 border border-white/20 hover:border-white/40 hover:bg-white/5 active:bg-white/10 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
              >
                <Briefcase className="w-4 h-4 text-indigo-300" />
                Load ApexGlobal Demo
              </button>
            </div>
          </div>
        )}

        {/* INTAKE CARD */}
        <div id="intake-section" className={`${analysis ? 'bg-white p-6 rounded-xl border border-zinc-200 shadow-sm' : ''}`}>
          {analysis && (
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-zinc-800">Target Alignment Inputs</h2>
              </div>
              <button 
                id="re-evaluate-btn"
                onClick={() => setAnalysis(null)} 
                className="text-xs font-semibold text-zinc-500 hover:text-indigo-600 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3 h-3" /> Change Documents
              </button>
            </div>
          )}

          {!analysis && (
            <div className="mb-2">
              <h2 className="text-lg font-bold font-display text-zinc-800 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-indigo-600" /> Connect Your Profile
              </h2>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                Provide your details below manually or test the experience with our sample senior software engineering parameters.
              </p>
            </div>
          )}

          {(!analysis || isAnalyzing) && (
            <div id="inputs-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              {/* Resume Panel */}
              <div id="resume-input-container" className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-zinc-100/80 px-3 py-2 rounded-t-lg border-t border-x border-zinc-200">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" /> Candidate Resume (.txt / plain)
                  </label>
                  <div className="flex items-center gap-2">
                    <button 
                      id="upload-trigger-btn"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-bold py-1 px-2.5 rounded shadow-xs transition flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3 text-zinc-400" /> Upload File
                    </button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".txt,.md" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </div>
                </div>
                <textarea
                  id="resume-textarea"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your plain-text resume here..."
                  className="w-full h-80 p-4 border border-zinc-200 rounded-b-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-mono text-zinc-700 leading-relaxed overflow-y-auto resize-none"
                />
              </div>

              {/* Job Description Panel */}
              <div id="job-input-container" className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-zinc-100/80 px-3 py-2 rounded-t-lg border-t border-x border-zinc-200">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> Target Job Description
                  </label>
                  <span className="text-[10px] text-zinc-400 font-medium">Clear formatting helps AST matching</span>
                </div>
                <textarea
                  id="job-textarea"
                  value={jobDescriptionText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                  placeholder="Paste your target job description here..."
                  className="w-full h-80 p-4 border border-zinc-200 rounded-b-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-mono text-zinc-700 leading-relaxed overflow-y-auto resize-none"
                />
              </div>
            </div>
          )}

          {/* Action trigger button */}
          {(!analysis || isAnalyzing) && (
            <div id="trigger-actions" className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-t border-zinc-100">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Our AI matching scoring system checks matching keywords, density gaps, and formatting consistency.</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  id="clear-inputs-btn"
                  onClick={handleClear}
                  disabled={isAnalyzing}
                  className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 font-bold rounded-lg text-sm hover:bg-zinc-50 transition active:bg-zinc-100 disabled:opacity-50"
                >
                  Clear Fields
                </button>
                <button
                  id="start-analysis-btn"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="cursor-pointer font-bold relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-indigo-600 to-indigo-800 group-hover:from-purple-600 group-hover:to-pink-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-indigo-300 dark:focus:ring-indigo-800 w-full sm:w-56"
                >
                  <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-indigo-950 text-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0 flex items-center justify-center gap-2 w-full">
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        Aligning Profile...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-300" />
                        Analyze Alignment
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          )}

          {analysisError && (
            <div id="analysis-error-banner" className="mt-4 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>{analysisError}</div>
            </div>
          )}
        </div>

        {/* RESULTS SYSTEM: Toggle active visual views when evaluated */}
        {analysis && (
          <div id="results-wrapper" className="grid grid-cols-12 gap-6 items-start">
            
            {/* LEFT SIDEBAR CONTROLLER: Essential metrics and key information */}
            <div id="left-sidebar-metrics" className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              
              {/* METRIC MATCH SCORE */}
              <div id="match-score-card" className="bg-white rounded-xl border border-zinc-200 p-6 flex flex-col items-center justify-center shadow-sm shadow-zinc-100/50">
                <h3 className="text-zinc-400 uppercase text-xs font-bold tracking-widest mb-4">ATS Match Score</h3>
                
                {/* Visual Circle Gauge from mocking spec */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle 
                      cx="88" 
                      cy="88" 
                      r="76" 
                      stroke="currentColor" 
                      strokeWidth="10" 
                      fill="transparent" 
                      className="text-zinc-100" 
                    />
                    <circle 
                      cx="88" 
                      cy="88" 
                      r="76" 
                      stroke="currentColor" 
                      strokeWidth="10" 
                      fill="transparent" 
                      strokeDasharray={circumference} 
                      strokeDashoffset={strokeDashoffset} 
                      className="text-indigo-600 transition-all duration-700 ease-out" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-extrabold tracking-tight text-zinc-800">
                      {currentCalculatedScore}
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">Match</span>
                  </div>
                </div>

                {/* Score Projection Details */}
                <div id="score-projection-info" className="mt-4 w-full">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-zinc-500">Original Score:</span>
                    <span className="font-semibold text-zinc-700">{originalScore}%</span>
                  </div>
                  {currentCalculatedScore > originalScore && (
                    <div className="flex justify-between items-center text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      <span>Mock Improvements dynamic bonus:</span>
                      <span className="font-bold">+{currentCalculatedScore - originalScore}%</span>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-xs text-zinc-500 text-center leading-relaxed">
                  Your profile is highly competitive. Let's tackle your top missing gaps to bump this benchmark even higher.
                </p>
              </div>

              {/* CRITICAL SKILLS ALIGNMENT BAR */}
              <div id="critical-skills-card" className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm shadow-zinc-100/50">
                <h3 className="text-zinc-400 uppercase text-xs font-bold tracking-widest mb-4">Critical Skills</h3>
                
                <div className="space-y-4">
                  {/* Present Skills List */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-extrabold">
                      <span className="text-emerald-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        PRESENT SKILLS ({analysis.skillsPresent.length})
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100/80">
                      {analysis.skillsPresent.map((skill, si) => (
                        <span 
                          key={si}
                          className="px-2 py-1 bg-white text-emerald-800 text-[11px] font-medium rounded border border-emerald-200 shadow-xs flex items-center gap-1"
                        >
                          <span className="w-1 h-1 rounded-full bg-emerald-400" />
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing/Gap Skills List */}
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex justify-between text-xs font-extrabold">
                      <span className="text-rose-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        MISSING GAP SKILLS ({analysis.skillsMissing.length})
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-2 p-2 bg-rose-50/50 rounded-lg border border-rose-100/80">
                      {analysis.skillsMissing.map((skill, si) => (
                        <div 
                          key={si}
                          className="p-2 bg-white rounded border border-rose-100 text-xs shadow-xs"
                        >
                          <div className="flex items-center justify-between font-bold mb-1">
                            <span className="text-rose-900">{skill.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold ${
                              skill.priority === 'High' ? 'bg-red-100 text-red-700' :
                              skill.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-zinc-100 text-zinc-600'
                            }`}>
                              {skill.priority} priority
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-snug mb-1">{skill.reason}</p>
                          <div className="flex items-center justify-between text-[10px] mt-1.5 pt-1.5 border-t border-zinc-150">
                            <span className="text-zinc-400">Platform: {skill.recommendedResource.platform}</span>
                            <a 
                              href={skill.recommendedResource.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 font-bold"
                            >
                              View {skill.recommendedResource.type} <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* COGNITIVE REVERSIBLE SUMMARY COACH BANNER */}
              <div id="coach-advice-banner" className="bg-indigo-950 rounded-xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-48">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full translate-x-12 -translate-y-12 blur-xl"></div>
                <div className="z-10 mb-4">
                  <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold uppercase tracking-widest text-[10px]">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Executive Recommendation
                  </div>
                  <p className="text-indigo-100 text-xs leading-relaxed italic">
                    "{analysis.finalCareerAdvice}"
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-indigo-900 z-10 text-[11px]">
                  <div>
                    <div className="text-indigo-300 font-bold uppercase tracking-wider text-[9px]">TARGET ENDPOINT</div>
                    <div className="font-bold text-white text-[12px] truncate max-w-44">ApexGlobal Senior Eng</div>
                  </div>
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT WORKPLACE PORTALS: Dynamic tab routing of detailed content */}
            <div id="right-workplace-portals" className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              
              {/* MAIN ANALYSIS SCREEN */}
              {activeTab === 'analysis' && (
                <div id="tab-analysis" className="space-y-6">
                  
                  {/* RESUME IMPROVEMENTS LIST */}
                  <div id="advancement-items" className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-zinc-400 uppercase text-xs font-bold tracking-widest mb-1">Recommended Improvements</h3>
                      <p className="text-xs text-zinc-500">Apply these key content structure refinements to pass ATS screeners instantly. Toggle the checkbox to simulate score increases!</p>
                    </div>

                    <div className="space-y-4">
                      {analysis.recommendedImprovements.map((imp, idx) => (
                        <div 
                          key={idx}
                          className={`p-4 rounded-xl border transition ${
                            appliedImprovements[idx] 
                              ? 'bg-emerald-50 border-emerald-200' 
                              : 'bg-zinc-50 border-zinc-150 hover:bg-zinc-100/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button 
                              onClick={() => toggleImprovement(idx)}
                              className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition mt-0.5 ${
                                appliedImprovements[idx] 
                                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                                  : 'bg-white border-zinc-300 hover:border-indigo-500'
                              }`}
                            >
                              {appliedImprovements[idx] && <Check className="w-3.5 h-3.5" />}
                            </button>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
                                  {imp.category}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Projected Improvement 1-3%</span>
                              </div>
                              <h4 className="text-sm font-bold text-zinc-800 leading-snug">{imp.description}</h4>
                              <p className="text-xs text-zinc-500 mt-2 p-2 bg-white rounded border border-zinc-100 font-mono leading-relaxed">
                                <span className="text-indigo-600 font-bold block mb-1 uppercase tracking-wider text-[9px]">Suggested phrasing:</span>
                                {imp.actionStep}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* QUICK START TO ROADMAP LINK */}
                  <div id="roadmap-banner" className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-800 text-sm">We mapped out a custom {analysis.learningRoadmap.length}-step roadmap</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">Focuses on high-impact backend scaling and CI/CD pipelines missing from your background.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('roadmap')}
                      className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition inline-flex items-center gap-1 shrink-0 w-full md:w-auto justify-center cursor-pointer"
                    >
                      Explore Roadmap <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* MINI MOCK INTERVIEW STATS PREVIEW */}
                  <div id="mock-preview-container" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-zinc-400 uppercase text-xs font-bold tracking-widest mb-3">Mock Prep Hub</h3>
                        <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-100 text-xs leading-relaxed italic text-zinc-600">
                          "{analysis.mockQuestions[0]?.question || "How do you secure containerized microservices?"}"
                        </div>
                        <ul className="mt-4 space-y-2 text-xs text-zinc-600">
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                            Technical: docker and caching patterns
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                            Behavioral: leading database transitions
                          </li>
                        </ul>
                      </div>
                      <button 
                        onClick={() => setActiveTab('interview')}
                        className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition uppercase tracking-wider shadow-xs cursor-pointer"
                      >
                        Launch Mock Session
                      </button>
                    </div>

                    <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-zinc-400 uppercase text-xs font-bold tracking-widest mb-3">Coaching Advice Summary</h3>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Your frontend credentials are secure, but to command a $120k+ Senior Full-Stack role you must showcase mastery over deep system design & resilience testing under pressure.
                        </p>
                        <div className="mt-4 flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          <span className="text-[11px] font-bold text-indigo-800">Ask CareerPilot about any topic below</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('chat')}
                        className="w-full mt-4 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-800 font-bold rounded-lg text-xs transition uppercase tracking-wider shadow-xs cursor-pointer"
                      >
                        Open Coach Portal
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* ROADMAP PORTAL VIEW */}
              {activeTab === 'roadmap' && (
                <div id="tab-roadmap" className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
                  <div className="pb-4 border-b border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-zinc-800 text-lg font-bold font-display">Personalized Learning Roadmap</h3>
                      <p className="text-xs text-zinc-500 mt-1">Acquire high-impact backend & DevOps proficiencies systematically.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs">
                      <span className="text-zinc-500">Progress Tracker:</span>
                      <span className="font-extrabold text-indigo-600">
                        {Object.values(completedMilestones).filter(Boolean).length} / {analysis.learningRoadmap.length} Completed
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-100">
                    {analysis.learningRoadmap.map((milestone, mi) => (
                      <div 
                        key={milestone.id}
                        className={`flex gap-4 relative transition ${
                          completedMilestones[milestone.id] ? 'opacity-70' : ''
                        }`}
                      >
                        {/* Interactive Milestone Indicator */}
                        <button 
                          onClick={() => toggleMilestone(milestone.id)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10 transition duration-300 border-2 ${
                            completedMilestones[milestone.id] 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'bg-indigo-50 border-indigo-600 text-indigo-600 hover:bg-indigo-100'
                          }`}
                        >
                          {completedMilestones[milestone.id] ? (
                            <Check className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <span>0{mi+1}</span>
                          )}
                        </button>

                        <div className="flex-1 bg-zinc-50/50 rounded-xl border border-zinc-200/80 p-5 hover:bg-zinc-50 transition">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600">
                              {milestone.phase}
                            </span>
                            <span className="text-xs font-semibold text-zinc-400 bg-white px-2 py-0.5 rounded border border-zinc-200">
                              Duration: {milestone.duration}
                            </span>
                          </div>

                          <h4 className="font-bold text-zinc-800 text-base">{milestone.title}</h4>
                          
                          {/* Skills Targeted Badges */}
                          <div className="flex flex-wrap gap-1.5 my-3">
                            {milestone.skills.map((sk, idx) => (
                              <span key={idx} className="bg-white border border-zinc-200 text-zinc-600 text-[10px] px-2 py-0.5 rounded">
                                {sk}
                              </span>
                            ))}
                          </div>

                          {/* Action steps timeline */}
                          <div id="action-steps-timeline" className="mt-4 space-y-2">
                            <h5 className="text-[10px] uppercase text-zinc-400 font-extrabold tracking-wider">Action Steps & Exercises</h5>
                            <ul className="space-y-1.5">
                              {milestone.actionSteps.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-600">
                                  <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-4 pt-3 border-t border-zinc-150 flex justify-between items-center">
                            <button 
                              onClick={() => toggleMilestone(milestone.id)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              {completedMilestones[milestone.id] ? "Mark as in-progress" : "Mark phase as completed"}
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MOCK INTERVIEW PORTAL VIEW */}
              {activeTab === 'interview' && (
                <div id="tab-interview" className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-zinc-800 text-lg font-bold font-display">Target Mock Interview Mentor</h3>
                    <p className="text-xs text-zinc-500">Provide answers to tailored questions focusing on your gaps, and obtain instantaneous metric score feedback & phrasing recommendations.</p>
                  </div>

                  {/* Select interactive question */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pb-4 border-b border-zinc-100">
                    {analysis.mockQuestions.map((q, idx) => (
                      <button 
                        key={q.id}
                        onClick={() => {
                          setActiveQuestionIndex(idx);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold text-center transition border ${
                          activeQuestionIndex === idx 
                            ? 'bg-indigo-600 border-indigo-600 text-white font-bold' 
                            : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        Question 0{idx+1}
                      </button>
                    ))}
                  </div>

                  {/* Selected Question Details */}
                  {analysis.mockQuestions[activeQuestionIndex] && (
                    <div id="active-question-card" className="space-y-4">
                      
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                            {analysis.mockQuestions[activeQuestionIndex].type} Scenario
                          </span>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">CALIBRATED GAP COVERAGE</span>
                        </div>
                        <p className="text-zinc-800 font-bold text-sm md:text-base leading-relaxed">
                          "{analysis.mockQuestions[activeQuestionIndex].question}"
                        </p>
                      </div>

                      {/* Evaluated Score Card from Mocking Spec */}
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider">
                          Your Practice Response
                        </label>
                        <textarea
                          id="interview-textarea"
                          value={userAnswerInput}
                          onChange={(e) => setUserAnswerInput(e.target.value)}
                          placeholder="Type or dictate your response here (using the STAR method: Situation, Task, Action, Result is recommended)..."
                          className="w-full h-36 p-4 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none"
                        />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-400 font-medium">Use specific numbers/metrics where possible!</span>
                          <button 
                            id="submit-eval-btn"
                            disabled={!userAnswerInput.trim() || isGradingAnswer}
                            onClick={() => handleGradeAnswer(
                              analysis.mockQuestions[activeQuestionIndex].question,
                              analysis.mockQuestions[activeQuestionIndex].type
                            )}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg uppercase tracking-wider transition inline-flex items-center gap-2 cursor-pointer shadow-xs"
                          >
                            {isGradingAnswer ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating...
                              </>
                            ) : (
                              <>
                                <BrainCircuit className="w-4 h-4" /> Submit For Evaluation
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* GOLD MODEL HIGHLIGHT KEY */}
                      <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 mb-1.5">
                          <Info className="w-4 h-4 text-indigo-500" />
                          <span>Coaching Suggestion / Key Points to hit:</span>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed italic">
                          {analysis.mockQuestions[activeQuestionIndex].sampleAnswer}
                        </p>
                      </div>

                    </div>
                  )}

                  {/* RESPONSE AUDIT HISTORIC SCORING FEEDBACK */}
                  {interviewHistory.length > 0 && (
                    <div id="evaluation-scorecard" className="mt-8 pt-6 border-t border-zinc-100 space-y-4">
                      <h4 className="text-sm font-extrabold uppercase text-zinc-700 tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-500" /> Response Evaluation Audit ({interviewHistory.length})
                      </h4>

                      <div className="space-y-4">
                        {interviewHistory.map((item, index) => (
                          <div key={index} className="bg-zinc-50 rounded-xl border border-zinc-200 overflow-hidden">
                            <div className="bg-zinc-100/80 px-4 py-2.5 flex justify-between items-center border-b border-zinc-200">
                              <span className="text-xs font-bold text-zinc-700 truncate max-w-[70%]">
                                Q: {item.question}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                                <span>Score:</span>
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
                                  {item.score}/100
                                </span>
                              </div>
                            </div>
                            
                            <div className="p-4 space-y-3">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Candidate Answer</span>
                                <p className="text-xs text-zinc-600 italic bg-white p-2.5 rounded border border-zinc-100 leading-relaxed">
                                  "{item.answer}"
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider mb-1">Qualitative Coaching Review</span>
                                  <p className="text-xs text-zinc-600 leading-relaxed">
                                    {item.feedback}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-indigo-600 block tracking-wider mb-1">Stronger Phrasing Alternative</span>
                                  <p className="text-xs font-mono bg-indigo-50/50 p-2.5 rounded border border-indigo-100 text-indigo-900 leading-relaxed font-semibold">
                                    {item.strongerPhrasing}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* COACH CHAT PORTAL VIEW */}
              {activeTab === 'chat' && (
                <div id="tab-chat" className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col h-[650px]">
                  
                  <div className="pb-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-zinc-800 text-base font-bold font-display">Interactive Career Coach Chat</h3>
                        <p className="text-xs text-zinc-500">Practice custom questions, request code reviews, or ask how to represent credentials dynamically.</p>
                      </div>
                    </div>
                  </div>

                  {/* Messaging Body */}
                  <div id="chat-messages-container" className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                    {chatMessages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${
                          msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold shadow-xs ${
                          msg.sender === 'user' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-zinc-100 text-zinc-800'
                        }`}>
                          {msg.sender === 'user' ? 'U' : 'CP'}
                        </div>

                        <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                          msg.sender === 'user'
                            ? 'bg-indigo-600 text-white border-indigo-700'
                            : 'bg-zinc-50 text-zinc-800 border-zinc-200'
                        }`}>
                          <div className={`whitespace-pre-wrap font-medium`}>
                            {msg.text}
                          </div>
                          <span className={`block text-[9px] text-right ${
                            msg.sender === 'user' ? 'text-indigo-200' : 'text-zinc-400'
                          }`}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Quick Prompts helper tags */}
                  <div id="quick-prompts-wrapper" className="pt-2">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">Suggested Coaching Queries:</span>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleQuickPrompt("Write me an updated senior profile summary leveraging typescript microservices!")}
                        className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded text-[11px] text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      >
                        Refined Summary
                      </button>
                      <button 
                        onClick={() => handleQuickPrompt("How do I explain my lack of Docker containers production experience in a high-pressure interview?")}
                        className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded text-[11px] text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      >
                        Explain Docker Gap
                      </button>
                      <button 
                        onClick={() => handleQuickPrompt("Suggest 3 custom metrics I can integrate into my TechStyle Solutions work experience bullets.")}
                        className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded text-[11px] text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      >
                        Add Metrics
                      </button>
                    </div>
                  </div>

                  {/* Messaging Intake footer */}
                  <div id="chat-input-wrapper" className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-2">
                    <input 
                      id="chat-text-input"
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask your Coach any career query..."
                      disabled={isChatSending}
                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500 focus:outline-none"
                    />
                    <button 
                      id="send-message-btn"
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || isChatSending}
                      className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isChatSending ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* Styled Footer */}
      <footer id="global-footer" className="bg-white border-t border-zinc-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-zinc-600">CareerPilot AI</span>
            <span>- Your interactive expert career counselor.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Powered by Gemini 3.5 AI</span>
            <span>|</span>
            <span>Standard ATS Screener Calibrated</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
