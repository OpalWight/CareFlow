// backend/controllers/chatController.js
const ChatSession = require('../models/ChatSession'); // Adjust path if models are deeper
const UserProgress = require('../models/UserProgress'); // Import UserProgress model
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

        // Check objectives and relevance after receiving the patient response
        const evaluationResults = await evaluateStudentMessage(studentMessage, scenario, model);

        chatSession.messages.push({ role: 'model', content: patientResponse });

        // Track completed objectives
        if (!chatSession.completedObjectives) {
            chatSession.completedObjectives = [];
        }

        // Add newly completed objectives
        evaluationResults.objectiveResults.forEach(result => {
            if (result.completed && !chatSession.completedObjectives.some(obj => obj.objective === result.objective)) {
                chatSession.completedObjectives.push({
                    objective: result.objective,
                    completedAt: new Date(),
                    evidence: result.evidence
                });
            }
        });

        // Store relevance information for analytics/feedback
        if (!chatSession.messageEvaluations) {
            chatSession.messageEvaluations = [];
        }
        chatSession.messageEvaluations.push({
            message: studentMessage,
            timestamp: new Date(),
            isRelevant: evaluationResults.relevanceCheck.isRelevant,
            relevanceReason: evaluationResults.relevanceCheck.reason,
            objectivesAddressed: evaluationResults.objectiveResults.filter(r => r.completed).map(r => r.objective)
        });

        // After checking objectives, update UserProgress
        const userProgress = await UserProgress.findOne({ userId: userId, skillId: chatSession.scenarioId });

        if (userProgress) {
            const completedObjectives = evaluationResults.objectiveResults
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
            objectiveResults: evaluationResults.objectiveResults,
            relevanceCheck: evaluationResults.relevanceCheck,
            completedObjectives: chatSession.completedObjectives,
            userProgress: userProgress // Send back updated progress
        });

    } catch (error) {
        console.error("Error sending message:", error.message);
        res.status(500).json({ message: "Failed to get patient response.", error: error.message });
    }
};

// Function to evaluate student message for both relevance and learning objectives in a single call
async function evaluateStudentMessage(studentMessage, scenario, model) {
    try {
        // Create a dynamic list of objectives for the prompt
        const objectivesList = scenario.learningObjectives.map(obj => `- "${obj}"`).join('\n');

        // Create a JSON structure for the model to fill out
        const desiredJsonFormat = {
            relevance: {
                isRelevant: "true or false",
                reason: "brief explanation of why the message is relevant or off-topic"
            },
            objectives: scenario.learningObjectives.map(obj => ({
                objective: obj,
                completed: "true or false",
                evidence: "brief explanation of why this objective was or was not met by the student's message"
            }))
        };

        const evaluationPrompt = `
            Analyze the following student message in the context of a CNA practicing the skill "${scenario.skillName}" with a patient named ${scenario.patientName}.

            Student Message: "${studentMessage}"

            Learning Objectives for this skill:
            ${objectivesList}

            First, determine if the student's message is relevant to practicing this skill.
            Second, for EACH of the learning objectives listed above, determine if the student's message demonstrates completion of that objective.

            Respond with ONLY a single JSON object in the exact format below. Do not include any other text or markdown formatting.

            JSON Format:
            ${JSON.stringify(desiredJsonFormat, null, 2)}
        `;

        const result = await model.generateContent(evaluationPrompt);
        const responseText = result.response.text();
        
        let evaluation;
        try {
            // Extract JSON from the response, which might be wrapped in markdown
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                evaluation = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON object found in the model's response.");
            }
        } catch (parseError) {
            console.error("Error parsing evaluation result:", parseError);
            // If parsing fails, return a default "error" state
            return {
                relevanceCheck: {
                    isRelevant: true, // Default to true to avoid blocking the user
                    reason: "Error parsing the evaluation from the AI model."
                },
                objectiveResults: scenario.learningObjectives.map(objective => ({
                    completed: false,
                    objective: objective,
                    evidence: "Could not parse evaluation."
                }))
            };
        }

        // If the message is not relevant, override the objective results
        if (!evaluation.relevance.isRelevant) {
            evaluation.objectives.forEach(obj => {
                obj.completed = false;
                obj.evidence = "Message was not relevant to the skill being practiced.";
            });
        }

        return {
            relevanceCheck: evaluation.relevance,
            objectiveResults: evaluation.objectives
        };

    } catch (error) {
        console.error("Error evaluating student message:", error);
        // Fallback in case of a network error or other issue with the API call itself
        return {
            relevanceCheck: {
                isRelevant: true,
                reason: "Error during evaluation - defaulting to relevant."
            },
            objectiveResults: scenario.learningObjectives.map(objective => ({
                completed: false,
                objective: objective,
                evidence: "An error occurred during the evaluation process."
            }))
        };
    }
}