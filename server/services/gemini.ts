import { GoogleGenAI } from "@google/genai";

// Reference: blueprint:javascript_gemini
// Using Gemini 2.5 models for AI-powered features
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || ""
});

export interface CvAnalysisResult {
  score: number;
  suggestions: string[];
  rewrittenVersion: string;
  improvements: string[];
}

export interface InterviewFeedback {
  score: number;
  feedback: string;
  improvedAnswer: string;
  strengths: string[];
  areasForImprovement: string[];
}

export interface CareerInsights {
  inDemandSkills: string[];
  averageSalaryUS: string;
  averageSalaryUK: string;
  averageSalaryRemote: string;
  topResources: Array<{ title: string; url: string; type: string }>;
  careerPath: string[];
}

export async function analyzeCv(cvText: string): Promise<CvAnalysisResult> {
  try {
    const systemPrompt = `You are a professional CV analyst. Analyze the CV and provide a comprehensive assessment including score (1-100), suggestions for improvement, and a rewritten version. Respond with JSON in this format: { 'score': number, 'suggestions': string[], 'rewrittenVersion': string, 'improvements': string[] }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "number" },
            suggestions: { type: "array", items: { type: "string" } },
            rewrittenVersion: { type: "string" },
            improvements: { type: "array", items: { type: "string" } }
          },
          required: ["score", "suggestions", "rewrittenVersion", "improvements"]
        }
      },
      contents: `Please analyze this CV and provide detailed feedback:\n\n${cvText}`
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    
    return {
      score: Math.max(1, Math.min(100, parsed.score)),
      suggestions: parsed.suggestions || [],
      rewrittenVersion: parsed.rewrittenVersion || "",
      improvements: parsed.improvements || [],
    };
  } catch (error) {
    throw new Error("Failed to analyze CV: " + (error as Error).message);
  }
}

export async function scoreInterviewAnswer(question: string, answer: string, jobRole: string): Promise<InterviewFeedback> {
  try {
    const systemPrompt = `You are an expert interview coach. Analyze the candidate's answer and provide constructive feedback including a score (1-10), detailed feedback, an improved version of the answer, strengths, and areas for improvement. Respond with JSON in this format: { 'score': number, 'feedback': string, 'improvedAnswer': string, 'strengths': string[], 'areasForImprovement': string[] }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "number" },
            feedback: { type: "string" },
            improvedAnswer: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            areasForImprovement: { type: "array", items: { type: "string" } }
          },
          required: ["score", "feedback", "improvedAnswer", "strengths", "areasForImprovement"]
        }
      },
      contents: `Job Role: ${jobRole}\nQuestion: ${question}\nCandidate's Answer: ${answer}\n\nPlease provide comprehensive feedback on this interview response.`
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    
    return {
      score: Math.max(1, Math.min(10, parsed.score)),
      feedback: parsed.feedback || "",
      improvedAnswer: parsed.improvedAnswer || "",
      strengths: parsed.strengths || [],
      areasForImprovement: parsed.areasForImprovement || [],
    };
  } catch (error) {
    throw new Error("Failed to score interview answer: " + (error as Error).message);
  }
}

