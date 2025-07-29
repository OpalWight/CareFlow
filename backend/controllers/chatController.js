// backend/controllers/chatController.js
const ChatSession = require('../models/ChatSession'); // Adjust path if models are deeper
const UserProgress = require('../models/UserProgress'); // Import UserProgress model
const { getGenerativeModel, generatePatientInstruction, getScenarioBySkillId } = require('../config/gemini'); // Adjust path if config is deeper
// Import specific steps data - since it's ES6 export, we need to handle it differently
const getCNASteps = (skillId) => {
    // Define the specific steps directly here since importing ES6 from CommonJS is complex
    const stepsMappings = {
        'hand-hygiene': [
            'Address client by name and introduce self',
            'Turn on water at sink',
            'Wet hands and wrists thoroughly',
            'Apply soap to hands',
            'Lather for at least 20 seconds with friction',
            'Clean fingernails against opposite palm',
            'Rinse all surfaces, fingertips down',
            'Dry with clean paper towel, fingertips first',
            'Turn off faucet with paper towel'
        ],
        'elastic-stocking': [
            'Explain procedure clearly to client',
            'Provide privacy with curtain/screen',
            'Ensure client is in supine position',
            'Turn stocking inside-out to heel',
            'Place stocking over toes, foot and heel',
            'Pull top of stocking over foot, heel and leg',
            'Move foot and leg gently, avoid force',
            'Ensure no twists/wrinkles, heel aligned',
            'Place signaling device within reach'
        ],
        // Add more skill mappings as needed - for now using fallback
    };
    
    return stepsMappings[skillId] || [];
};

