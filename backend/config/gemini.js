const { GoogleGenerativeAI } = require('@google/generative-ai');
const Scenario = require('../models/Scenario');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to get scenario from database by skillId
const getScenarioBySkillId = async (skillId) => {
    try {
        const scenario = await Scenario.findOne({ skillId: skillId, isActive: true });
        if (!scenario) {
            // Fallback to default scenario if specific one not found
            console.warn(`Scenario not found for skillId: ${skillId}, using default`);
            return await Scenario.findOne({ skillId: "hand-hygiene", isActive: true });
        }
        return scenario;
    } catch (error) {
        console.error('Error fetching scenario:', error);
        // Return a basic fallback scenario
        return {
            skillId: "default",
            skillName: "General Care",
            patientName: "Mrs. Smith",
            patientAge: 75,
            patientCondition: "general care needs",
            patientPersonality: "cooperative and friendly",
            specificSymptoms: "You are a patient who needs general care assistance. You are cooperative and appreciate when caregivers are gentle and professional.",
            scenarioContext: "You are receiving general nursing care and appreciate professional, compassionate assistance.",
            learningObjectives: ["Provide compassionate care", "Maintain professionalism", "Follow proper procedures"]
        };
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
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", ...modelConfig });
};

module.exports = {
    getGenerativeModel,
    generatePatientInstruction,
    getScenarioBySkillId,
    getAllScenarios,
    // Deprecated: keeping for backward compatibility
    mvpScenarioDetails: null, // Will be removed in future version
};