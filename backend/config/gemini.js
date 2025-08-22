const { GoogleGenerativeAI } = require('@google/generative-ai');
const Scenario = require('../models/Scenario');
const DynamicKnowledgeService = require('../services/dynamicKnowledgeService');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize RAG service for dynamic scenario generation
let dynamicKnowledgeService = null;
const initializeRAGService = async () => {
    if (!dynamicKnowledgeService) {
        dynamicKnowledgeService = new DynamicKnowledgeService();
        try {
            await dynamicKnowledgeService.initialize();
            console.log('RAG service initialized for scenario generation');
        } catch (error) {
            console.error('Failed to initialize RAG service:', error);
        }
    }
    return dynamicKnowledgeService;
};

// Function to generate scenario from RAG knowledge using AI
const generateScenarioFromKnowledge = async (skillId, knowledgeDocuments) => {
    try {
        console.log(`🤖 AI: Generating scenario for ${skillId} using ${knowledgeDocuments.length} knowledge documents`);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });
        
        // Build knowledge context from retrieved documents
        const knowledgeContext = knowledgeDocuments.map((doc, index) => 
            `[Knowledge ${index + 1}] (Score: ${doc.score?.toFixed(2) || 'N/A'}):\n${doc.content}`
        ).join('\n\n');

        const prompt = `
You are an expert CNA trainer creating a realistic patient simulation scenario for the skill: "${skillId}".

RETRIEVED KNOWLEDGE ABOUT THIS SKILL:
${knowledgeContext}

Based on this knowledge, create a realistic patient simulation scenario. Generate a JSON response with this exact structure:

{
  "skillId": "${skillId}",
  "skillName": "descriptive name of the skill",
  "skillCategory": "one of: infection-control, adl, mobility, measurement, range-motion",
  "patientName": "realistic patient name (Mr./Mrs. [Last name])",
  "patientAge": number between 65-85,
  "patientCondition": "realistic medical condition requiring this skill",
  "patientPersonality": "brief personality description affecting care interaction",
  "specificSymptoms": "what the patient is experiencing that requires this skill",
  "scenarioContext": "detailed scenario setup explaining why this skill is needed",
  "learningObjectives": [
    "list of 6-12 specific learning objectives from the knowledge",
    "focus on key procedural steps and safety requirements",
    "use action-oriented language (e.g., 'Performs hand hygiene before...', 'Demonstrates proper...')"
  ],
  "criticalSteps": [
    {
      "stepNumber": 1,
      "description": "critical safety step",
      "critical": true
    }
  ],
  "commonMistakes": [
    "list of 3-5 common mistakes students make with this skill"
  ],
  "isActive": true
}

REQUIREMENTS:
- Create realistic, age-appropriate scenarios for elderly patients
- Base learning objectives directly on the retrieved knowledge
- Include safety-critical steps and infection control measures
- Make the patient personality realistic and relevant to the skill
- Ensure all information is consistent and professionally appropriate

Respond ONLY with valid JSON, no other text.`;

        console.log(`🤖 AI: Sending prompt to Gemini (${prompt.length} chars)`);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        console.log(`🤖 AI: Received response (${responseText.length} chars)`);
        
        // Parse JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error(`❌ AI: No valid JSON found in response: ${responseText.substring(0, 500)}...`);
            throw new Error('No valid JSON found in AI response');
        }
        
        console.log(`🤖 AI: Parsing JSON response`);
        const scenario = JSON.parse(jsonMatch[0]);
        
        // Ensure required fields are present
        if (!scenario.skillId || !scenario.skillName || !scenario.patientName) {
            console.error(`❌ AI: Generated scenario missing required fields:`, scenario);
            throw new Error('Generated scenario missing required fields');
        }
        
        // Set the skillId to ensure consistency
        scenario.skillId = skillId;
        
        console.log(`✅ AI: Successfully generated scenario for ${skillId}: ${scenario.skillName}`);
        return scenario;
        
    } catch (error) {
        console.error('Error generating scenario from knowledge:', error);
        throw error;
    }
};

// RAG-based scenario generation replaces hardcoded fallback scenarios

