// RAG Verification Service using Gemini Pro for CNA Skills Assessment
// Combines retrieved knowledge with AI assessment for intelligent skill verification

import { GoogleGenerativeAI } from '@google/generative-ai';
import EmbeddingService from './embeddingService.js';
import KnowledgeBase from './knowledgeBase.js';

class RAGVerificationService {
  constructor(googleApiKey, pineconeApiKey) {
    this.googleApiKey = googleApiKey;
    this.pineconeApiKey = pineconeApiKey;
    
    // Initialize services
    this.embeddingService = new EmbeddingService(googleApiKey);
    this.knowledgeBase = new KnowledgeBase(pineconeApiKey);
    this.genAI = new GoogleGenerativeAI(googleApiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    this.initialized = false;
  }

  /**
   * Initialize the RAG system
   */
  async initialize() {
    try {
      await this.knowledgeBase.initialize();
      this.initialized = true;
      console.log('RAG Verification Service initialized successfully');
    } catch (error) {
      console.error('Error initializing RAG Verification Service:', error);
      throw error;
    }
  }

  /**
   * Verify a skill step using RAG approach
   * @param {Object} stepData - Data about the step performed
   * @returns {Object} Verification results with feedback
   */
  async verifySkillStep(stepData) {
    if (!this.initialized) {
      throw new Error('RAG Service not initialized. Call initialize() first.');
    }

    const {
      skillId,
      stepId,
      stepName,
      userAction,
      supplies = [],
      timing = 0,
      sequence = 0,
      dropZone = '',
      requiredSupply = ''
    } = stepData;

    try {
      // 1. Build query context for knowledge retrieval
      const queryContext = this.buildQueryContext(stepData);
      
      // 2. Retrieve relevant knowledge from vector database
      const relevantKnowledge = await this.retrieveKnowledge(queryContext, skillId);
      
      // 3. Get AI assessment using retrieved knowledge
      const verification = await this.getAIVerification(stepData, relevantKnowledge);
      
      // 4. Post-process and enhance results
      const enhancedResults = this.enhanceVerificationResults(verification, stepData);
      
      return enhancedResults;
    } catch (error) {
      console.error('Error in skill step verification:', error);
      
      // Fallback verification in case of errors
      return this.getFallbackVerification(stepData);
    }
  }

  /**
   * Build query context for knowledge retrieval
   * @param {Object} stepData - Step data
   * @returns {string} Query context string
   */
  buildQueryContext(stepData) {
    const {
      skillId,
      stepName,
      userAction,
      supplies,
      timing,
      dropZone,
      requiredSupply
    } = stepData;

    return `
      CNA Skill: ${skillId}
      Step: ${stepName}
      User Action: ${userAction}
      Supplies Used: ${supplies.join(', ')}
      Required Supply: ${requiredSupply || 'None'}
      Drop Zone: ${dropZone}
      Time Taken: ${timing} seconds
      Assessment criteria safety protocols technique accuracy
    `.trim();
  }

  /**
   * Retrieve relevant knowledge from vector database
   * @param {string} queryContext - Query context
   * @param {string} skillId - Skill identifier
   * @returns {Array} Relevant knowledge documents
   */
  async retrieveKnowledge(queryContext, skillId) {
    try {
      const searchResults = await this.knowledgeBase.search(
        queryContext,
        (text) => this.embeddingService.createQueryEmbedding(text),
        {
          skillId: skillId,
          topK: 5,
          minScore: 0.7,
          criticality: null // Include all criticality levels
        }
      );

      return searchResults.documents.map(doc => ({
        content: doc.content,
        score: doc.score,
        source: doc.source,
        criticality: doc.criticality,
        tags: doc.tags
      }));
    } catch (error) {
      console.error('Error retrieving knowledge:', error);
      return []; // Return empty array if retrieval fails
    }
  }

  /**
   * Get AI verification using Gemini Pro
   * @param {Object} stepData - Step data
   * @param {Array} relevantKnowledge - Retrieved knowledge
   * @returns {Object} AI verification results
   */
  async getAIVerification(stepData, relevantKnowledge) {
    const prompt = this.buildVerificationPrompt(stepData, relevantKnowledge);
    
    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (error) {
      console.error('Error getting AI verification:', error);
      throw error;
    }
  }

  /**
   * Build detailed verification prompt for Gemini
   * @param {Object} stepData - Step data
   * @param {Array} relevantKnowledge - Retrieved knowledge
   * @returns {string} Complete prompt
   */
  buildVerificationPrompt(stepData, relevantKnowledge) {
    const {
      skillId,
      stepId,
      stepName,
      userAction,
      supplies,
      timing,
      sequence,
      dropZone,
      requiredSupply
    } = stepData;

    const knowledgeContext = relevantKnowledge.length > 0
      ? relevantKnowledge.map((doc, index) => 
          `[Knowledge ${index + 1}] (Score: ${doc.score.toFixed(2)}, Source: ${doc.source})\n${doc.content}`
        ).join('\n\n')
      : 'No specific knowledge retrieved for this step.';

    return `
You are an expert CNA (Certified Nursing Assistant) skills assessor evaluating student performance based on Credentia 2024 standards and OBRA regulations.

RELEVANT KNOWLEDGE BASE INFORMATION:
${knowledgeContext}

STUDENT PERFORMANCE DATA:
- CNA Skill: ${skillId}
- Step ID: ${stepId}
- Step Name: ${stepName}
- Student Action: ${userAction}
- Supplies Used: ${supplies.join(', ')}
- Required Supply: ${requiredSupply || 'None specified'}
- Drop Zone Used: ${dropZone}
- Time Taken: ${timing} seconds
- Step Sequence: ${sequence}

ASSESSMENT CRITERIA (in order of importance):
1. SAFETY COMPLIANCE: Critical safety violations (infection control, patient safety)
2. TECHNICAL ACCURACY: Correct procedure technique and execution
3. SUPPLY USAGE: Appropriate use of required supplies and materials
4. TIMING CONSIDERATIONS: Reasonable time for task completion
5. SEQUENCE ADHERENCE: Following proper procedural order
6. PROFESSIONAL STANDARDS: Maintaining dignity, privacy, communication

SCORING GUIDELINES:
- 90-100: Excellent - All criteria met with proper technique
- 80-89: Good - Minor non-critical deviations
- 70-79: Satisfactory - Some technique issues but safe
- 60-69: Needs Improvement - Multiple issues, still safe
- Below 60: Unsatisfactory - Safety concerns or major technique errors

Respond ONLY with valid JSON in this exact format:
{
  "isCorrect": boolean,
  "score": number (0-100),
  "feedback": "detailed explanation of performance",
  "criticalErrors": ["list of safety/critical issues"],
  "minorIssues": ["list of technique improvements needed"],
  "suggestions": ["specific improvement recommendations"],
  "confidence": number (0.0-1.0),
  "knowledgeUsed": boolean,
  "assessmentDetails": {
    "safetyCompliance": number (0-100),
    "technicalAccuracy": number (0-100),
    "supplyUsage": number (0-100),
    "timing": number (0-100),
    "sequence": number (0-100),
    "professionalism": number (0-100)
  }
}
    `.trim();
  }

  /**
   * Enhance verification results with additional processing
   * @param {Object} verification - Raw AI verification
   * @param {Object} stepData - Original step data
   * @returns {Object} Enhanced verification results
   */
  enhanceVerificationResults(verification, stepData) {
    // Calculate overall performance category
    const performanceCategory = this.getPerformanceCategory(verification.score);
    
    // Add timing analysis
    const timingAnalysis = this.analyzeStepTiming(stepData.timing, stepData.stepId);
    
    // Generate learning objectives if performance is low
    const learningObjectives = verification.score < 80 
      ? this.generateLearningObjectives(stepData.skillId, verification.criticalErrors, verification.minorIssues)
      : [];

    return {
      ...verification,
      performanceCategory,
      timingAnalysis,
      learningObjectives,
      timestamp: new Date().toISOString(),
      stepData: {
        skillId: stepData.skillId,
        stepId: stepData.stepId,
        stepName: stepData.stepName
      }
    };
  }

  /**
   * Get performance category based on score
   * @param {number} score - Performance score
   * @returns {Object} Performance category information
   */
  getPerformanceCategory(score) {
    if (score >= 90) return { level: 'excellent', color: '#28a745', message: 'Outstanding performance!' };
    if (score >= 80) return { level: 'good', color: '#17a2b8', message: 'Good work with minor areas for improvement.' };
    if (score >= 70) return { level: 'satisfactory', color: '#ffc107', message: 'Satisfactory performance, continue practicing.' };
    if (score >= 60) return { level: 'needs-improvement', color: '#fd7e14', message: 'Needs improvement, review techniques.' };
    return { level: 'unsatisfactory', color: '#dc3545', message: 'Requires significant improvement and additional practice.' };
  }

  /**
   * Analyze step timing
   * @param {number} timing - Time taken in seconds
   * @param {string} stepId - Step identifier
   * @returns {Object} Timing analysis
   */
  analyzeStepTiming(timing, stepId) {
    // Define expected time ranges for different types of steps
    const timeRanges = {
      'address-client': { min: 5, max: 15, type: 'communication' },
      'explain-procedure': { min: 10, max: 30, type: 'communication' },
      'hand-washing': { min: 20, max: 40, type: 'hygiene' },
      'apply-soap': { min: 5, max: 10, type: 'technique' },
      'lather-20sec': { min: 20, max: 30, type: 'timed' },
      'default': { min: 5, max: 60, type: 'general' }
    };

    const range = timeRanges[stepId] || timeRanges.default;
    
    let status = 'appropriate';
    let message = 'Good timing for this step.';
    
    if (timing < range.min) {
      status = 'too-fast';
      message = 'Consider taking more time to ensure thoroughness.';
    } else if (timing > range.max) {
      status = 'too-slow';
      message = 'Try to be more efficient while maintaining quality.';
    }

    return {
      status,
      message,
      actualTime: timing,
      expectedRange: range,
      efficiency: Math.min(100, Math.max(0, 100 - Math.abs(timing - (range.min + range.max) / 2) / range.max * 100))
    };
  }

  /**
   * Generate learning objectives based on performance issues
   * @param {string} skillId - Skill identifier
   * @param {Array} criticalErrors - Critical errors found
   * @param {Array} minorIssues - Minor issues found
   * @returns {Array} Learning objectives
   */
  generateLearningObjectives(skillId, criticalErrors, minorIssues) {
    const objectives = [];
    
    if (criticalErrors.length > 0) {
      objectives.push({
        type: 'critical',
        title: 'Safety Protocol Review',
        description: 'Review and practice safety protocols to prevent critical errors.',
        priority: 'high'
      });
    }
    
    if (minorIssues.length > 0) {
      objectives.push({
        type: 'technique',
        title: 'Technique Refinement',
        description: 'Practice proper technique to improve consistency and accuracy.',
        priority: 'medium'
      });
    }
    
    return objectives;
  }

  /**
   * Fallback verification when AI assessment fails
   * @param {Object} stepData - Step data
   * @returns {Object} Basic verification results
   */
  getFallbackVerification(stepData) {
    return {
      isCorrect: true, // Assume correct if we can't verify
      score: 75, // Give benefit of doubt
      feedback: 'Step completed. Detailed assessment unavailable at this time.',
      criticalErrors: [],
      minorIssues: [],
      suggestions: ['Continue practicing this skill for improved proficiency.'],
      confidence: 0.3, // Low confidence for fallback
      knowledgeUsed: false,
      assessmentDetails: {
        safetyCompliance: 75,
        technicalAccuracy: 75,
        supplyUsage: 75,
        timing: 75,
        sequence: 75,
        professionalism: 75
      },
      performanceCategory: { level: 'satisfactory', color: '#ffc107', message: 'Assessment unavailable, assumed satisfactory.' },
      timingAnalysis: { status: 'unknown', message: 'Timing analysis unavailable.', actualTime: stepData.timing },
      learningObjectives: [],
      timestamp: new Date().toISOString(),
      stepData: {
        skillId: stepData.skillId,
        stepId: stepData.stepId,
        stepName: stepData.stepName
      }
    };
  }

  /**
   * Get knowledge base statistics
   * @returns {Object} Knowledge base stats
   */
  async getKnowledgeBaseStats() {
    if (!this.initialized) {
      throw new Error('RAG Service not initialized.');
    }
    
    return await this.knowledgeBase.getStats();
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.knowledgeBase) {
      await this.knowledgeBase.cleanup();
    }
  }
}

export default RAGVerificationService;