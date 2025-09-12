// Quiz Preferences Controller - Manage user quiz customization settings
const UserQuizPreferences = require('../models/UserQuizPreferences');
const QuestionBank = require('../models/QuestionBank');

/**
 * Get user's quiz preferences
 */
exports.getUserPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const preferences = await UserQuizPreferences.findOrCreateForUser(userId);
        
        res.json({
            preferences: {
                userId: preferences.userId,
                quizComposition: preferences.quizComposition,
                difficultySettings: preferences.difficultySettings,
                learningPreferences: preferences.learningPreferences,
                savedTemplates: preferences.savedTemplates,
                uiPreferences: preferences.uiPreferences,
                studyGoals: preferences.studyGoals
            },
            normalizedRatios: preferences.normalizedCompetencyRatios,
            calculatedDistribution: preferences.calculateQuestionDistribution()
        });
        
    } catch (error) {
        console.error('❌ Error getting user preferences:', error);
        res.status(500).json({
            message: 'Error retrieving user preferences',
            error: 'PREFERENCES_RETRIEVAL_FAILED'
        });
    }
};

/**
 * Update user's quiz preferences
 */
exports.updateUserPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;
        
        const preferences = await UserQuizPreferences.findOrCreateForUser(userId);
        
        // Update each section if provided
        if (updates.quizComposition) {
            // Validate question count
            if (updates.quizComposition.questionCount) {
                const count = updates.quizComposition.questionCount;
                if (count < 5 || count > 50) {
                    return res.status(400).json({
                        message: 'Question count must be between 5 and 50',
                        error: 'INVALID_QUESTION_COUNT'
                    });
                }
                preferences.quizComposition.questionCount = count;
            }
            
            // Validate and update competency ratios
            if (updates.quizComposition.competencyRatios) {
                const ratios = updates.quizComposition.competencyRatios;
                
                // Validate ratios
                const total = (ratios.physicalCareSkills || 0) + 
                             (ratios.psychosocialCareSkills || 0) + 
                             (ratios.roleOfNurseAide || 0);
                             
                if (total <= 0 || total > 100) {
                    return res.status(400).json({
                        message: 'Competency ratios must be positive and not exceed 100%',
                        error: 'INVALID_COMPETENCY_RATIOS',
                        details: { total, ratios }
                    });
                }
                
                preferences.quizComposition.competencyRatios = ratios;
            }
            
            // Update skill category preferences
            if (updates.quizComposition.skillCategoryPreferences) {
                preferences.quizComposition.skillCategoryPreferences = {
                    ...preferences.quizComposition.skillCategoryPreferences,
                    ...updates.quizComposition.skillCategoryPreferences
                };
            }
            
            // Update test subject focus
            if (updates.quizComposition.testSubjectFocus) {
                preferences.quizComposition.testSubjectFocus = updates.quizComposition.testSubjectFocus;
            }
        }
        
        // Update difficulty settings
        if (updates.difficultySettings) {
            preferences.difficultySettings = {
                ...preferences.difficultySettings,
                ...updates.difficultySettings
            };
        }
        
        // Update learning preferences
        if (updates.learningPreferences) {
            preferences.learningPreferences = {
                ...preferences.learningPreferences,
                ...updates.learningPreferences
            };
        }
        
        // Update UI preferences
        if (updates.uiPreferences) {
            preferences.uiPreferences = {
                ...preferences.uiPreferences,
                ...updates.uiPreferences
            };
        }
        
        // Update study goals
        if (updates.studyGoals) {
            preferences.studyGoals = {
                ...preferences.studyGoals,
                ...updates.studyGoals
            };
        }
        
        // Validate final ratios
        const validation = preferences.validateRatios();
        if (!validation.valid) {
            return res.status(400).json({
                message: 'Invalid preference configuration',
                error: 'VALIDATION_FAILED',
                validationErrors: validation.errors
            });
        }
        
        await preferences.save();
        
        res.json({
            message: 'Preferences updated successfully',
            preferences: {
                userId: preferences.userId,
                quizComposition: preferences.quizComposition,
                difficultySettings: preferences.difficultySettings,
                learningPreferences: preferences.learningPreferences,
                uiPreferences: preferences.uiPreferences,
                studyGoals: preferences.studyGoals
            },
            normalizedRatios: preferences.normalizedCompetencyRatios,
            calculatedDistribution: preferences.calculateQuestionDistribution()
        });
        
    } catch (error) {
        console.error('❌ Error updating user preferences:', error);
        res.status(500).json({
            message: 'Error updating user preferences',
            error: 'PREFERENCES_UPDATE_FAILED'
        });
    }
};

