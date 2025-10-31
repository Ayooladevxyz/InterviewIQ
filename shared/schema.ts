import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cvAnalyses = pgTable("cv_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  filename: text("filename").notNull(),
  originalText: text("original_text").notNull(),
  score: integer("score").notNull(),
  suggestions: jsonb("suggestions").notNull(),
  rewrittenVersion: text("rewritten_version"),
  strengths: jsonb("strengths"),
  weaknesses: jsonb("weaknesses"),
  nextSteps: jsonb("next_steps"),
  careerTrajectory: jsonb("career_trajectory"),
  salaryInsights: jsonb("salary_insights"),
  extractedSkills: jsonb("extracted_skills"),
  detectedJobRole: text("detected_job_role"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mockInterviews = pgTable("mock_interviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  jobRole: text("job_role").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  score: integer("score").notNull(),
  feedback: text("feedback").notNull(),
  improvedAnswer: text("improved_answer"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interviewSessions = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  jobRole: text("job_role").notNull(),
  difficulty: text("difficulty").default("mixed"),
  totalQuestions: integer("total_questions").notNull(),
  answeredQuestions: integer("answered_questions").default(0),
  questions: jsonb("questions").notNull(),
  status: text("status").default("in_progress"), // "in_progress", "completed", "abandoned"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  cvScore: integer("cv_score").default(0),
  interviewCount: integer("interview_count").default(0),
  averageScore: integer("average_score").default(0),
  dayStreak: integer("day_streak").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
});

export const insertCvAnalysisSchema = createInsertSchema(cvAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertMockInterviewSchema = createInsertSchema(mockInterviews).omit({
  id: true,
  createdAt: true,
});

export const insertInterviewSessionSchema = createInsertSchema(interviewSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCvAnalysis = z.infer<typeof insertCvAnalysisSchema>;
export type CvAnalysis = typeof cvAnalyses.$inferSelect;
export type InsertMockInterview = z.infer<typeof insertMockInterviewSchema>;
export type MockInterview = typeof mockInterviews.$inferSelect;
export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;
export type InterviewSession = typeof interviewSessions.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  cvAnalyses: many(cvAnalyses),
  mockInterviews: many(mockInterviews),
  interviewSessions: many(interviewSessions),
  progress: one(userProgress, { fields: [users.id], references: [userProgress.userId] }),
}));

export const cvAnalysesRelations = relations(cvAnalyses, ({ one }) => ({
  user: one(users, { fields: [cvAnalyses.userId], references: [users.id] }),
}));

export const mockInterviewsRelations = relations(mockInterviews, ({ one }) => ({
  user: one(users, { fields: [mockInterviews.userId], references: [users.id] }),
}));

export const interviewSessionsRelations = relations(interviewSessions, ({ one }) => ({
  user: one(users, { fields: [interviewSessions.userId], references: [users.id] }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
}));
