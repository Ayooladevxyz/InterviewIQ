import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { upload, parseDocument, cleanupFile } from "./services/fileUpload";
import { analyzeCv, transcribeAudio, scoreInterviewAnswer, getCareerInsights, trendingJobRoles } from "./services/openai";
import { generateFeedbackReport } from "./services/pdfGenerator";
import { insertCvAnalysisSchema, insertMockInterviewSchema, UserProgress } from "@shared/schema";

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
      
      // Analyze with OpenAI
      const analysis = await analyzeCv(parsedText);

      // Save to storage
      const cvAnalysis = await storage.createCvAnalysis({
        userId: req.user.id,
        filename,
        originalText: parsedText,
        score: analysis.score,
        suggestions: analysis.suggestions,
        rewrittenVersion: analysis.rewrittenVersion,
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
      });
    } catch (error) {
      if (req.file) {
        cleanupFile(req.file.path);
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Voice Recording & Feedback
  app.post("/api/upload-audio", requireAuth, upload.single("audio"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file uploaded" });
      }

      const { question, jobRole } = req.body;
      if (!question || !jobRole) {
        return res.status(400).json({ message: "Question and job role are required" });
      }

      const filePath = req.file.path;

      // Transcribe audio
      const transcription = await transcribeAudio(filePath);
      
      // Score the answer
      const feedback = await scoreInterviewAnswer(question, transcription.text, jobRole);

      // Save to storage
      const mockInterview = await storage.createMockInterview({
        userId: req.user.id,
        jobRole,
        question,
        answer: transcription.text,
        score: feedback.score,
        feedback: feedback.feedback,
        improvedAnswer: feedback.improvedAnswer,
        audioUrl: `/uploads/${req.file.filename}`,
      });

      // Update user progress
      const currentProgress = await storage.getUserProgress(req.user.id);
      const interviews = await storage.getMockInterviewsByUserId(req.user.id);
      const averageScore = interviews.reduce((sum, i) => sum + i.score, 0) / interviews.length;

      await storage.updateUserProgress(req.user.id, {
        interviewCount: interviews.length,
        averageScore: Math.round(averageScore * 10) / 10,
        lastActivityDate: new Date(),
      });

      res.json({
        id: mockInterview.id,
        transcription: transcription.text,
        score: feedback.score,
        feedback: feedback.feedback,
        improvedAnswer: feedback.improvedAnswer,
        strengths: feedback.strengths,
        areasForImprovement: feedback.areasForImprovement,
      });
    } catch (error) {
      if (req.file) {
        cleanupFile(req.file.path);
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Interview Q&A Scoring (text-based)
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
        averageScore: Math.round(averageScore * 10) / 10,
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

  const httpServer = createServer(app);
  return httpServer;
}
