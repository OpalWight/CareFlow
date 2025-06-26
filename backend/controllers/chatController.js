// backend/controllers/chatController.js
const ChatSession = require('../models/ChatSession'); // Adjust path if models are deeper
const { getGenerativeModel, generatePatientInstruction, mvpScenarioDetails } = require('../config/gemini'); // Adjust path if config is deeper

// Handles starting a new patient simulation session
exports.startChatSession = async (req, res) => {
    const userId = req.user.id; // User ID from the authenticated request (via JWT middleware)

    try {
        const model = getGenerativeModel();
        const systemInstruction = generatePatientInstruction(mvpScenarioDetails);
        const initialGeminiHistory = [{ role: "user", parts: [{ text: systemInstruction }] }];
        const chat = model.startChat({ history: initialGeminiHistory });

        const initialPatientTurnPrompt = "You enter Martha's room and greet her. What is her initial response or complaint?";
        const result = await chat.sendMessage(initialPatientTurnPrompt);
        const patientFirstResponse = result.response.text();

        const newChatSession = new ChatSession({
            userId: userId,
            scenarioId: mvpScenarioDetails.id,
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

        chatSession.messages.push({ role: 'user', content: studentMessage });

        const geminiHistory = chatSession.messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        const model = getGenerativeModel();
        const chat = model.startChat({ history: geminiHistory.slice(0, -1) }); // Pass all history *except* the latest user message

        const result = await chat.sendMessage(studentMessage);
        const patientResponse = result.response.text();

        chatSession.messages.push({ role: 'model', content: patientResponse });

        await chatSession.save();

        res.status(200).json({ patientResponse: patientResponse });

    } catch (error) {
        console.error("Error sending message:", error.message);
        res.status(500).json({ message: "Failed to get patient response.", error: error.message });
    }
};