// Function to generate scenario dynamically using RAG
const getScenarioBySkillId = async (skillId) => {
    try {
        console.log(`Generating dynamic scenario for skillId: ${skillId}`);
        
        // Initialize RAG service
        const ragService = await initializeRAGService();
        if (!ragService) {
            console.error('RAG service not available');
            return null;
        }

        // Query RAG system for knowledge about the skill with multiple query variations
        console.log(`🔍 RAG: Searching knowledge for skillId: ${skillId}`);
        
        let knowledge = await ragService.getCombinedKnowledge(
            `CNA skill ${skillId} procedures steps techniques safety requirements`,
            skillId,
            {
                topK: 15,
                minScore: 0.3  // Lowered from 0.6 to be more permissive
            }
        );

        console.log(`🔍 RAG: Primary query found ${knowledge.documents?.length || 0} documents`);

        // If no results, try alternative queries
        if (!knowledge.documents || knowledge.documents.length === 0) {
            console.log(`🔍 RAG: Trying alternative query for ${skillId}`);
            
            // Try broader query without skill prefix
            knowledge = await ragService.getCombinedKnowledge(
                `${skillId.replace(/-/g, ' ')} nursing procedure safety steps`,
                skillId,
                {
                    topK: 15,
                    minScore: 0.25  // Even more permissive for fallback
                }
            );
            
            console.log(`🔍 RAG: Alternative query found ${knowledge.documents?.length || 0} documents`);
        }

        // If still no results, try very broad query
        if (!knowledge.documents || knowledge.documents.length === 0) {
            console.log(`🔍 RAG: Trying broad query for ${skillId}`);
            
            knowledge = await ragService.getCombinedKnowledge(
                skillId.replace(/-/g, ' '),
                skillId,
                {
                    topK: 20,
                    minScore: 0.2  // Very permissive for broad search
                }
            );
            
            console.log(`🔍 RAG: Broad query found ${knowledge.documents?.length || 0} documents`);
        }

        if (!knowledge.documents || knowledge.documents.length === 0) {
            console.error(`❌ RAG: No knowledge found in RAG system for skillId: ${skillId} after all attempts`);
            return null;
        }

        console.log(`✅ RAG: Successfully found ${knowledge.documents.length} documents for ${skillId}`);
        
        // Log document details for debugging
        knowledge.documents.slice(0, 3).forEach((doc, i) => {
            console.log(`📄 RAG Doc ${i+1}: Score=${doc.score?.toFixed(3)}, Content preview: ${doc.content?.substring(0, 100)}...`);
        });

        // Generate scenario using AI and retrieved knowledge
        const scenario = await generateScenarioFromKnowledge(skillId, knowledge.documents);
        
        console.log(`Successfully generated dynamic scenario for ${skillId}`);
        return scenario;

    } catch (error) {
        console.error('Error generating scenario from RAG:', error);
        return null;
    }
};

// Function to get all available scenarios
const getAllScenarios = async () => {
    try {
        return await Scenario.find({ isActive: true }).sort({ skillName: 1 });
    } catch (error) {
        console.error('Error fetching all scenarios:', error);
        return [];
    }
};

// Function to generate the initial patient persona instruction based on scenario details
// This is the "system instruction" that tells Gemini how to act.
const generatePatientInstruction = (scenario) => {
    return `
    You are a patient named ${scenario.patientName}, ${scenario.patientAge} years old.
    You have ${scenario.patientCondition}.
    Your personality is: ${scenario.patientPersonality}.
    
    Current situation: ${scenario.scenarioContext}
    
    Specifically, you are experiencing: ${scenario.specificSymptoms}
    
    IMPORTANT INSTRUCTIONS:
    - Respond concisely and stay in character. Do not break character under any circumstances.
    - Do not provide medical advice or act as a medical professional or healthcare provider.
    - Focus on your symptoms, feelings, and emotional state as a patient would.
    - Avoid self-diagnosing or offering medical solutions.
    - React naturally to what the CNA student is doing - you may ask questions, express concerns, or show appreciation.
    - If the student makes mistakes or forgets steps, react as a real patient would (confusion, discomfort, etc.).
    - Keep responses brief (1-3 sentences) to maintain realistic conversation flow.
    - Show human emotions: gratitude for good care, anxiety about procedures, embarrassment when appropriate.
    
    GUIDANCE FOR OFF-TOPIC RESPONSES:
    - If the student says something completely unrelated to the CNA skill being practiced, gently redirect them back to the task.
    - Examples of gentle redirection: "I'm sorry, but I was expecting you to help me with [skill]. Could you please focus on that?" or "That's nice, but right now I really need help with [specific care need]."
    - If the student asks personal questions unrelated to care, politely redirect: "I'd rather focus on my care right now. Could you help me with [skill]?"
    - If the student makes inappropriate comments, respond as a real patient would: "I'm not comfortable with that. Please just focus on providing my care professionally."
    - Always give the student a chance to get back on track rather than being dismissive.
    
    Skill being practiced: ${scenario.skillName}
    Your role is to help the student practice this skill realistically while staying in character as a patient.
    `;
};

// Model configuration for consistent and focused responses
const modelConfig = {
    temperature: 0.8,     // Controls randomness; lower for more focused, higher for more creative
    topP: 1,              // Nucleus sampling
    topK: 1,              // Top-k sampling
    maxOutputTokens: 200, // Limits the length of the patient's response
};

// Function to get a configured GenerativeModel instance
const getGenerativeModel = () => {
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001", ...modelConfig });
};

module.exports = {
    getGenerativeModel,
    generatePatientInstruction,
    getScenarioBySkillId,
    getAllScenarios,
    // Deprecated: keeping for backward compatibility
    mvpScenarioDetails: null, // Will be removed in future version
};