// Fallback career data when Gemini API is not available
const fallbackCareerData: Record<string, CareerInsights> = {
  "Frontend Developer": {
    inDemandSkills: ["React", "TypeScript", "JavaScript", "CSS", "HTML", "Next.js", "Vue.js"],
    averageSalaryUS: "$75,000 - $120,000",
    averageSalaryUK: "£45,000 - £75,000",
    averageSalaryRemote: "$70,000 - $110,000",
    topResources: [
      { title: "React Documentation", url: "https://react.dev", type: "Documentation" },
      { title: "MDN Web Docs", url: "https://developer.mozilla.org", type: "Documentation" },
      { title: "Frontend Masters", url: "https://frontendmasters.com", type: "Course" }
    ],
    careerPath: ["Junior Frontend Developer", "Frontend Developer", "Senior Frontend Developer", "Lead Frontend Developer", "Frontend Architecture"]
  },
  "Backend Developer": {
    inDemandSkills: ["Node.js", "Python", "Java", "SQL", "API Design", "Docker", "AWS"],
    averageSalaryUS: "$80,000 - $130,000",
    averageSalaryUK: "£50,000 - £80,000", 
    averageSalaryRemote: "$75,000 - $125,000",
    topResources: [
      { title: "Node.js Documentation", url: "https://nodejs.org/docs", type: "Documentation" },
      { title: "AWS Training", url: "https://aws.amazon.com/training", type: "Course" },
      { title: "System Design Interview", url: "https://github.com/donnemartin/system-design-primer", type: "Resource" }
    ],
    careerPath: ["Junior Backend Developer", "Backend Developer", "Senior Backend Developer", "Lead Backend Developer", "Backend Architecture"]
  },
  "Full Stack Developer": {
    inDemandSkills: ["React", "Node.js", "TypeScript", "SQL", "MongoDB", "Docker", "Git"],
    averageSalaryUS: "$85,000 - $140,000",
    averageSalaryUK: "£55,000 - £85,000",
    averageSalaryRemote: "$80,000 - $135,000",
    topResources: [
      { title: "Full Stack Open", url: "https://fullstackopen.com", type: "Course" },
      { title: "The Odin Project", url: "https://theodinproject.com", type: "Course" },
      { title: "freeCodeCamp", url: "https://freecodecamp.org", type: "Course" }
    ],
    careerPath: ["Junior Full Stack Developer", "Full Stack Developer", "Senior Full Stack Developer", "Lead Developer", "Technical Lead"]
  },
  "Data Scientist": {
    inDemandSkills: ["Python", "R", "SQL", "Machine Learning", "Statistics", "Pandas", "TensorFlow"],
    averageSalaryUS: "$95,000 - $160,000",
    averageSalaryUK: "£60,000 - £95,000",
    averageSalaryRemote: "$90,000 - $150,000",
    topResources: [
      { title: "Kaggle Learn", url: "https://kaggle.com/learn", type: "Course" },
      { title: "Coursera Data Science", url: "https://coursera.org/specializations/jhu-data-science", type: "Course" },
      { title: "Python for Data Science", url: "https://python.org", type: "Documentation" }
    ],
    careerPath: ["Junior Data Analyst", "Data Analyst", "Data Scientist", "Senior Data Scientist", "Principal Data Scientist"]
  }
};

export async function getCareerInsights(jobRole: string): Promise<CareerInsights> {
  try {
    const systemPrompt = `You are a career advisor with extensive knowledge of tech industry trends, salaries, and skill requirements. Provide comprehensive career insights for the specified role. Respond with JSON in this format: { 'inDemandSkills': string[], 'averageSalaryUS': string, 'averageSalaryUK': string, 'averageSalaryRemote': string, 'topResources': [{'title': string, 'url': string, 'type': string}], 'careerPath': string[] }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            inDemandSkills: { type: "array", items: { type: "string" } },
            averageSalaryUS: { type: "string" },
            averageSalaryUK: { type: "string" },
            averageSalaryRemote: { type: "string" },
            topResources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  type: { type: "string" }
                },
                required: ["title", "url", "type"]
              }
            },
            careerPath: { type: "array", items: { type: "string" } }
          },
          required: ["inDemandSkills", "averageSalaryUS", "averageSalaryUK", "averageSalaryRemote", "topResources", "careerPath"]
        }
      },
      contents: `Please provide detailed career insights for: ${jobRole}. Include current market data, in-demand skills, salary ranges, learning resources, and typical career progression paths.`
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    
    return {
      inDemandSkills: parsed.inDemandSkills || [],
      averageSalaryUS: parsed.averageSalaryUS || "Data not available",
      averageSalaryUK: parsed.averageSalaryUK || "Data not available", 
      averageSalaryRemote: parsed.averageSalaryRemote || "Data not available",
      topResources: parsed.topResources || [],
      careerPath: parsed.careerPath || [],
    };
  } catch (error) {
    console.log("Gemini API unavailable, using fallback data for", jobRole);
    
    // Use fallback data when Gemini API is not available
    const fallbackData = fallbackCareerData[jobRole];
    
    if (fallbackData) {
      return fallbackData;
    }
    
    // Generic fallback for unknown roles
    return {
      inDemandSkills: ["Communication", "Problem Solving", "Critical Thinking", "Technical Skills"],
      averageSalaryUS: "Data not available - API key needed",
      averageSalaryUK: "Data not available - API key needed",
      averageSalaryRemote: "Data not available - API key needed",
      topResources: [
        { title: "LinkedIn Learning", url: "https://linkedin.com/learning", type: "Course" },
        { title: "Coursera", url: "https://coursera.org", type: "Course" },
        { title: "Udemy", url: "https://udemy.com", type: "Course" }
      ],
      careerPath: ["Entry Level", "Mid Level", "Senior Level", "Leadership Level"]
    };
  }
}

export const trendingJobRoles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Product Manager",
  "UX Designer",
  "Software Architect",
  "Mobile Developer",
  "Cloud Engineer",
  "Cybersecurity Specialist",
  "AI Engineer",
  "Data Engineer",
  "QA Engineer"
];
