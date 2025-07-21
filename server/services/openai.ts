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

export async function getCareerInsights(jobRole: string): Promise<CareerInsights> {
  try {
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
    throw new Error("Failed to get career insights: " + (error as Error).message);
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
