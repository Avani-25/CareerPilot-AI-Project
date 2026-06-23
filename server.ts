import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Force JSON parsing support
app.use(express.json({ limit: "15mb" }));

// Lazy safety initializer for Google AI
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in your Secrets settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Health API
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    time: new Date().toISOString(),
  });
});

// 2. Resume & Job Description Analyzer endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { resumeText, jobDescriptionText } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: "Resume text is required." });
    }
    if (!jobDescriptionText) {
      return res.status(400).json({ error: "Job description text is required." });
    }

    const ai = getAI();

    const systemInstruction = `You are CareerPilot AI, an expert career coach and interview mentor.
Your responsibilities:
- Analyze the user's uploaded Resume.
- Analyze the provided Job Description.
- Compare both documents carefully and objectively.
- Generate an ATS matching score from 0-100 indicating compatibility.
- Identify present skills and distinct missing skills.
- Recommend high-impact improvement points for the resume with explanations.
- Create a personalized, visual, phase-by-phase learning roadmap with action items and recommended resources.
- Draft 5 highly customizable mock interview questions (divided into Technical, Behavioral, and Scenario types) curated for this specific gap.
- Formulate supportive final career advice.

In your analysis:
- Prioritize high-impact skills.
- Explain your coaching reasoning clearly.
- Give highly actionable next steps.
- Maintain a highly professional, encouraging, and supportive coaching tone.`;

    const prompt = `Please analyze this Resume and comparison Job Description.
--- RESUME ---
${resumeText}

--- JOB DESCRIPTION ---
${jobDescriptionText}

Return your responses STRICTLY in the requested structured JSON form. Do not include markdown wraps besides the JSON object.`;

    // Define response schema to prevent unstructured format issues
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Lower temperature for more consistent structural scoring
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: {
              type: Type.INTEGER,
              description: "ATS compatibility match score from 0 to 100 based on core qualifications.",
            },
            skillsPresent: {
              type: Type.ARRAY,
              description: "Technical or soft skills found in the resume that correspond in some way.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the skill, e.g. React, Project Management" },
                  category: { type: Type.STRING, description: "Domain, e.g. Frontend, Agile, Language" },
                },
                required: ["name", "category"],
              },
            },
            skillsMissing: {
              type: Type.ARRAY,
              description: "Skills mentioned in the job description but absent or highly weak in the resume.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of missing skill" },
                  priority: { type: Type.STRING, description: "Must be High, Medium, or Low" },
                  reason: { type: Type.STRING, description: "Explain why this skill is vital for this role." },
                  recommendedResource: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: "Specific resource name, paper, course or project" },
                      type: { type: Type.STRING, description: "Must be Course, Book, Project, or Documentation" },
                      platform: { type: Type.STRING, description: "Coursera, Udemy, GitHub, MDN Web Docs, etc." },
                      url: { type: Type.STRING, description: "Valid documentation or resource reference URL" },
                    },
                    required: ["title", "type", "platform", "url"],
                  },
                },
                required: ["name", "priority", "reason", "recommendedResource"],
              },
            },
            recommendedImprovements: {
              type: Type.ARRAY,
              description: "Actionable enhancements specifically to polish the resume, e.g., metric addition, layout, summary tweaking.",
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "E.g., Formatting, Metrics, Project Explanations" },
                  description: { type: Type.STRING, description: "Elaboration on why this change is suggested." },
                  actionStep: { type: Type.STRING, description: "Step-by-step guideline on what to write instead." },
                },
                required: ["category", "description", "actionStep"],
              },
            },
            learningRoadmap: {
              type: Type.ARRAY,
              description: "Timeline/Phase based path outlining exactly how they should acquire the High prioritized missing skills.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique identifier, e.g., milestone-1" },
                  phase: { type: Type.STRING, description: "E.g., Phase 1: Core Fundamentals, Phase 2: Building Projects" },
                  title: { type: Type.STRING, description: "Action goal title" },
                  duration: { type: Type.STRING, description: "Duration estimate, e.g., Week 1-2, 5 days" },
                  skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of skills focused on in this milestone." },
                  actionSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific steps to take." },
                },
                required: ["id", "phase", "title", "duration", "skills", "actionSteps"],
              },
            },
            mockQuestions: {
              type: Type.ARRAY,
              description: "5 highly relevant standard mock interview questions tailored for the gap.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique question ID, e.g., q-1" },
                  question: { type: Type.STRING, description: "Full prompt of the interview question" },
                  type: { type: Type.STRING, description: "Must be Technical, Behavioral, or Scenario" },
                  sampleAnswer: { type: Type.STRING, description: "Points to highlight or a gold standard model answer" },
                },
                required: ["id", "question", "type", "sampleAnswer"],
              },
            },
            finalCareerAdvice: {
              type: Type.STRING,
              description: "A summary message of supportive, actionable, encouraging career advice representing top coach standards.",
            },
          },
          required: [
            "matchScore",
            "skillsPresent",
            "skillsMissing",
            "recommendedImprovements",
            "learningRoadmap",
            "mockQuestions",
            "finalCareerAdvice",
          ],
        },
      },
    });

    const outputText = response.text || "{}";
    const parsedData = JSON.parse(outputText.trim());
    res.json(parsedData);
  } catch (err: any) {
    console.error("Analysis API error:", err);
    res.status(500).json({ error: err.message || "An error occurred during resume analysis." });
  }
});