/**
 * Reset user preferences to default
 */
exports.resetUserPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Delete existing preferences to trigger default creation
        await UserQuizPreferences.deleteOne({ userId });
        
        // Create new default preferences
        const preferences = await UserQuizPreferences.findOrCreateForUser(userId);
        
        res.json({
            message: 'Preferences reset to default',
            preferences: {
                userId: preferences.userId,
                quizComposition: preferences.quizComposition,
                difficultySettings: preferences.difficultySettings,
                learningPreferences: preferences.learningPreferences,
                uiPreferences: preferences.uiPreferences,
                studyGoals: preferences.studyGoals
            },
            normalizedRatios: preferences.normalizedCompetencyRatios,
            calculatedDistribution: preferences.calculateQuestionDistribution()
        });
        
    } catch (error) {
        console.error('❌ Error resetting user preferences:', error);
        res.status(500).json({
            message: 'Error resetting user preferences',
            error: 'PREFERENCES_RESET_FAILED'
        });
    }
};

/**
 * Save a quiz template
 */
exports.saveQuizTemplate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, settings } = req.body;
        
        if (!name || !settings) {
            return res.status(400).json({
                message: 'Template name and settings are required',
                error: 'MISSING_REQUIRED_FIELDS'
            });
        }
        
        if (name.length > 50) {
            return res.status(400).json({
                message: 'Template name must be 50 characters or less',
                error: 'TEMPLATE_NAME_TOO_LONG'
            });
        }
        
        const preferences = await UserQuizPreferences.findOrCreateForUser(userId);
        
        await preferences.saveTemplate({
            name: name.trim(),
            description: description?.trim() || '',
            settings
        });
        
        res.json({
            message: 'Template saved successfully',
            template: {
                name: name.trim(),
                description: description?.trim() || '',
                settings
            }
        });
        
    } catch (error) {
        console.error('❌ Error saving quiz template:', error);
        res.status(500).json({
            message: 'Error saving quiz template',
            error: 'TEMPLATE_SAVE_FAILED'
        });
    }
};

/**
 * Get user's saved quiz templates
 */
