# InterviewIQ Backend API - Node.js + Express

## Overview

InterviewIQ is an AI-powered job interview and career preparation platform built with a full-stack TypeScript architecture. The application consists of a React frontend, Express.js backend, and PostgreSQL database with AI integration through Google Gemini for CV analysis, interview feedback, and career insights.

## Recent Changes

### October 21, 2025 - Migration to Google Gemini
- ✅ Migrated from OpenAI to Google Gemini AI (gemini-2.5-pro, gemini-2.5-flash)
- ✅ Removed audio transcription feature (Gemini does not support audio transcription)
- ✅ Updated mock interviews to text-only mode
- ✅ Maintained all CV analysis, interview feedback, and career insights functionality
- ✅ Updated VoiceRecorder component to text-only interface
- ✅ Kept comprehensive fallback system for career insights when API key is unavailable

### January 21, 2025 - Database Integration & Career Insights Fix
- ✅ Migrated from in-memory storage to PostgreSQL database
- ✅ Implemented DatabaseStorage class with full CRUD operations
- ✅ Added database relations and constraints via Drizzle ORM
- ✅ Configured PostgreSQL session store for persistent authentication
- ✅ Database schema deployed with: users, cv_analyses, mock_interviews, user_progress tables
- ✅ Fixed career insights salary data display with comprehensive fallback system
- ✅ Added fallback career data for Frontend, Backend, Full Stack, Data Science roles
- ✅ Implemented graceful error handling when API key is unavailable

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with Local Strategy using session-based auth
- **API Design**: RESTful endpoints with structured error handling
- **File Processing**: Multer for file uploads with support for PDF/DOCX parsing
- **Session Management**: Express sessions with PostgreSQL store

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM (ACTIVE - January 2025)
- **Database Provider**: Replit PostgreSQL instance 
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Storage**: PostgreSQL-backed session store for authentication
- **Data Persistence**: All user data, CV analyses, mock interviews, and progress tracking stored in PostgreSQL

## Key Components

### Authentication System
- Session-based authentication using Passport.js
- Password hashing with Node.js crypto (scrypt)
- Protected routes middleware for API endpoints
- User registration and login with email/username support

### File Processing Pipeline
- CV upload supporting PDF and DOCX formats
- Document parsing using pdf-parse and mammoth.js libraries
- Temporary file storage with automatic cleanup
- File validation and size limits (10MB)

### AI Integration Layer
- Google Gemini integration (gemini-2.5-pro for analysis, gemini-2.5-flash for insights)
- CV analysis with scoring and improvement suggestions
- Interview feedback with structured evaluation
- Career insights with fallback data support
- Structured JSON responses for consistent data handling
- Error handling for API failures and rate limiting

### PDF Generation
- PDFKit for generating feedback reports
- Comprehensive reports including CV analysis and interview history
- User progress tracking and exportable documents

## Data Flow

### CV Analysis Workflow
1. User uploads CV file through FileUpload component
2. Multer processes and validates file format
3. Document parser extracts text content
4. Gemini API analyzes CV and provides scoring/suggestions
5. Results stored in database with user association
6. Frontend updates with real-time feedback

### Mock Interview Process
1. User submits text answer (audio recording not available with Gemini)
2. Gemini evaluates response against job role requirements
3. Feedback generated with scoring and improvement suggestions
4. Interview session stored for progress tracking

### User Progress Tracking
1. Dashboard aggregates user statistics
2. CV scores and interview averages calculated
3. Streak tracking for daily activity
4. Progress updates trigger frontend re-queries

## External Dependencies

### Core AI Services
- **Google Gemini API**: gemini-2.5-pro for CV analysis and interview feedback, gemini-2.5-flash for career insights
- **Package**: @google/genai for Gemini integration
- **API Key Management**: Environment variable configuration (GEMINI_API_KEY)

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: @neondatabase/serverless driver

### File Processing Libraries
- **pdf-parse**: PDF text extraction
- **mammoth**: DOCX document processing
- **multer**: File upload handling

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library

## Deployment Strategy

### Development Environment
- Vite dev server with HMR for frontend
- tsx for TypeScript execution in Node.js
- Replit integration with error overlay and cartographer

### Production Build Process
1. Frontend: Vite builds React app to `dist/public`
2. Backend: esbuild bundles server code to `dist/index.js`
3. Single deployment artifact with both frontend and backend

### Environment Configuration
- DATABASE_URL for PostgreSQL connection
- GEMINI_API_KEY for AI service access
- SESSION_SECRET for authentication security
- NODE_ENV for environment-specific behavior

### Database Management
- Drizzle migrations stored in `./migrations`
- Schema definitions in `shared/schema.ts`
- Push command for development schema updates

The application follows a monorepo structure with shared TypeScript types, clean separation of concerns, and comprehensive error handling throughout the stack.