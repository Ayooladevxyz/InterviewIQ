import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || ""
});

export interface Course {
  title: string;
  provider: string; // "Coursera", "Udemy", "LinkedIn Learning", etc.
  description: string;
  url: string;
  price: string;
  rating: number;
  level: string; // "Beginner", "Intermediate", "Advanced"
  duration: string;
}

export interface CourseRecommendations {
  recommendations: Course[];
  totalCourses: number;
  topSkills: string[];
  estimatedLearningTime: string;
}

// Cache for course recommendations (24 hour TTL)
const courseCache = new Map<string, { data: CourseRecommendations; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get course recommendations based on skills and role
 * Uses Gemini AI to generate realistic course suggestions from major platforms
 */
export async function getCourseRecommendations(
  skills: string[],
  jobRole: string,
  userLevel: string = "intermediate"
): Promise<CourseRecommendations> {
  const cacheKey = `${jobRole}_${skills.join(",")}_${userLevel}`;
  
  // Check cache first
  const cached = courseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const systemPrompt = `You are an expert course advisor with deep knowledge of online learning platforms like Coursera, Udemy, LinkedIn Learning, Pluralsight, and edX. Generate realistic course recommendations that would actually exist on these platforms. Include accurate pricing, ratings, and course details. Respond with JSON matching this exact format: { 'recommendations': [{'title': string, 'provider': string, 'description': string, 'url': string, 'price': string, 'rating': number, 'level': string, 'duration': string}], 'totalCourses': number, 'topSkills': string[], 'estimatedLearningTime': string }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  provider: { type: "string" },
                  description: { type: "string" },
                  url: { type: "string" },
                  price: { type: "string" },
                  rating: { type: "number" },
                  level: { type: "string" },
                  duration: { type: "string" }
                },
                required: ["title", "provider", "description", "url", "price", "rating", "level", "duration"]
              }
            },
            totalCourses: { type: "number" },
            topSkills: { type: "array", items: { type: "string" } },
            estimatedLearningTime: { type: "string" }
          },
          required: ["recommendations", "totalCourses", "topSkills", "estimatedLearningTime"]
        }
      },
      contents: `Generate 8-10 course recommendations for a ${userLevel} ${jobRole} who wants to improve these skills: ${skills.join(", ")}. Include courses from Coursera, Udemy, LinkedIn Learning, and other major platforms. Provide realistic course titles, accurate descriptions, typical pricing, realistic ratings (4.0-5.0), difficulty levels, and estimated durations. For URLs, use the actual platform domains (coursera.org, udemy.com, etc.) with descriptive paths.`
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    
    const result: CourseRecommendations = {
      recommendations: parsed.recommendations || [],
      totalCourses: parsed.totalCourses || parsed.recommendations?.length || 0,
      topSkills: parsed.topSkills || skills,
      estimatedLearningTime: parsed.estimatedLearningTime || "8-12 weeks"
    };

    // Cache the result
    courseCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    console.error("Failed to get course recommendations:", error);
    
    // Return fallback recommendations
    return getFallbackCourses(skills, jobRole, userLevel);
  }
}

/**
 * Get course recommendations based on CV analysis
 */
export async function getCoursesFromCvAnalysis(
  cvText: string,
  suggestions: string[],
  jobRole?: string
): Promise<CourseRecommendations> {
  try {
    const systemPrompt = `You are an expert course advisor. Analyze the CV and improvement suggestions to recommend specific courses that will help this person grow professionally. Focus on skill gaps and career advancement. Respond with JSON matching this format: { 'recommendations': [{'title': string, 'provider': string, 'description': string, 'url': string, 'price': string, 'rating': number, 'level': string, 'duration': string}], 'totalCourses': number, 'topSkills': string[], 'estimatedLearningTime': string }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  provider: { type: "string" },
                  description: { type: "string" },
                  url: { type: "string" },
                  price: { type: "string" },
                  rating: { type: "number" },
                  level: { type: "string" },
                  duration: { type: "string" }
                },
                required: ["title", "provider", "description", "url", "price", "rating", "level", "duration"]
              }
            },
            totalCourses: { type: "number" },
            topSkills: { type: "array", items: { type: "string" } },
            estimatedLearningTime: { type: "string" }
          },
          required: ["recommendations", "totalCourses", "topSkills", "estimatedLearningTime"]
        }
      },
      contents: `Based on this CV analysis:\n\nCV Summary: ${cvText.substring(0, 500)}...\n\nImprovement Suggestions:\n${suggestions.join("\n")}\n\n${jobRole ? `Target Role: ${jobRole}\n\n` : ""}Generate 6-8 targeted course recommendations from platforms like Coursera, Udemy, LinkedIn Learning that directly address these skill gaps. Include realistic pricing, ratings, and course details.`
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    
    return {
      recommendations: parsed.recommendations || [],
      totalCourses: parsed.totalCourses || parsed.recommendations?.length || 0,
      topSkills: parsed.topSkills || [],
      estimatedLearningTime: parsed.estimatedLearningTime || "6-10 weeks"
    };
  } catch (error) {
    console.error("Failed to get courses from CV analysis:", error);
    return getFallbackCourses([], jobRole || "Professional", "intermediate");
  }
}

/**
 * Fallback course data when API is unavailable
 */
function getFallbackCourses(skills: string[], jobRole: string, level: string): CourseRecommendations {
  const fallbackCourses: Course[] = [
    {
      title: "Complete Web Development Bootcamp",
      provider: "Udemy",
      description: "Master modern web development from basics to advanced concepts",
      url: "https://udemy.com/course/web-development-bootcamp",
      price: "$89.99",
      rating: 4.7,
      level: "Beginner",
      duration: "65 hours"
    },
    {
      title: "JavaScript Algorithms and Data Structures",
      provider: "freeCodeCamp",
      description: "Learn fundamental programming concepts and algorithms",
      url: "https://freecodecamp.org/learn",
      price: "Free",
      rating: 4.8,
      level: "Intermediate",
      duration: "300 hours"
    },
    {
      title: "React - The Complete Guide",
      provider: "Udemy",
      description: "Dive deep into React including Hooks, Redux, and Next.js",
      url: "https://udemy.com/course/react-the-complete-guide",
      price: "$94.99",
      rating: 4.6,
      level: "Intermediate",
      duration: "48 hours"
    },
    {
      title: "Full Stack Web Development Specialization",
      provider: "Coursera",
      description: "Build complete web applications from front to back",
      url: "https://coursera.org/specializations/full-stack",
      price: "$49/month",
      rating: 4.7,
      level: "Intermediate",
      duration: "6 months"
    },
    {
      title: "System Design Interview Prep",
      provider: "Educative",
      description: "Master system design concepts for technical interviews",
      url: "https://educative.io/courses/system-design-interview",
      price: "$79",
      rating: 4.5,
      level: "Advanced",
      duration: "20 hours"
    }
  ];

  return {
    recommendations: fallbackCourses,
    totalCourses: fallbackCourses.length,
    topSkills: skills.length > 0 ? skills : ["Programming", "Web Development", "Problem Solving"],
    estimatedLearningTime: "8-12 weeks"
  };
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of Array.from(courseCache.entries())) {
    if (now - value.timestamp >= CACHE_TTL) {
      courseCache.delete(key);
    }
  }
}

// Clear cache every 6 hours
setInterval(clearExpiredCache, 6 * 60 * 60 * 1000);