exports.getQuizTemplates = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const preferences = await UserQuizPreferences.findOrCreateForUser(userId);
        
        // Add default templates
        const defaultTemplates = [
            UserQuizPreferences.getCNAExamTemplate(),
            UserQuizPreferences.getQuickPracticeTemplate()
        ];
        
        res.json({
            templates: {
                default: defaultTemplates,
                custom: preferences.savedTemplates.sort((a, b) => b.lastUsed - a.lastUsed)
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting quiz templates:', error);
        res.status(500).json({
            message: 'Error retrieving quiz templates',
            error: 'TEMPLATES_RETRIEVAL_FAILED'
        });
    }
};

/**
 * Use a saved quiz template
 */
exports.useQuizTemplate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { templateName } = req.params;
        
        if (!templateName) {
            return res.status(400).json({
                message: 'Template name is required',
                error: 'MISSING_TEMPLATE_NAME'
            });
        }
        
        const preferences = await UserQuizPreferences.findOrCreateForUser(userId);
        
        // Check for default templates first
        const defaultTemplates = {
            'CNA Certification Exam': UserQuizPreferences.getCNAExamTemplate(),
            'Quick Practice': UserQuizPreferences.getQuickPracticeTemplate()
        };
        
        if (defaultTemplates[templateName]) {
            const template = defaultTemplates[templateName];
            
            // Apply template settings
            if (template.settings.questionCount) {
                preferences.quizComposition.questionCount = template.settings.questionCount;
            }
            if (template.settings.competencyRatios) {
                preferences.quizComposition.competencyRatios = template.settings.competencyRatios;
            }
            if (template.settings.difficulty) {
                preferences.difficultySettings.preferredDifficulty = template.settings.difficulty;
            }
            
            await preferences.save();
            
            return res.json({
                message: `Applied ${templateName} template`,
                appliedSettings: template.settings,
                updatedPreferences: {
                    quizComposition: preferences.quizComposition,
                    difficultySettings: preferences.difficultySettings
                }
            });
        }
        
        // Use custom template
        await preferences.useTemplate(templateName);
        
        res.json({
            message: `Applied template: ${templateName}`,
            updatedPreferences: {
                quizComposition: preferences.quizComposition,
                difficultySettings: preferences.difficultySettings
            }
        });
        
    } catch (error) {
        console.error('❌ Error using quiz template:', error);
        
        if (error.message === 'Template not found') {
            return res.status(404).json({
                message: 'Template not found',
                error: 'TEMPLATE_NOT_FOUND'
            });
        }
        
        res.status(500).json({
            message: 'Error applying quiz template',
            error: 'TEMPLATE_USE_FAILED'
        });
    }
};

/**
 * Delete a saved quiz template
 */
exports.deleteQuizTemplate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { templateName } = req.params;
        
        if (!templateName) {
            return res.status(400).json({
                message: 'Template name is required',
                error: 'MISSING_TEMPLATE_NAME'
            });
        }
        
        const preferences = await UserQuizPreferences.findOrCreateForUser(userId);
        
        await preferences.deleteTemplate(templateName);
        
        res.json({
            message: `Template "${templateName}" deleted successfully`
        });
        
    } catch (error) {
        console.error('❌ Error deleting quiz template:', error);
        
        if (error.message === 'Template not found') {
            return res.status(404).json({
                message: 'Template not found',
                error: 'TEMPLATE_NOT_FOUND'
            });
        }
        
        res.status(500).json({
            message: 'Error deleting quiz template',
            error: 'TEMPLATE_DELETE_FAILED'
        });
    }
};

/**
 * Get available customization options
 */
