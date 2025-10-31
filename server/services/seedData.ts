import { storage } from "../storage";
import { hashPassword } from "../auth";
import { nanoid } from "nanoid";

/**
 * Seed sample data for demo mode
 * 
 * This service creates demo accounts with realistic data for testing
 * IMPORTANT: Only available in development mode, blocked in production
 */

export interface SeedResult {
  success: boolean;
  message: string;
  data?: {
    users: number;
    cvAnalyses: number;
    mockInterviews: number;
  };
  error?: string;
}

/**
 * Generate a unique demo username to avoid conflicts
 */
function generateDemoUsername(): string {
  return `demo_${nanoid(8)}`;
}

/**
 * Seed sample users with demo data
 * 
 * Creates demo accounts with:
 * - Sample CV analyses
 * - Sample mock interviews
 * - User progress tracking
 */
export async function seedSampleData(count: number = 1): Promise<SeedResult> {
  try {
    const env = process.env.NODE_ENV || 'development';

    // PRODUCTION GUARD: Never allow seeding in production
    if (env === 'production') {
      return {
        success: false,
        message: 'Seed operation blocked in production',
        error: 'PRODUCTION_SEED_DISABLED'
      };
    }

    console.log(`[SeedData] Seeding ${count} demo user(s)...`);

    const createdUsers: number[] = [];
    const createdCvAnalyses: number[] = [];
    const createdInterviews: number[] = [];

    for (let i = 0; i < count; i++) {
      // Create demo user
      const username = generateDemoUsername();
      const user = await storage.createUser({
        username,
        email: `${username}@demo.interviewiq.local`,
        password: await hashPassword('Demo1234!'),
        fullName: `Demo User ${i + 1}`,
      });

      createdUsers.push(user.id);
      console.log(`[SeedData] Created demo user: ${username} (ID: ${user.id})`);

      // Create sample CV analysis
      const cvAnalysis = await storage.createCvAnalysis({
        userId: user.id,
        filename: `demo_cv_${nanoid(6)}.pdf`,
        originalText: `DEMO CV\n\nName: Demo User ${i + 1}\nEmail: ${username}@demo.interviewiq.local\n\nExperience:\n- Software Developer at Demo Company (2020-2023)\n- Junior Developer at Sample Corp (2018-2020)\n\nSkills: JavaScript, TypeScript, React, Node.js, SQL`,
        score: 75 + Math.floor(Math.random() * 20), // 75-94
        suggestions: [
          "Add quantifiable achievements with metrics",
          "Include specific technologies and frameworks",
          "Highlight leadership and collaboration skills",
          "Add certifications and education details"
        ],
        rewrittenVersion: null
      });

      createdCvAnalyses.push(cvAnalysis.id);
      console.log(`[SeedData] Created CV analysis for user ${user.id}`);

      // Create sample mock interviews
      const jobRoles = ["Frontend Developer", "Backend Developer", "Full Stack Developer"];
      const questions = [
        "Tell me about a challenging project you worked on",
        "How do you handle tight deadlines?",
        "Explain your approach to code reviews"
      ];

      for (let j = 0; j < 2; j++) {
        const interview = await storage.createMockInterview({
          userId: user.id,
          jobRole: jobRoles[Math.floor(Math.random() * jobRoles.length)],
          question: questions[j],
          answer: `This is a demo answer for the interview question. The user provided a thoughtful response discussing their experience and approach.`,
          score: 70 + Math.floor(Math.random() * 25), // 70-94
          feedback: "Good answer overall. Consider adding more specific examples and quantifying your impact.",
          improvedAnswer: null,
        });

        createdInterviews.push(interview.id);
      }

      console.log(`[SeedData] Created ${2} mock interviews for user ${user.id}`);

      // Update user progress
      const interviews = await storage.getMockInterviewsByUserId(user.id);
      const avgScore = interviews.reduce((sum, i) => sum + i.score, 0) / interviews.length;

      await storage.updateUserProgress(user.id, {
        cvScore: cvAnalysis.score,
        interviewCount: interviews.length,
        averageScore: Math.round(avgScore), // Round to nearest integer
        dayStreak: Math.floor(Math.random() * 7), // 0-6 days
        lastActivityDate: new Date(),
      });

      console.log(`[SeedData] Updated progress for user ${user.id}`);
    }

    const result: SeedResult = {
      success: true,
      message: `Successfully seeded ${count} demo user(s) with sample data`,
      data: {
        users: createdUsers.length,
        cvAnalyses: createdCvAnalyses.length,
        mockInterviews: createdInterviews.length,
      }
    };

    console.log('[SeedData] Seed operation completed successfully', result.data);
    return result;

  } catch (error) {
    console.error('[SeedData] Seed operation failed:', error);
    return {
      success: false,
      message: 'Seed operation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clear all demo data (users with demo_ prefix)
 * 
 * CAUTION: This permanently deletes demo users and their associated data
 */
export async function clearDemoData(): Promise<SeedResult> {
  try {
    const env = process.env.NODE_ENV || 'development';

    // PRODUCTION GUARD: Never allow clearing in production
    if (env === 'production') {
      return {
        success: false,
        message: 'Clear operation blocked in production',
        error: 'PRODUCTION_CLEAR_DISABLED'
      };
    }

    console.log('[SeedData] Clear demo data is not yet implemented - requires database query capabilities');
    
    return {
      success: false,
      message: 'Clear demo data feature not yet implemented',
      error: 'NOT_IMPLEMENTED'
    };

  } catch (error) {
    console.error('[SeedData] Clear operation failed:', error);
    return {
      success: false,
      message: 'Clear operation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