// Handles starting a new patient simulation session
exports.startChatSession = async (req, res) => {
    const userId = req.user.id; // User ID from the authenticated request (via JWT middleware)
    const { skillId, evaluationMode = 'broad' } = req.body; // Get skillId and evaluationMode from request body

    try {
        // Get the scenario from database based on skillId
        const scenario = await getScenarioBySkillId(skillId || 'hand-hygiene'); // Default to hand-hygiene if no skillId provided
        
        if (!scenario) {
            return res.status(404).json({ message: "Scenario not found for the specified skill." });
        }

        const model = getGenerativeModel();
        const systemInstruction = generatePatientInstruction(scenario);

        // Create a new chat session without sending any initial message
        const newChatSession = new ChatSession({
            userId: userId,
            scenarioId: scenario.skillId,
            evaluationMode: evaluationMode,
            currentStepIndex: 0,
            messages: [
                { role: "user", content: systemInstruction }
            ],
        });
        await newChatSession.save();

        // Get specific steps for this skill
        const specificSteps = getCNASteps(scenario.skillId);

        res.status(201).json({
            sessionId: newChatSession._id,
            patientInitialResponse: null, // No initial response
            evaluationMode: evaluationMode,
            scenario: {
                skillName: scenario.skillName,
                patientName: scenario.patientName,
                patientAge: scenario.patientAge,
                learningObjectives: scenario.learningObjectives,
                specificSteps: specificSteps // Add specific steps
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
        console.log(`\n=== EVALUATING STUDENT MESSAGE ===`);
        console.log(`Skill: ${scenario.skillName}`);
        console.log(`Student Message: "${studentMessage}"`);
        console.log(`Session ID: ${sessionId}`);
        
        const evaluationResults = await evaluateStudentMessage(studentMessage, scenario, model, chatSession);

        chatSession.messages.push({ role: 'model', content: patientResponse });

        // Track completed objectives
        if (!chatSession.completedObjectives) {
            chatSession.completedObjectives = [];
        }

        // Add newly completed objectives with order validation for specific mode
        console.log(`\n=== OBJECTIVE EVALUATION RESULTS ===`);
        let stepIndexUpdated = false;
        
        evaluationResults.objectiveResults.forEach((result, index) => {
            const alreadyCompleted = chatSession.completedObjectives.some(obj => obj.objective === result.objective);
            
            if (result.completed) {
                if (!alreadyCompleted) {
                    // For specific mode, validate step order
                    if (chatSession.evaluationMode === 'specific') {
                        const expectedStepIndex = chatSession.currentStepIndex;
                        
                        if (index === expectedStepIndex) {
                            console.log(`✅ STEP COMPLETED IN ORDER: "${result.objective}" (Step ${index + 1})`);
                            console.log(`   Evidence: ${result.evidence}`);
                            
                            chatSession.completedObjectives.push({
                                objective: result.objective,
                                completedAt: new Date(),
                                evidence: result.evidence,
                                stepIndex: index
                            });
                            
                            // Update step index for next expected step
                            chatSession.currentStepIndex = expectedStepIndex + 1;
                            stepIndexUpdated = true;
                            console.log(`   Next expected step index: ${chatSession.currentStepIndex}`);
                            
                        } else if (index < expectedStepIndex) {
                            console.log(`✅ STEP ALREADY COMPLETED: "${result.objective}" (Step ${index + 1})`);
                            console.log(`   Evidence: ${result.evidence}`);
                        } else {
                            console.log(`❌ STEP OUT OF ORDER: "${result.objective}" (Step ${index + 1})`);
                            console.log(`   Expected step ${expectedStepIndex + 1}, but student attempted step ${index + 1}`);
                            console.log(`   Evidence: ${result.evidence}`);
                        }
                    } else {
                        // Broad mode - any order is fine
                        console.log(`✅ OBJECTIVE COMPLETED: "${result.objective}"`);
                        console.log(`   Evidence: ${result.evidence}`);
                        chatSession.completedObjectives.push({
                            objective: result.objective,
                            completedAt: new Date(),
                            evidence: result.evidence
                        });
                    }
                } else {
                    console.log(`✅ OBJECTIVE ALREADY COMPLETED: "${result.objective}"`);
                    console.log(`   Evidence: ${result.evidence}`);
                }
            } else {
                console.log(`❌ OBJECTIVE NOT MET: "${result.objective}"`);
                console.log(`   Reason: ${result.evidence}`);
            }
        });

        // Log relevance check results
        console.log(`\n=== RELEVANCE CHECK ===`);
        if (evaluationResults.relevanceCheck.isRelevant) {
            console.log(`✅ MESSAGE IS RELEVANT`);
        } else {
            console.log(`❌ MESSAGE IS OFF-TOPIC`);
        }
        console.log(`   Reason: ${evaluationResults.relevanceCheck.reason}`);

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
            // Check if skill is already completed at 100% - if so, skip progress update
            if (userProgress.patientSimProgress.isCompleted && userProgress.patientSimProgress.score >= 100) {
                console.log(`\n=== PROGRESS UPDATE SKIPPED ===`);
                console.log(`Skill "${chatSession.scenarioId}" already completed at 100% - maintaining existing progress`);
            } else {
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
                        
                        // Recalculate score based on completed steps (cap at 100%)
                        const totalObjectives = scenario.learningObjectives.length;
                        const score = Math.min((userProgress.patientSimProgress.completedSteps.length / totalObjectives) * 100, 100);

                        console.log(`\n=== PROGRESS UPDATE ===`);
                        console.log(`New objectives completed this message: ${newSteps.length}`);
                        console.log(`Total objectives completed: ${userProgress.patientSimProgress.completedSteps.length}/${totalObjectives}`);
                        console.log(`Progress score: ${score.toFixed(1)}%`);

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
        }

        await chatSession.save();

        // Final summary log
        console.log(`\n=== EVALUATION SUMMARY ===`);
        console.log(`Message relevant: ${evaluationResults.relevanceCheck.isRelevant ? 'YES' : 'NO'}`);
        console.log(`Objectives completed this message: ${evaluationResults.objectiveResults.filter(r => r.completed).length}`);
        console.log(`Total objectives completed in session: ${chatSession.completedObjectives.length}`);
        console.log(`Session ID: ${sessionId}`);
        console.log(`=== END EVALUATION ===\n`);

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
async function evaluateStudentMessage(studentMessage, scenario, model, chatSession) {
    try {
        console.log(`\n--- Starting AI Evaluation Process ---`);
        console.log(`Evaluation Mode: ${chatSession.evaluationMode}`);
        console.log(`Current Step Index: ${chatSession.currentStepIndex}`);
        
        // Choose objectives based on evaluation mode
        const objectivesToEvaluate = chatSession.evaluationMode === 'specific' 
            ? getCNASteps(scenario.skillId) 
            : scenario.learningObjectives;
        
        console.log(`Total objectives to evaluate: ${objectivesToEvaluate.length}`);
        
        // Create a dynamic list of objectives for the prompt
        const objectivesList = objectivesToEvaluate.map(obj => `- "${obj}"`).join('\n');

        // Create a JSON structure for the model to fill out
        const desiredJsonFormat = {
            relevance: {
                isRelevant: "true or false",
                reason: "brief explanation of why the message is relevant or off-topic",
                redirection: "if off-topic, provide specific guidance to redirect the student to the next appropriate step"
            },
            objectives: objectivesToEvaluate.map(obj => ({
                objective: obj,
                completed: "true or false",
                evidence: "brief explanation of why this objective was or was not met by the student's message"
            }))
        };

        // Build different prompts based on evaluation mode
        let evaluationPrompt;
        
        if (chatSession.evaluationMode === 'specific') {
            const currentStepIndex = chatSession.currentStepIndex;
            const nextExpectedStep = objectivesToEvaluate[currentStepIndex];
            const completedSteps = objectivesToEvaluate.slice(0, currentStepIndex);
            const remainingSteps = objectivesToEvaluate.slice(currentStepIndex);
            
            evaluationPrompt = `
                You are evaluating a CNA student practicing the skill "${scenario.skillName}" with a patient named ${scenario.patientName}.
                
                EVALUATION MODE: SPECIFIC ORDERED STEPS
                The student must complete steps in the correct order. Steps completed out of order should be marked as NOT completed.

                Student Message: "${studentMessage}"

                STEP PROGRESSION STATUS:
                - Steps already completed (${completedSteps.length}): ${completedSteps.length > 0 ? completedSteps.map(s => `"${s}"`).join(', ') : 'None'}
                - Next expected step: "${nextExpectedStep || 'All steps completed'}"
                - Remaining steps (${remainingSteps.length}): ${remainingSteps.map(s => `"${s}"`).join(', ')}

                STEP ORDER RULES:
                1. Students MUST complete steps in the exact order listed
                2. A step can only be marked as completed if it's the next expected step OR if all previous steps are already completed
                3. If a student attempts a step out of order, mark it as NOT completed and explain the order requirement
                4. If a student completes the current expected step, they can move to the next step

                All Steps for this skill:
                ${objectivesList}

                EVALUATION TASK:
                1. First, determine if the student's message is relevant to practicing this CNA skill
                2. For EACH step, determine if the student's message demonstrates completion of that step
                3. CRITICALLY: Only mark a step as completed if it's in the correct order
                4. If the message is off-topic, provide specific redirection guidance to help the student focus on the next expected step

                REDIRECTION GUIDANCE:
                - If the student is off-topic, provide clear, helpful guidance in the "redirection" field
                - Suggest specific actions related to the next expected step: "${nextExpectedStep || 'completing the remaining steps'}"
                - Be encouraging and professional in your redirection
                - Example: "Let's focus on the next step in the procedure. You should now ${nextExpectedStep || 'continue with the remaining steps'}."

                IMPORTANT: Be consistent between your relevance reasoning and your true/false flag.

                Respond with ONLY a single JSON object in the exact format below.

                JSON Format:
                ${JSON.stringify(desiredJsonFormat, null, 2)}
            `;
        } else {
            evaluationPrompt = `
                You are evaluating a CNA student practicing the skill "${scenario.skillName}" with a patient named ${scenario.patientName}.
                
                EVALUATION MODE: BROAD OBJECTIVES
                The student can complete objectives in any order. Focus on professional standards and general skill competency.

                Student Message: "${studentMessage}"

                Learning Objectives for this skill:
                ${objectivesList}

                RELEVANCE CRITERIA:
                A message is RELEVANT if it demonstrates or attempts any of the following:
                - Professional interaction with the patient (greetings, introductions, explanations)
                - Performing or discussing steps related to the specific skill being practiced
                - Safety measures, infection control, or standard precautions
                - Addressing patient comfort, privacy, or dignity
                - Using proper medical terminology or procedures
                - Asking permission, providing explanations, or showing respect for the patient

                A message is IRRELEVANT/OFF-TOPIC if it:
                - Discusses unrelated topics (weather, sports, personal life, etc.)
                - Contains inappropriate content or language
                - Is completely unrelated to healthcare or the specific skill
                - Shows disrespect or unprofessional behavior
                - Ignores the clinical context entirely

                EVALUATION TASK:
                1. First, determine if the student's message is relevant to practicing this CNA skill using the criteria above.
                2. Second, for EACH learning objective, determine if the student's message demonstrates completion of that objective.
                3. If the message is off-topic, provide specific redirection guidance to help the student refocus on the skill

                REDIRECTION GUIDANCE:
                - If the student is off-topic, provide clear, helpful guidance in the "redirection" field
                - Suggest specific actions related to the CNA skill "${scenario.skillName}"
                - Be encouraging and professional in your redirection
                - Example: "Let's focus on practicing ${scenario.skillName}. You should start by introducing yourself to ${scenario.patientName} and explaining the procedure."

                IMPORTANT: Be consistent between your relevance reasoning and your true/false flag. If your reasoning says the message is "not relevant" or "off-topic", the isRelevant flag must be false.

                Respond with ONLY a single JSON object in the exact format below. Do not include any other text or markdown formatting.

                JSON Format:
                ${JSON.stringify(desiredJsonFormat, null, 2)}
            `;
        }

        console.log(`--- Sending evaluation request to AI model ---`);
        const result = await model.generateContent(evaluationPrompt);
        const responseText = result.response.text();
        
        console.log(`--- AI Model Response Received ---`);
        console.log(`Raw response length: ${responseText.length} characters`);
        console.log(`Raw response preview: ${responseText.substring(0, 200)}...`);
        
        let evaluation;
        try {
            // Extract JSON from the response, which might be wrapped in markdown
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                console.log(`--- JSON Successfully Extracted ---`);
                evaluation = JSON.parse(jsonMatch[0]);
                console.log(`Parsed evaluation with ${evaluation.objectives ? evaluation.objectives.length : 0} objective results`);
                
                // Validate and convert data types
                if (!evaluation.relevance || typeof evaluation.relevance !== 'object') {
                    throw new Error("Missing or invalid 'relevance' object in AI response");
                }
                
                // Convert string boolean to actual boolean
                const rawIsRelevant = evaluation.relevance.isRelevant;
                console.log(`Raw isRelevant value: "${rawIsRelevant}" (type: ${typeof rawIsRelevant})`);
                
                if (typeof rawIsRelevant === 'string') {
                    evaluation.relevance.isRelevant = rawIsRelevant.toLowerCase() === 'true';
                    console.log(`Converted string "${rawIsRelevant}" to boolean: ${evaluation.relevance.isRelevant}`);
                } else if (typeof rawIsRelevant === 'boolean') {
                    console.log(`Already boolean: ${evaluation.relevance.isRelevant}`);
                } else {
                    console.error(`Unexpected isRelevant type: ${typeof rawIsRelevant}, value: ${rawIsRelevant}`);
                    evaluation.relevance.isRelevant = true; // Safe default
                }
                
                // Validate objectives array
                if (!Array.isArray(evaluation.objectives)) {
                    throw new Error("Missing or invalid 'objectives' array in AI response");
                }
                
                // Convert objective completion flags
                evaluation.objectives.forEach((obj, index) => {
                    if (typeof obj.completed === 'string') {
                        obj.completed = obj.completed.toLowerCase() === 'true';
                        console.log(`Objective ${index}: converted "${obj.completed === true ? 'true' : 'false'}" to boolean`);
                    }
                });
                
            } else {
                throw new Error("No JSON object found in the model's response.");
            }
        } catch (parseError) {
            console.error("❌ ERROR: Failed to parse AI evaluation result:", parseError);
            console.log(`Raw response that failed to parse: ${responseText}`);
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

        // Add consistency check between reasoning and boolean flag
        console.log(`--- Relevance Consistency Check ---`);
        console.log(`Relevance flag: ${evaluation.relevance.isRelevant}`);
        console.log(`Relevance reason: "${evaluation.relevance.reason}"`);
        
        // Check for potential inconsistencies in the AI response
        const reasonLower = evaluation.relevance.reason.toLowerCase();
        const hasNegativeWords = reasonLower.includes('not relevant') || 
                                 reasonLower.includes('off-topic') || 
                                 reasonLower.includes('unrelated') ||
                                 reasonLower.includes('irrelevant') ||
                                 reasonLower.includes('inappropriate');
        
        const hasPositiveWords = reasonLower.includes('relevant') && !reasonLower.includes('not relevant') ||
                                reasonLower.includes('appropriate') ||
                                reasonLower.includes('related to');
        
        if (evaluation.relevance.isRelevant && hasNegativeWords) {
            console.log(`⚠️  INCONSISTENCY DETECTED: Flag is true but reason contains negative words`);
            console.log(`   Correcting relevance to false based on reasoning`);
            evaluation.relevance.isRelevant = false;
        } else if (!evaluation.relevance.isRelevant && hasPositiveWords && !hasNegativeWords) {
            console.log(`⚠️  INCONSISTENCY DETECTED: Flag is false but reason contains only positive words`);
            console.log(`   Correcting relevance to true based on reasoning`);
            evaluation.relevance.isRelevant = true;
        } else {
            console.log(`✅ Relevance flag and reasoning are consistent`);
        }

        // If the message is not relevant, override the objective results
        if (!evaluation.relevance.isRelevant) {
            console.log(`--- Overriding objectives due to irrelevant message ---`);
            evaluation.objectives.forEach(obj => {
                obj.completed = false;
                obj.evidence = "Message was not relevant to the skill being practiced.";
            });
        }
        
        console.log(`--- Evaluation Process Complete ---`);
        console.log(`Final relevance: ${evaluation.relevance.isRelevant}`);
        console.log(`Objectives marked as completed: ${evaluation.objectives.filter(obj => obj.completed).length}/${evaluation.objectives.length}`);

        return {
            relevanceCheck: evaluation.relevance,
            objectiveResults: evaluation.objectives
        };

    } catch (error) {
        console.error("❌ CRITICAL ERROR: Failed to evaluate student message:", error);
        console.log(`Error type: ${error.name}`);
        console.log(`Error message: ${error.message}`);
        console.log(`Falling back to default evaluation state`);
        
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