import { users, cvAnalyses, mockInterviews, interviewSessions, userProgress, type User, type InsertUser, type CvAnalysis, type InsertCvAnalysis, type MockInterview, type InsertMockInterview, type InterviewSession, type InsertInterviewSession, type UserProgress, type InsertUserProgress } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createCvAnalysis(analysis: InsertCvAnalysis): Promise<CvAnalysis>;
  getCvAnalysesByUserId(userId: number): Promise<CvAnalysis[]>;
  getCvAnalysis(id: number): Promise<CvAnalysis | undefined>;
  
  createMockInterview(interview: InsertMockInterview): Promise<MockInterview>;
  getMockInterviewsByUserId(userId: number): Promise<MockInterview[]>;
  getRecentMockInterviews(userId: number, limit: number): Promise<MockInterview[]>;
  
  createInterviewSession(session: InsertInterviewSession): Promise<InterviewSession>;
  getInterviewSession(id: number): Promise<InterviewSession | undefined>;
  getActiveInterviewSession(userId: number): Promise<InterviewSession | undefined>;
  updateInterviewSession(id: number, updates: Partial<InsertInterviewSession>): Promise<InterviewSession>;
  getUserInterviewSessions(userId: number): Promise<InterviewSession[]>;
  
  getUserProgress(userId: number): Promise<UserProgress | undefined>;
  updateUserProgress(userId: number, progress: Partial<InsertUserProgress>): Promise<UserProgress>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private cvAnalyses: Map<number, CvAnalysis>;
  private mockInterviews: Map<number, MockInterview>;
  private interviewSessions: Map<number, InterviewSession>;
  private userProgress: Map<number, UserProgress>;
  currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.cvAnalyses = new Map();
    this.mockInterviews = new Map();
    this.interviewSessions = new Map();
    this.userProgress = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      fullName: insertUser.fullName ?? null
    };
    this.users.set(id, user);
    
    // Initialize user progress
    const progress: UserProgress = {
      id: this.currentId++,
      userId: id,
      cvScore: 0,
      interviewCount: 0,
      averageScore: 0,
      dayStreak: 0,
      lastActivityDate: new Date(),
      updatedAt: new Date(),
    };
    this.userProgress.set(id, progress);
    
    return user;
  }

  async createCvAnalysis(analysis: InsertCvAnalysis): Promise<CvAnalysis> {
    const id = this.currentId++;
    const cvAnalysis: CvAnalysis = { 
      ...analysis, 
      id, 
      createdAt: new Date(),
      rewrittenVersion: analysis.rewrittenVersion ?? null,
      strengths: analysis.strengths ?? null,
      weaknesses: analysis.weaknesses ?? null,
      nextSteps: analysis.nextSteps ?? null,
      careerTrajectory: analysis.careerTrajectory ?? null,
      salaryInsights: analysis.salaryInsights ?? null,
      extractedSkills: analysis.extractedSkills ?? null,
      detectedJobRole: analysis.detectedJobRole ?? null
    };
    this.cvAnalyses.set(id, cvAnalysis);
    return cvAnalysis;
  }

  async getCvAnalysesByUserId(userId: number): Promise<CvAnalysis[]> {
    return Array.from(this.cvAnalyses.values()).filter(
      (analysis) => analysis.userId === userId
    ).sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getCvAnalysis(id: number): Promise<CvAnalysis | undefined> {
    return this.cvAnalyses.get(id);
  }

  async createMockInterview(interview: InsertMockInterview): Promise<MockInterview> {
    const id = this.currentId++;
    const mockInterview: MockInterview = { 
      ...interview, 
      id, 
      createdAt: new Date(),
      improvedAnswer: interview.improvedAnswer ?? null,
      audioUrl: interview.audioUrl ?? null
    };
    this.mockInterviews.set(id, mockInterview);
    return mockInterview;
  }

  async getMockInterviewsByUserId(userId: number): Promise<MockInterview[]> {
    return Array.from(this.mockInterviews.values()).filter(
      (interview) => interview.userId === userId
    ).sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getRecentMockInterviews(userId: number, limit: number): Promise<MockInterview[]> {
    const interviews = await this.getMockInterviewsByUserId(userId);
    return interviews.slice(0, limit);
  }

  async getUserProgress(userId: number): Promise<UserProgress | undefined> {
    return this.userProgress.get(userId);
  }

  async updateUserProgress(userId: number, progressUpdate: Partial<InsertUserProgress>): Promise<UserProgress> {
    const existing = this.userProgress.get(userId);
    const updated: UserProgress = {
      ...existing,
      ...progressUpdate,
      id: existing?.id || this.currentId++,
      userId,
      updatedAt: new Date(),
    } as UserProgress;
    this.userProgress.set(userId, updated);
    return updated;
  }

  async createInterviewSession(sessionData: InsertInterviewSession): Promise<InterviewSession> {
    const id = this.currentId++;
    const session: InterviewSession = {
      ...sessionData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: sessionData.status ?? "in_progress",
      difficulty: sessionData.difficulty ?? "mixed",
      answeredQuestions: sessionData.answeredQuestions ?? 0
    };
    this.interviewSessions.set(id, session);
    return session;
  }

  async getInterviewSession(id: number): Promise<InterviewSession | undefined> {
    return this.interviewSessions.get(id);
  }

  async getActiveInterviewSession(userId: number): Promise<InterviewSession | undefined> {
    return Array.from(this.interviewSessions.values())
      .filter(s => s.userId === userId && s.status === "in_progress")
      .sort((a, b) => b.updatedAt!.getTime() - a.updatedAt!.getTime())[0];
  }

  async updateInterviewSession(id: number, updates: Partial<InsertInterviewSession>): Promise<InterviewSession> {
    const existing = this.interviewSessions.get(id);
    const updated: InterviewSession = {
      ...existing,
      ...updates,
      id: existing?.id || id,
      userId: existing?.userId || 0,
      updatedAt: new Date(),
    } as InterviewSession;
    this.interviewSessions.set(id, updated);
    return updated;
  }

  async getUserInterviewSessions(userId: number): Promise<InterviewSession[]> {
    return Array.from(this.interviewSessions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();

    // Initialize user progress
    await db
      .insert(userProgress)
      .values({
        userId: user.id,
        cvScore: 0,
        interviewCount: 0,
        averageScore: 0,
        dayStreak: 0,
      })
      .execute();

    return user;
  }

  async createCvAnalysis(analysis: InsertCvAnalysis): Promise<CvAnalysis> {
    const [cvAnalysis] = await db
      .insert(cvAnalyses)
      .values(analysis)
      .returning();
    return cvAnalysis;
  }

  async getCvAnalysesByUserId(userId: number): Promise<CvAnalysis[]> {
    return db
      .select()
      .from(cvAnalyses)
      .where(eq(cvAnalyses.userId, userId))
      .orderBy(desc(cvAnalyses.createdAt));
  }

  async getCvAnalysis(id: number): Promise<CvAnalysis | undefined> {
    const [analysis] = await db.select().from(cvAnalyses).where(eq(cvAnalyses.id, id));
    return analysis || undefined;
  }

  async createMockInterview(interview: InsertMockInterview): Promise<MockInterview> {
    const [mockInterview] = await db
      .insert(mockInterviews)
      .values(interview)
      .returning();
    return mockInterview;
  }

  async getMockInterviewsByUserId(userId: number): Promise<MockInterview[]> {
    return db
      .select()
      .from(mockInterviews)
      .where(eq(mockInterviews.userId, userId))
      .orderBy(desc(mockInterviews.createdAt));
  }

  async getRecentMockInterviews(userId: number, limit: number): Promise<MockInterview[]> {
    return db
      .select()
      .from(mockInterviews)
      .where(eq(mockInterviews.userId, userId))
      .orderBy(desc(mockInterviews.createdAt))
      .limit(limit);
  }

  async getUserProgress(userId: number): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    return progress || undefined;
  }

  async updateUserProgress(userId: number, progressData: Partial<InsertUserProgress>): Promise<UserProgress> {
    const [updated] = await db
      .update(userProgress)
      .set({ ...progressData, updatedAt: new Date() })
      .where(eq(userProgress.userId, userId))
      .returning();
    return updated;
  }

  async createInterviewSession(sessionData: InsertInterviewSession): Promise<InterviewSession> {
    const [session] = await db
      .insert(interviewSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getInterviewSession(id: number): Promise<InterviewSession | undefined> {
    const [session] = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.id, id));
    return session || undefined;
  }

  async getActiveInterviewSession(userId: number): Promise<InterviewSession | undefined> {
    const [session] = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId))
      .orderBy(desc(interviewSessions.updatedAt))
      .limit(1);
    
    // Only return if it's still in progress
    if (session && session.status === "in_progress") {
      return session;
    }
    return undefined;
  }

  async updateInterviewSession(id: number, updates: Partial<InsertInterviewSession>): Promise<InterviewSession> {
    const [updated] = await db
      .update(interviewSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(interviewSessions.id, id))
      .returning();
    return updated;
  }

  async getUserInterviewSessions(userId: number): Promise<InterviewSession[]> {
    return db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId))
      .orderBy(desc(interviewSessions.createdAt));
  }
}

