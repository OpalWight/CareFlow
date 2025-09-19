# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CareFlow is a full-stack CNA (Certified Nursing Assistant) learning platform that helps students practice nursing skills through AI-powered chat simulations, interactive drag-and-drop scenarios, and knowledge verification systems.

## Architecture

**Frontend (CNA_APP/):** React SPA built with Vite
- React 19.1.0 with React Router for navigation
- Drag-and-drop interactive simulations using @dnd-kit
- AI chat interface with speech recognition and text-to-speech
- Protected routing with JWT authentication

**Backend (backend/):** Node.js/Express API server
- MongoDB with Mongoose ODM for data persistence
- Google Gemini AI integration for chat simulations and RAG
- Pinecone vector database for knowledge retrieval
- JWT authentication with HTTP-only cookies
- Google OAuth 2.0 integration

## Development Commands

### Full Stack Development
```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend in development mode
npm run dev

# Run individual services
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
```

### Frontend Commands (CNA_APP/)
```bash
cd CNA_APP

# Development server
npm run dev                # Development mode
npm run dev:local         # Local development

# Building
npm run build             # Production build
npm run build:dev         # Development build
npm run build:test-prod   # Test production build

# Linting and Preview
npm run lint              # Run ESLint
npm run preview           # Preview production build
npm run preview:prod      # Build and preview production
```

### Backend Commands (backend/)
```bash
cd backend

# Development
npm run dev        # Development with file watching
npm run dev:local  # Local development
npm start          # Production start
```

## Key Systems

### Authentication Flow
- Dual auth: Google OAuth 2.0 and email/password
- JWT tokens stored in secure HTTP-only cookies
- Protected routes use `authMiddleware.js` for verification
- Frontend `AuthContext` manages global auth state

### AI Integration
- **Chat Simulations:** Gemini API powers patient role-play scenarios
- **RAG System:** Real-time verification of student actions using Pinecone vector search
- **Knowledge Base:** CNA procedures stored as embeddings for contextual feedback

### Interactive Components
- **Drag-and-Drop Simulations:** @dnd-kit enables supply collection and procedure practice
- **Speech Features:** Browser APIs for accessibility (speech recognition/text-to-speech)
- **Progress Tracking:** MongoDB stores user performance across skills and scenarios

## Environment Configuration

Frontend uses Vite environment variables (prefixed with `VITE_`):
- Development/production modes configured via build scripts
- API URLs and environment settings managed through .env files
- Vite config includes detailed environment diagnostics

## Database Models

Key MongoDB collections:
- `User`: Authentication and profile data
- `ChatSession`: AI conversation history and objectives
- `UserProgress`: Skill performance tracking
- `Scenario`: Patient simulation scenarios
- `KnowledgeDocument`: RAG system knowledge base
- `QuizSession`/`QuizResult`: Quiz functionality

## API Structure

Routes organized by domain:
- `/auth` - Email/password authentication
- `/oauth` - Google OAuth and user management
- `/chat` - AI patient simulations
- `/rag` - Real-time action verification
- `/progress` - Skill tracking
- `/quiz` - Quiz functionality
- `/knowledgeRoutes` - Admin knowledge base management

## Testing

No formal test suite detected. Verify functionality through:
- ESLint for code quality: `npm run lint`
- Manual testing of interactive scenarios
- AI simulation validation through chat interface

## Code Style

- ESLint configured with React hooks and refresh plugins
- React functional components with hooks
- Modular CSS files per component
- Mongoose schemas for data validation
- Express middleware for cross-cutting concerns

## Git Workflow

**IMPORTANT: After every code generation, modification, or fix, you MUST:**

1. Add all modified files to staging: `git add .`
2. Create a commit with a descriptive message (do NOT include any references to Claude or AI assistance)
3. Push changes to the development branch: `git push origin development`

This ensures all code changes are immediately saved and backed up to the remote repository. Never leave code changes uncommitted after completing a task.