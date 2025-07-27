// backend/controllers/chatController.js
const ChatSession = require('../models/ChatSession'); // Adjust path if models are deeper
const { getGenerativeModel, generatePatientInstruction, getScenarioBySkillId } = require('../config/gemini'); // Adjust path if config is deeper

// Handles starting a new patient simulation session
exports.startChatSession = async (req, res) => {
    const userId = req.user.id; // User ID from the authenticated request (via JWT middleware)
    const { skillId } = req.body; // Get skillId from request body

    try {
        // Get the scenario from database based on skillId
        const scenario = await getScenarioBySkillId(skillId || 'hand-hygiene'); // Default to hand-hygiene if no skillId provided
        
        if (!scenario) {
            return res.status(404).json({ message: "Scenario not found for the specified skill." });
        }

        const model = getGenerativeModel();
        const systemInstruction = generatePatientInstruction(scenario);
        const initialGeminiHistory = [{ role: "user", parts: [{ text: systemInstruction }] }];
        const chat = model.startChat({ history: initialGeminiHistory });

        const initialPatientTurnPrompt = `You enter ${scenario.patientName}'s room and greet them. What is their initial response or reaction?`;
        const result = await chat.sendMessage(initialPatientTurnPrompt);
        const patientFirstResponse = result.response.text();

        const newChatSession = new ChatSession({
            userId: userId,
            scenarioId: scenario.skillId,
            messages: [
                { role: "user", content: systemInstruction },
                { role: "user", content: initialPatientTurnPrompt },
                { role: "model", content: patientFirstResponse }
            ],
        });
        await newChatSession.save();

        res.status(201).json({
            sessionId: newChatSession._id,
            patientInitialResponse: patientFirstResponse,
            scenario: {
                skillName: scenario.skillName,
                patientName: scenario.patientName,
                patientAge: scenario.patientAge,
                learningObjectives: scenario.learningObjectives
            },
            message: "Chat session started successfully.",
        });

    } catch (error) {
        console.error("Error starting chat session:", error.message);
        res.status(500).json({ message: "Failed to start chat session.", error: error.message });
    }
};

// Handles sending a student's message and getting the AI patient's response
exports.sendMessage = async (req, res) => {
    const { sessionId, studentMessage } = req.body;
    const userId = req.user.id;

    try {
        const chatSession = await ChatSession.findById(sessionId);

        if (!chatSession || chatSession.userId.toString() !== userId) {
            return res.status(404).json({ message: "Chat session not found or unauthorized." });
        }

        // Get the scenario to check objectives
        const scenario = await getScenarioBySkillId(chatSession.scenarioId);
        
        chatSession.messages.push({ role: 'user', content: studentMessage });

        const geminiHistory = chatSession.messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        const model = getGenerativeModel();
        const chat = model.startChat({ history: geminiHistory.slice(0, -1) }); // Pass all history *except* the latest user message

        const result = await chat.sendMessage(studentMessage);
        const patientResponse = result.response.text();

        // Check objectives after receiving the patient response
        const objectiveResults = await checkLearningObjectives(studentMessage, scenario.learningObjectives, model);

        chatSession.messages.push({ role: 'model', content: patientResponse });

        // Track completed objectives
        if (!chatSession.completedObjectives) {
            chatSession.completedObjectives = [];
        }

        // Add newly completed objectives
        objectiveResults.forEach(result => {
            if (result.completed && !chatSession.completedObjectives.some(obj => obj.objective === result.objective)) {
                chatSession.completedObjectives.push({
                    objective: result.objective,
                    completedAt: new Date(),
                    evidence: result.evidence
                });
            }
        });

        // After checking objectives, update UserProgress
        const userProgress = await UserProgress.findOne({ userId: userId, skillId: chatSession.scenarioId });

        if (userProgress) {
            const completedObjectives = objectiveResults
                .filter(result => result.completed)
                .map(result => ({ stepId: result.objective, completedAt: new Date() }));

            if (completedObjectives.length > 0) {
                // Add only new completed objectives to the progress
                const newSteps = completedObjectives.filter(co => 
                    !userProgress.patientSimProgress.completedSteps.some(ps => ps.stepId === co.stepId)
                );

                if (newSteps.length > 0) {
                    userProgress.patientSimProgress.completedSteps.push(...newSteps);
                    
                    // Recalculate score based on completed steps
                    const totalObjectives = scenario.learningObjectives.length;
                    const score = (userProgress.patientSimProgress.completedSteps.length / totalObjectives) * 100;

                    // Update progress
                    await userProgress.updatePatientSimProgress(
                        userProgress.patientSimProgress.completedSteps,
                        score,
                        // Assuming a fixed time per interaction for now, this could be improved
                        (new Date() - new Date(chatSession.createdAt)) / 1000 
                    );
                }
            }
        }

        await chatSession.save();

        res.status(200).json({ 
            patientResponse: patientResponse,
            objectiveResults: objectiveResults,
            completedObjectives: chatSession.completedObjectives,
            userProgress: userProgress // Send back updated progress
        });

    } catch (error) {
        console.error("Error sending message:", error.message);
        res.status(500).json({ message: "Failed to get patient response.", error: error.message });
    }
};

// Function to check if learning objectives have been met
async function checkLearningObjectives(studentMessage, learningObjectives, model) {
    const objectiveResults = [];

    for (const objective of learningObjectives) {
        try {
            const checkPrompt = `
                Analyze this student message: "${studentMessage}"
                
                Does this message demonstrate completion of this learning objective: "${objective}"?
                
                Respond with ONLY a JSON object in this exact format:
                {
                    "completed": true/false,
                    "objective": "${objective}",
                    "evidence": "brief explanation of why this objective was or was not met"
                }
            `;

            const result = await model.generateContent(checkPrompt);
            const responseText = result.response.text();
            
            try {
                // Extract JSON from response
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsedResult = JSON.parse(jsonMatch[0]);
                    objectiveResults.push(parsedResult);
                } else {
                    // Fallback if JSON parsing fails
                    objectiveResults.push({
                        completed: false,
                        objective: objective,
                        evidence: "Could not parse objective assessment"
                    });
                }
            } catch (parseError) {
                console.error("Error parsing objective result:", parseError);
                objectiveResults.push({
                    completed: false,
                    objective: objective,
                    evidence: "Error parsing objective assessment"
                });
            }
        } catch (error) {
            console.error("Error checking objective:", error);
            objectiveResults.push({
                completed: false,
                objective: objective,
                evidence: "Error checking objective"
            });
        }
    }

    return objectiveResults;
}