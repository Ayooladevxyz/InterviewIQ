import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { upload, parseDocument, cleanupFile } from "./services/fileUpload";
import { analyzeCv, scoreInterviewAnswer, getCareerInsights, trendingJobRoles, generateInterviewQuestions } from "./services/gemini";
import { getCourseRecommendations, getCoursesFromCvAnalysis } from "./services/courseRecommendations";
import { generateFeedbackReport } from "./services/pdfGenerator";
import { insertCvAnalysisSchema, insertMockInterviewSchema, UserProgress } from "@shared/schema";
import { requireAdminAuth, getAdminToken } from "./services/adminAuth";
import { seedSampleData } from "./services/seedData";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to ensure user is authenticated for protected routes
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // CV Upload & Parsing
  app.post("/api/upload-cv", requireAuth, upload.single("cv"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = req.file.path;
      const filename = req.file.originalname;
      const mimeType = req.file.mimetype;

      // Parse the document
      const parsedText = await parseDocument(filePath, mimeType);
      
      // Analyze with Gemini
      const analysis = await analyzeCv(parsedText);

      // Save to storage
      const cvAnalysis = await storage.createCvAnalysis({
        userId: req.user.id,
        filename,
        originalText: parsedText,
        score: analysis.score,
        suggestions: analysis.suggestions,
        rewrittenVersion: analysis.rewrittenVersion,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        nextSteps: analysis.nextSteps,
        careerTrajectory: analysis.careerTrajectory,
        salaryInsights: analysis.salaryInsights,
        extractedSkills: analysis.extractedSkills,
        detectedJobRole: analysis.detectedJobRole,
      });

      // Update user progress
      const currentProgress = await storage.getUserProgress(req.user.id);
      await storage.updateUserProgress(req.user.id, {
        cvScore: analysis.score,
        lastActivityDate: new Date(),
      });

      // Cleanup uploaded file
      cleanupFile(filePath);

      res.json({
        id: cvAnalysis.id,
        score: analysis.score,
        suggestions: analysis.suggestions,
        rewrittenVersion: analysis.rewrittenVersion,
        improvements: analysis.improvements,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        nextSteps: analysis.nextSteps,
        careerTrajectory: analysis.careerTrajectory,
        salaryInsights: analysis.salaryInsights,
        extractedSkills: analysis.extractedSkills,
        detectedJobRole: analysis.detectedJobRole,
      });
    } catch (error) {
      if (req.file) {
        cleanupFile(req.file.path);
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Interview Q&A Scoring (text-based only - audio transcription not available with Gemini)
  app.post("/api/submit-answer", requireAuth, async (req: any, res) => {
    try {
      const { question, answer, jobRole } = req.body;
      
      if (!question || !answer || !jobRole) {
        return res.status(400).json({ message: "Question, answer, and job role are required" });
      }

      // Score the answer
      const feedback = await scoreInterviewAnswer(question, answer, jobRole);

      // Save to storage
      const mockInterview = await storage.createMockInterview({
        userId: req.user.id,
        jobRole,
        question,
        answer,
        score: feedback.score,
        feedback: feedback.feedback,
        improvedAnswer: feedback.improvedAnswer,
      });

      // Update user progress
      const interviews = await storage.getMockInterviewsByUserId(req.user.id);
      const averageScore = interviews.reduce((sum, i) => sum + i.score, 0) / interviews.length;

      await storage.updateUserProgress(req.user.id, {
        interviewCount: interviews.length,
        averageScore: Math.round(averageScore), // Round to nearest integer
        lastActivityDate: new Date(),
      });

      res.json({
        id: mockInterview.id,
        score: feedback.score,
        feedback: feedback.feedback,
        improvedAnswer: feedback.improvedAnswer,
        strengths: feedback.strengths,
        areasForImprovement: feedback.areasForImprovement,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get user progress and dashboard data
  app.get("/api/dashboard", requireAuth, async (req: any, res) => {
    try {
      const progress = await storage.getUserProgress(req.user.id);
      const recentInterviews = await storage.getRecentMockInterviews(req.user.id, 5);
      const cvAnalyses = await storage.getCvAnalysesByUserId(req.user.id);

      res.json({
        progress: progress || {
          cvScore: 0,
          interviewCount: 0,
          averageScore: 0,
          dayStreak: 0,
        },
        recentInterviews,
        latestCvAnalysis: cvAnalyses[0] || null,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Smart Career Hub
  app.get("/api/job-role-insights", async (req, res) => {
    try {
      const { role } = req.query;
      
      if (!role || typeof role !== "string") {
        return res.status(400).json({ message: "Job role parameter is required" });
      }

      const insights = await getCareerInsights(role);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Job Role Autosuggest
  app.get("/api/job-role-list", (req, res) => {
    const { search } = req.query;
    
    let roles = trendingJobRoles;
    
    if (search && typeof search === "string") {
      roles = trendingJobRoles.filter(role => 
        role.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    res.json({ roles });
  });

  // Feedback Export
  app.get("/api/export-feedback", requireAuth, async (req: any, res) => {
    try {
      const cvAnalyses = await storage.getCvAnalysesByUserId(req.user.id);
      const mockInterviews = await storage.getMockInterviewsByUserId(req.user.id);
      const progress = await storage.getUserProgress(req.user.id);

      const reportData = {
        user: {
          fullName: req.user.fullName || req.user.username,
          email: req.user.email,
        },
        progress: progress || {
          id: 0,
          userId: req.user.id,
          cvScore: 0,
          interviewCount: 0,
          averageScore: 0,
          dayStreak: 0,
          lastActivityDate: null,
          updatedAt: new Date(),
        },
        cvAnalyses,
        mockInterviews,
      };

      const pdfBuffer = await generateFeedbackReport(reportData);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=feedback-report.pdf");
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get CV analyses history
  app.get("/api/cv-analyses", requireAuth, async (req: any, res) => {
    try {
      const analyses = await storage.getCvAnalysesByUserId(req.user.id);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get mock interviews history
  app.get("/api/mock-interviews", requireAuth, async (req: any, res) => {
    try {
      const interviews = await storage.getMockInterviewsByUserId(req.user.id);
      res.json(interviews);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get course recommendations based on skills and job role
  app.post("/api/course-recommendations", requireAuth, async (req: any, res) => {
    try {
      const { skills, jobRole, userLevel } = req.body;
      
      if (!skills || !jobRole) {
        return res.status(400).json({ message: "Skills and job role are required" });
      }

      const recommendations = await getCourseRecommendations(
        skills, 
        jobRole, 
        userLevel || "intermediate"
      );
      
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get course recommendations from CV analysis
  app.get("/api/cv/:id/courses", requireAuth, async (req: any, res) => {
    try {
      const cvId = parseInt(req.params.id);
      const cv = await storage.getCvAnalysis(cvId);
      
      if (!cv) {
        return res.status(404).json({ message: "CV analysis not found" });
      }
      
      if (cv.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const recommendations = await getCoursesFromCvAnalysis(
        cv.originalText,
        cv.suggestions as string[],
        cv.detectedJobRole || undefined
      );
      
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Generate interview questions based on CV analysis
  app.get("/api/cv/:id/interview-questions", requireAuth, async (req: any, res) => {
    try {
      const cvId = parseInt(req.params.id);
      const cv = await storage.getCvAnalysis(cvId);
      
      if (!cv) {
        return res.status(404).json({ message: "CV analysis not found" });
      }
      
      if (cv.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Reconstruct the CV analysis result for question generation
      const cvAnalysis = {
        score: cv.score,
        suggestions: cv.suggestions as string[],
        rewrittenVersion: cv.rewrittenVersion || "",
        improvements: [],
        strengths: (cv.strengths as string[]) || [],
        weaknesses: (cv.weaknesses as string[]) || [],
        nextSteps: (cv.nextSteps as string[]) || [],
        careerTrajectory: (cv.careerTrajectory as string[]) || [],
        salaryInsights: (cv.salaryInsights as any) || {
          roleTitle: "Not detected",
          experienceLevel: "Not specified",
          salaryRangeUS: "Data not available",
          salaryRangeUK: "Data not available",
          salaryRangeRemote: "Data not available",
          factors: []
        },
        extractedSkills: (cv.extractedSkills as string[]) || [],
        detectedJobRole: cv.detectedJobRole || "Software Engineer"
      };

      const difficulty = req.query.difficulty as string || "mixed";
      const questions = await generateInterviewQuestions(
        cvAnalysis,
        cv.detectedJobRole || "Software Engineer",
        difficulty
      );
      
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Create new interview session
  app.post("/api/interview-sessions", requireAuth, async (req: any, res) => {
    try {
      const { jobRole, difficulty, questions } = req.body;
      
      if (!jobRole || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: "Job role and questions are required" });
      }

      const session = await storage.createInterviewSession({
        userId: req.user.id,
        jobRole,
        difficulty: difficulty || "mixed",
        totalQuestions: questions.length,
        answeredQuestions: 0,
        questions: questions,
        status: "in_progress"
      });
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get active interview session
  app.get("/api/interview-sessions/active", requireAuth, async (req: any, res) => {
    try {
      const session = await storage.getActiveInterviewSession(req.user.id);
      res.json(session || null);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get all interview sessions for user
  app.get("/api/interview-sessions", requireAuth, async (req: any, res) => {
    try {
      const sessions = await storage.getUserInterviewSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Update interview session
  app.patch("/api/interview-sessions/:id", requireAuth, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getInterviewSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Interview session not found" });
      }
      
      if (session.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updateInterviewSession(sessionId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ADMIN ONLY: Seed sample data for demo mode
  // Requires admin token in Authorization header: "Bearer <ADMIN_SEED_TOKEN>"
  // Only available in development mode - blocked in production
  app.post("/api/seed-sample", requireAdminAuth, async (req, res) => {
    try {
      const count = parseInt(req.body.count as string) || 1;
      
      if (count < 1 || count > 10) {
        return res.status(400).json({ 
          message: "Count must be between 1 and 10",
          error: "INVALID_COUNT"
        });
      }

      const result = await seedSampleData(count);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Seed operation failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Development info endpoint - shows admin token and seeding instructions
  // Only available in development mode
  app.get("/api/dev-info", (req, res) => {
    const env = process.env.NODE_ENV || 'development';
    
    if (env === 'production') {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({
      environment: env,
      adminToken: getAdminToken(),
      seedEndpoint: {
        url: "/api/seed-sample",
        method: "POST",
        description: "Create demo users with sample data",
        authentication: "Bearer token required in Authorization header",
        body: {
          count: "Number of demo users to create (1-10)"
        },
        example: {
          curl: `curl -X POST http://localhost:5000/api/seed-sample \\
  -H "Authorization: Bearer ${getAdminToken()}" \\
  -H "Content-Type: application/json" \\
  -d '{"count": 1}'`
        }
      },
      schemaTemplates: {
        location: "/migrations/mock_backups/",
        description: "Schema templates showing expected data structure"
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