/**
 * Factory function to create the appropriate storage instance
 * based on environment and configuration.
 * 
 * PRODUCTION: Always uses DatabaseStorage (PostgreSQL)
 * DEVELOPMENT: Uses DatabaseStorage by default, can use MemStorage with explicit env var
 */
function createStorage(): IStorage {
  const env = process.env.NODE_ENV || 'development';
  const forceMemStorage = process.env.USE_MEM_STORAGE === 'true';

  // PRODUCTION GUARD: Never allow MemStorage in production
  if (env === 'production' && forceMemStorage) {
    throw new Error(
      'SECURITY ERROR: MemStorage is not allowed in production. ' +
      'All production data must use DatabaseStorage (PostgreSQL).'
    );
  }

  // PRODUCTION: Always use DatabaseStorage
  if (env === 'production') {
    console.log('[Storage] Production mode: Using DatabaseStorage (PostgreSQL)');
    return new DatabaseStorage();
  }

  // DEVELOPMENT: Allow MemStorage only with explicit opt-in
  if (forceMemStorage) {
    console.warn(
      '[Storage] ⚠️  WARNING: Using MemStorage (in-memory) - data will be lost on restart. ' +
      'Set USE_MEM_STORAGE=false to use DatabaseStorage.'
    );
    return new MemStorage();
  }

  // DEFAULT: Use DatabaseStorage
  console.log('[Storage] Development mode: Using DatabaseStorage (PostgreSQL)');
  return new DatabaseStorage();
}

/**
 * Global storage instance - automatically configured based on environment
 * 
 * Production: Always PostgreSQL DatabaseStorage
 * Development: PostgreSQL DatabaseStorage (default) or MemStorage (opt-in with USE_MEM_STORAGE=true)
 */
export const storage = createStorage();