// 3. Interview Question grader and feedback API
app.post("/api/interview/feedback", async (req, res) => {
  try {
    const { question, userResponse, type } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }
    if (!userResponse) {
      return res.status(400).json({ error: "User response is required." });
    }

    const ai = getAI();

    const systemInstruction = `You are CareerPilot AI, an expert interview mentor. Evaluates mock interview answers with real, constructive, supportive, and professional coaching standards.
Judge on clarity, depth, applicability, correctness, and structure (STAR method for behavioral questions).`;

    const prompt = `Evaluate the candidate's answer to the mock interview question below.
Question: "${question}"
Question Type: "${type || "Behavioral"}"
Candidate Answer: "${userResponse}"

Analyze the candidate's response. Return your audit strictly in a JSON object with:
- score: An integer score from 0 to 100
- feedback: Supportive, detailed critique. Point out what was excellent, and exactly how they can improve. Give actionable advice.
- strongerPhrasing: Provide 1-2 key sentences or bullet points of better terminology or structured phrases they should utilize.

Return only the valid JSON. No backticks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            strongerPhrasing: { type: Type.STRING },
          },
          required: ["score", "feedback", "strongerPhrasing"],
        },
      },
    });

    const parsedData = JSON.parse((response.text || "{}").trim());
    res.json(parsedData);
  } catch (err: any) {
    console.error("Interview grading error:", err);
    res.status(500).json({ error: err.message || "Failed to analyze interview turn." });
  }
});

// 4. Interactive custom coaching Career Chat (maintains context)
app.post("/api/chat", async (req, res) => {
  try {
    const { chatHistory, userMessage, resumeText, jobDescriptionText } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: "User message is required." });
    }

    const ai = getAI();

    const systemInstruction = `You are CareerPilot AI, an expert career coach and mentoring strategist.
You are chatting with a candidate. Respond in a helpful, warm, professional, and coaching-oriented style.
Your knowledge of the candidate's background and potential is enriched by their resume and current targeted job.

Keep the resume and job context in mind to answer queries, suggest strategies, refine answers, explain skills, or guide interview prep:
- Target Resume: ${resumeText || "Not provided yet"}
- Target Job Description: ${jobDescriptionText || "Not provided yet"}

Provide responses in standard markdown (without using extra metadata). Keep responses concise, direct, professional, and supportive. Use lists and bold tags where relevant to highlight high-impact suggestions and actionable next steps!`;

    // Package chat history into contents array formatted for chat if available or pass as raw history
    // We will build a structured content array for generateContent
    const contents: any[] = [];
    
    // Add context and instruction in prompt or directly. Let's add standard history
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach((msg: any) => {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      });
    }

    // Append the active message
    contents.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ response: response.text || "I am here to support you! Tell me more about your experience." });
  } catch (err: any) {
    console.error("Chat coaching error:", err);
    res.status(500).json({ error: err.message || "Failed to obtain chat response." });
  }
});

// 5. Setup Vite dev middle or production build static delivery
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static assets.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CareerPilot AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
