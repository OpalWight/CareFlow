const { GoogleGenerativeAI } = require('@google/generative-ai');
const Scenario = require('../models/Scenario');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fallback scenarios for when database is not populated
const fallbackScenarios = {
    'hand-hygiene': {
        skillId: "hand-hygiene",
        skillName: "Hand Hygiene (Hand Washing)",
        skillCategory: "infection-control",
        patientName: "Mrs. Johnson",
        patientAge: 72,
        patientCondition: "post-operative care",
        patientPersonality: "cooperative but anxious about cleanliness",
        specificSymptoms: "You are concerned about infection and appreciate when staff wash their hands properly. You feel reassured when you see proper hygiene practices.",
        scenarioContext: "You are in the hospital recovering from surgery and are very conscious about infection prevention. You notice and appreciate when healthcare workers follow proper hand hygiene.",
        learningObjectives: [
            "Knocks before entering resident's space",
            "Introduces self",
            "Addresses resident by name",
            "Provides explanation to resident of care to be performed",
            "Obtains permission from resident to perform care",
            "Performs Hand washing before collecting supplies",
            "Uses Standard Precautions throughout skill performance, including barriers",
            "Ask resident about any comfort, preferences and or needs",
            "Provides privacy to resident throughout skill performance",
            "Provides safety measures throughout skill performance",
            "Call light left in reach of resident at all times",
            "Bed in low position",
            "Wheelchair/Bed wheels locked",
            "Side Rails in upright position if resident is at risk for falls",
            "Non-slip footwear",
            "Water temperature assessed for resident protection and comfort",
            "Demonstrate proper hand washing technique",
            "Follow infection control protocols",
            "Maintain patient confidence through visible hygiene practices",
            "Performs Hand Hygiene just before exiting the room and before documentation"
        ],
        specificSteps: [
            "Address client by name and introduce self",
            "Turn on water at sink",
            "Wet hands and wrists thoroughly",
            "Apply soap to hands",
            "Lather for at least 20 seconds with friction",
            "Clean fingernails against opposite palm",
            "Rinse all surfaces, fingertips down",
            "Dry with clean paper towel, fingertips first",
            "Turn off faucet with paper towel"
        ],
        isActive: true
    }
};

// Function to get scenario from database by skillId
const getScenarioBySkillId = async (skillId) => {
    try {
        const scenario = await Scenario.findOne({ skillId: skillId, isActive: true });
        if (!scenario) {
            // Use fallback scenario if specific one not found in database
            console.warn(`Scenario not found in database for skillId: ${skillId}, using fallback`);
            const fallbackScenario = fallbackScenarios[skillId] || fallbackScenarios['hand-hygiene'];
            return fallbackScenario;
        }
        return scenario;
    } catch (error) {
        console.error('Error fetching scenario from database:', error);
        // Use fallback scenarios when database is unavailable
        console.log('Using fallback scenario due to database error');
        const fallbackScenario = fallbackScenarios[skillId] || fallbackScenarios['hand-hygiene'];
        return fallbackScenario;
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