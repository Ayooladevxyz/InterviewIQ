import { users, cvAnalyses, mockInterviews, userProgress, type User, type InsertUser, type CvAnalysis, type InsertCvAnalysis, type MockInterview, type InsertMockInterview, type UserProgress, type InsertUserProgress } from "@shared/schema";
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
  
  getUserProgress(userId: number): Promise<UserProgress | undefined>;
  updateUserProgress(userId: number, progress: Partial<InsertUserProgress>): Promise<UserProgress>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private cvAnalyses: Map<number, CvAnalysis>;
  private mockInterviews: Map<number, MockInterview>;
  private userProgress: Map<number, UserProgress>;
  currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.cvAnalyses = new Map();
    this.mockInterviews = new Map();
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
      rewrittenVersion: analysis.rewrittenVersion ?? null
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
}

export const storage = new DatabaseStorage();
