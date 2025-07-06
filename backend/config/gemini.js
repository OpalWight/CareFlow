const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//hardcoded for now, will be replaced with a database later
const mvpScenarioDetails = {
    id: "martha-cough-mvp",
    name: "Martha",
    age: 78,
    condition: "mild cough and tiredness",
    personality: "generally cooperative but sometimes confused",
    specificSymptoms: "A persistent, dry cough that started yesterday. You feel a bit more tired than usual and have a slight headache. You sometimes forget what you just said."
};

// Function to generate the initial patient persona instruction based on scenario details
// This is the "system instruction" that tells Gemini how to act.
const generatePatientInstruction = (scenario) => {
    return `
    You are a patient named ${scenario.name}, ${scenario.age} years old.
    You have a ${scenario.condition}.
    Your personality is ${scenario.personality}.
    Specifically, you are experiencing: ${scenario.specificSymptoms}.
    Respond concisely and stay in character. Do not break character under any circumstances.
    Do not provide medical advice or act as a medical professional or healthcare provider.
    Focus on your symptoms and emotional state. Avoid self-diagnosing or offering solutions.
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
    mvpScenarioDetails, // Export for use in your chat controller
};