exports.getCustomizationOptions = async (req, res) => {
    try {
        // Get question pool statistics to show availability
        const poolStats = await QuestionBank.getPoolStats();
        
        // Define available options
        const options = {
            questionCount: {
                min: 5,
                max: 50,
                default: 30,
                step: 1
            },
            competencyAreas: {
                'Physical Care Skills': {
                    key: 'physicalCareSkills',
                    categories: [
                        'Activities of Daily Living',
                        'Basic Nursing Skills',
                        'Restorative Skills'
                    ],
                    defaultPercentage: 64,
                    availableQuestions: poolStats.competencyDistribution['Physical Care Skills']?.count || 0
                },
                'Psychosocial Care Skills': {
                    key: 'psychosocialCareSkills',
                    categories: [
                        'Emotional and Mental Health Needs',
                        'Spiritual and Cultural Needs'
                    ],
                    defaultPercentage: 10,
                    availableQuestions: poolStats.competencyDistribution['Psychosocial Care Skills']?.count || 0
                },
                'Role of the Nurse Aide': {
                    key: 'roleOfNurseAide',
                    categories: [
                        'Communication',
                        'Client Rights',
                        'Legal and Ethical Behavior',
                        'Member of the Health Care Team'
                    ],
                    defaultPercentage: 26,
                    availableQuestions: poolStats.competencyDistribution['Role of the Nurse Aide']?.count || 0
                }
            },
            difficulties: ['beginner', 'intermediate', 'advanced', 'adaptive'],
            testSubjects: [
                'Resident care and daily living activities',
                'Infection control',
                'Safety and emergency procedures',
                'Communication and interpersonal skills',
                'Legal/ethical principles',
                'Resident\'s rights',
                'Mental health and social service needs',
                'Personal care skills',
                'Data collection/reporting'
            ]
        };
        
        res.json({
            options,
            poolStatistics: {
                totalQuestions: poolStats.totalActiveQuestions,
                distribution: poolStats.competencyDistribution,
                recommendations: poolStats.recommendations || []
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting customization options:', error);
        res.status(500).json({
            message: 'Error retrieving customization options',
            error: 'OPTIONS_RETRIEVAL_FAILED'
        });
    }
};

/**
 * Generate a quick custom quiz without saving preferences
 */
exports.generateCustomQuiz = async (req, res) => {
    try {
        const userId = req.user.id;
        const customSettings = req.body;
        
        // Validate custom settings
        if (customSettings.questionCount && (customSettings.questionCount < 5 || customSettings.questionCount > 50)) {
            return res.status(400).json({
                message: 'Question count must be between 5 and 50',
                error: 'INVALID_QUESTION_COUNT'
            });
        }
        
        if (customSettings.competencyRatios) {
            const total = Object.values(customSettings.competencyRatios).reduce((sum, val) => sum + (val || 0), 0);
            if (total <= 0 || total > 100) {
                return res.status(400).json({
                    message: 'Competency ratios must be positive and not exceed 100%',
                    error: 'INVALID_COMPETENCY_RATIOS'
                });
            }
        }
        
        // Create temporary preferences object
        const tempPrefs = {
            quizComposition: {
                questionCount: customSettings.questionCount || 30,
                competencyRatios: customSettings.competencyRatios || {
                    physicalCareSkills: 64,
                    psychosocialCareSkills: 10,
                    roleOfNurseAide: 26
                }
            },
            difficultySettings: {
                preferredDifficulty: customSettings.difficulty || 'adaptive'
            },
            learningPreferences: {
                focusOnWeakAreas: customSettings.focusOnWeakAreas !== false,
                includeReviewQuestions: customSettings.includeReviewQuestions !== false,
                avoidRecentQuestions: customSettings.avoidRecentQuestions !== false
            },
            calculateQuestionDistribution() {
                const questionCount = this.quizComposition.questionCount;
                const ratios = this.quizComposition.competencyRatios;
                const total = ratios.physicalCareSkills + ratios.psychosocialCareSkills + ratios.roleOfNurseAide;
                
                if (total === 0) {
                    return { physicalCareSkills: 0, psychosocialCareSkills: 0, roleOfNurseAide: 0 };
                }
                
                return {
                    physicalCareSkills: Math.round((ratios.physicalCareSkills / total) * questionCount),
                    psychosocialCareSkills: Math.round((ratios.psychosocialCareSkills / total) * questionCount),
                    roleOfNurseAide: Math.round((ratios.roleOfNurseAide / total) * questionCount)
                };
            }
        };
        
        // Forward to quiz generation with custom preferences
        req.body = tempPrefs;
        
        // Import and call quiz generation function
        const quizController = require('./quizController');
        return await quizController.generateQuizQuestions(req, res);
        
    } catch (error) {
        console.error('❌ Error generating custom quiz:', error);
        res.status(500).json({
            message: 'Error generating custom quiz',
            error: 'CUSTOM_QUIZ_GENERATION_FAILED'
        });
    }
};

module.exports = {
    getUserPreferences: exports.getUserPreferences,
    updateUserPreferences: exports.updateUserPreferences,
    resetUserPreferences: exports.resetUserPreferences,
    saveQuizTemplate: exports.saveQuizTemplate,
    getQuizTemplates: exports.getQuizTemplates,
    useQuizTemplate: exports.useQuizTemplate,
    deleteQuizTemplate: exports.deleteQuizTemplate,
    getCustomizationOptions: exports.getCustomizationOptions,
    generateCustomQuiz: exports.generateCustomQuiz
};