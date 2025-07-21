import OpenAI from "openai";
import fs from "fs";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional CV analyst. Analyze the CV and provide a comprehensive assessment including score (1-100), suggestions for improvement, and a rewritten version. Respond with JSON in this format: { 'score': number, 'suggestions': string[], 'rewrittenVersion': string, 'improvements': string[] }",
        },
        {
          role: "user",
          content: `Please analyze this CV and provide detailed feedback:\n\n${cvText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    return {
      score: Math.max(1, Math.min(100, result.score)),
      suggestions: result.suggestions || [],
      rewrittenVersion: result.rewrittenVersion || "",
      improvements: result.improvements || [],
    };
  } catch (error) {
    throw new Error("Failed to analyze CV: " + (error as Error).message);
  }
}

export async function transcribeAudio(audioFilePath: string): Promise<{ text: string; duration: number }> {
  try {
    const audioReadStream = fs.createReadStream(audioFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });

    return {
      text: transcription.text,
      duration: 0, // Duration not available in current API version
    };
  } catch (error) {
    throw new Error("Failed to transcribe audio: " + (error as Error).message);
  }
}

export async function scoreInterviewAnswer(question: string, answer: string, jobRole: string): Promise<InterviewFeedback> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert interview coach. Analyze the candidate's answer and provide constructive feedback including a score (1-10), detailed feedback, an improved version of the answer, strengths, and areas for improvement. Respond with JSON in this format: { 'score': number, 'feedback': string, 'improvedAnswer': string, 'strengths': string[], 'areasForImprovement': string[] }",
        },
        {
          role: "user",
          content: `Job Role: ${jobRole}\nQuestion: ${question}\nCandidate's Answer: ${answer}\n\nPlease provide comprehensive feedback on this interview response.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    return {
      score: Math.max(1, Math.min(10, result.score)),
      feedback: result.feedback || "",
      improvedAnswer: result.improvedAnswer || "",
      strengths: result.strengths || [],
      areasForImprovement: result.areasForImprovement || [],
    };
  } catch (error) {
    throw new Error("Failed to score interview answer: " + (error as Error).message);
  }
}

// Fallback career data when OpenAI API is not available
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
    // First try OpenAI API if key is valid
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a career advisor with extensive knowledge of tech industry trends, salaries, and skill requirements. Provide comprehensive career insights for the specified role. Respond with JSON in this format: { 'inDemandSkills': string[], 'averageSalaryUS': string, 'averageSalaryUK': string, 'averageSalaryRemote': string, 'topResources': [{'title': string, 'url': string, 'type': string}], 'careerPath': string[] }",
        },
        {
          role: "user",
          content: `Please provide detailed career insights for: ${jobRole}. Include current market data, in-demand skills, salary ranges, learning resources, and typical career progression paths.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    return {
      inDemandSkills: result.inDemandSkills || [],
      averageSalaryUS: result.averageSalaryUS || "Data not available",
      averageSalaryUK: result.averageSalaryUK || "Data not available", 
      averageSalaryRemote: result.averageSalaryRemote || "Data not available",
      topResources: result.topResources || [],
      careerPath: result.careerPath || [],
    };
  } catch (error) {
    console.log("OpenAI API unavailable, using fallback data for", jobRole);
    
    // Use fallback data when OpenAI API is not available
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
