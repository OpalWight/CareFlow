# CareFlow Development Guide

## Project Overview
CareFlow is a comprehensive learning platform for Certified Nursing Assistant (CNA) students, featuring adaptive quizzes, RAG-enhanced content generation, and personalized learning paths.

## Recent Enhancements: Intelligent Question Generation System

### Problem Solved
The backend was experiencing question shortages during quiz generation, specifically:
- Requesting 30 questions but only returning 24 (20% shortage)
- "Role of the Nurse Aide" competency area particularly affected (needed 8, got 2)
- Restrictive filtering criteria (difficulty, quality score, recent usage) causing shortages

### Solution Implemented
Enhanced the question generation system with intelligent shortage detection and automatic generation:

#### 1. Enhanced Question Selection Logic (`QuestionPoolService.js`)
- **Proactive Shortage Detection**: Added `_ensureSufficientQuestions()` method that analyzes question availability before quiz session creation
- **Intelligent Generation Triggers**: Generate questions when `availableQuestions.length < requestedCount` (not just when zero)
- **Smart Buffer Generation**: Generate 2x the shortage amount to build a buffer for future quizzes

#### 2. Dual-Layer Protection
- **Pre-Quiz Analysis**: Check all competency areas before quiz starts and generate missing questions
- **Real-time Generation**: During question selection, detect shortages and generate on-demand
- **Maintains Quality**: No relaxation of filtering criteria - generates new questions instead

#### 3. RAG Service Integration Fix
- **Fixed Missing Method**: Added `getContentForDomain()` method to `QuizRAGService.js`
- **Domain Mapping**: Properly maps competency areas to content retrieval methods
- **Enhanced Content**: RAG-enhanced question generation with domain-specific content

### Key Files Modified

#### `/backend/services/QuestionPoolService.js`
```javascript
// New proactive shortage analysis method
async _ensureSufficientQuestions(distribution, userPrefs) {
    // Analyzes each competency area for potential shortages
    // Generates questions preemptively before quiz session creation
}

// Enhanced question selection for competency areas  
async _selectQuestionsForCompetency() {
    // Now generates when availableQuestions.length < count
    // Creates 2x shortage amount for buffer
    // Maintains all quality filtering criteria
}
```

#### `/backend/services/quizRagService.js`
```javascript
// New method for domain-specific content retrieval
async getContentForDomain(competencyArea, topK = 15) {
    // Maps competency areas to appropriate content methods
    // Supports Physical Care Skills, Psychosocial Care Skills, Role of the Nurse Aide
}
```

### Testing Strategy
Since this is a backend enhancement focused on data generation and availability:

1. **Database Monitoring**: Check question pool statistics before/after implementation
2. **Log Analysis**: Monitor quiz generation logs for shortage detection and resolution
3. **Quiz Success Rate**: Ensure 100% of quiz requests return the requested number of questions
4. **Generation Performance**: Monitor question generation times and success rates

### Expected Behavior
- **Before**: Quiz requests could fail with insufficient questions
- **After**: All quiz requests automatically generate missing questions to ensure full quota
- **Quality Maintained**: All questions still meet minimum quality, difficulty, and recency criteria
- **Performance**: Slight increase in initial quiz generation time when questions need to be generated

### Development Commands

```bash
# Run backend in development mode
cd backend && npm run dev:local

# Monitor logs for question generation
# Look for these log patterns:
# - [QUIZ-DEBUG] 🔍 Analyzing question availability
# - [QUIZ-DEBUG] 🚨 Found X competency areas with question shortages  
# - [QUIZ-DEBUG] 🔄 Preemptively generating X questions
# - [QUIZ-DEBUG] ✅ All competency areas have sufficient questions available
```

### Future Enhancements
- **Pool Health Monitoring**: Regular background maintenance to prevent shortages
- **Adaptive Generation**: Generate questions based on usage patterns and demand
- **Quality Score Optimization**: Implement machine learning for question quality assessment
- **Performance Caching**: Cache generated questions for faster quiz creation

## Development Notes
- Always test question generation functionality when modifying quiz-related code
- Monitor database growth as automatic generation will increase question pool size
- Ensure GEMINI_API_KEY is configured for question generation to work
- RAG service requires PINECONE_API_KEY for enhanced content retrieval

## Commit Message Guidelines
- **NEVER mention AI assistance** in commit messages
- Focus on the technical changes and business value
- Use professional, standard software development language
- Example: "Implement intelligent question generation" not "AI-generated question system"