const mongoose = require('mongoose');

const UserQuizPreferencesSchema = new mongoose.Schema({
    // User identification
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    
    // Quiz composition preferences
    quizComposition: {
        // Number of questions per quiz
        questionCount: {
            type: Number,
            min: 5,
            max: 50,
            default: 30
        },
        
        // Competency area ratios (should add up to 100)
        competencyRatios: {
            physicalCareSkills: {
                type: Number,
                min: 0,
                max: 100,
                default: 64 // Default CNA exam ratio
            },
            psychosocialCareSkills: {
                type: Number,
                min: 0,
                max: 100,
                default: 10 // Default CNA exam ratio
            },
            roleOfNurseAide: {
                type: Number,
                min: 0,
                max: 100,
                default: 26 // Default CNA exam ratio
            }
        },
        
        // Specific skill category preferences within competency areas
        skillCategoryPreferences: {
            // Physical Care Skills subcategories
            physicalCareSkills: {
                activitiesOfDailyLiving: {
                    enabled: { type: Boolean, default: true },
                    weight: { type: Number, min: 0, max: 100, default: 40 }
                },
                basicNursingSkills: {
                    enabled: { type: Boolean, default: true },
                    weight: { type: Number, min: 0, max: 100, default: 40 }
                },
                restorativeSkills: {
                    enabled: { type: Boolean, default: true },
                    weight: { type: Number, min: 0, max: 100, default: 20 }
                }
            },
            
            // Psychosocial Care Skills subcategories
            psychosocialCareSkills: {
                emotionalAndMentalHealth: {
                    enabled: { type: Boolean, default: true },
                    weight: { type: Number, min: 0, max: 100, default: 70 }
                },
                spiritualAndCultural: {
                    enabled: { type: Boolean, default: true },
                    weight: { type: Number, min: 0, max: 100, default: 30 }
                }
            },
            
            // Role of Nurse Aide subcategories
            roleOfNurseAide: {
                communication: {
                    enabled: { type: Boolean, default: true },
                    weight: { type: Number, min: 0, max: 100, default: 30 }
                },
                clientRights: {
                    enabled: { type: Boolean, default: true },
                    weight: { type: Number, min: 0, max: 100, default: 25 }
                },
                legalAndEthical: {
                    enabled: { type: Boolean, default: true },
                    weight: { type: Number, min: 0, max: 100, default: 25 }
                },
                memberOfHealthcareTeam: {
                    enabled: { type: Boolean, default: true },
                    weight: { type: Number, min: 0, max: 100, default: 20 }
                }
            }
        },
        
        // Test subject focus areas
        testSubjectFocus: [{
            subject: {
                type: String,
                enum: [
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
            },
            priority: {
                type: String,
                enum: ['low', 'medium', 'high'],
                default: 'medium'
            },
            weight: {
                type: Number,
                min: 0,
                max: 100,
                default: 10
            }
        }]
    },
    
    // Difficulty preferences
    difficultySettings: {
        // Preferred difficulty level
        preferredDifficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'adaptive'],
            default: 'adaptive'
        },
        
        // Adaptive difficulty settings
        adaptiveSettings: {
            enabled: {
                type: Boolean,
                default: true
            },
            
            // Start difficulty for new users
            startingDifficulty: {
                type: String,
                enum: ['beginner', 'intermediate', 'advanced'],
                default: 'intermediate'
            },
            
            // How aggressive the difficulty adjustment is
            adaptationRate: {
                type: String,
                enum: ['conservative', 'moderate', 'aggressive'],
                default: 'moderate'
            },
            
            // Minimum accuracy to maintain current difficulty
            maintainThreshold: {
                type: Number,
                min: 50,
                max: 95,
                default: 70
            },
            
            // Accuracy needed to increase difficulty
            increaseThreshold: {
                type: Number,
                min: 70,
                max: 100,
                default: 85
            }
        }
    },
    
    // Learning preferences
    learningPreferences: {
        // Focus on weak areas
        focusOnWeakAreas: {
            type: Boolean,
            default: true
        },
        
        // Include review questions (previously answered)
        includeReviewQuestions: {
            type: Boolean,
            default: true
        },
        
        // Review question ratio (what % of quiz should be review)
        reviewQuestionRatio: {
            type: Number,
            min: 0,
            max: 50,
            default: 20
        },
        
        // Avoid recently answered questions
        avoidRecentQuestions: {
            type: Boolean,
            default: true
        },
        
        // Time frame for "recent" questions (in days)
        recentQuestionTimeframe: {
            type: Number,
            min: 1,
            max: 30,
            default: 7
        },
        
        // Prioritize questions user hasn't seen
        prioritizeNewQuestions: {
            type: Boolean,
            default: true
        },
        
        // Include spaced repetition questions
        includeSpacedRepetition: {
            type: Boolean,
            default: true
        }
    },
    
    // Saved quiz templates
    savedTemplates: [{
        name: {
            type: String,
            required: true,
            maxlength: 50
        },
        description: {
            type: String,
            maxlength: 200
        },
        settings: {
            questionCount: Number,
            competencyRatios: {
                physicalCareSkills: Number,
                psychosocialCareSkills: Number,
                roleOfNurseAide: Number
            },
            difficulty: String,
            focusAreas: [String]
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        lastUsed: Date,
        useCount: {
            type: Number,
            default: 0
        }
    }],
    
    // Quiz history and analytics preferences
    analyticsPreferences: {
        // Track detailed timing information
        trackTiming: {
            type: Boolean,
            default: true
        },
        
        // Share anonymized data for system improvement
        shareAnonymousData: {
            type: Boolean,
            default: true
        },
        
        // Receive performance insights and recommendations
        receiveInsights: {
            type: Boolean,
            default: true
        }
    },
    
    // User interface preferences
    uiPreferences: {
        // Show progress indicators during quiz
        showProgress: {
            type: Boolean,
            default: true
        },
        
        // Show timer during quiz
        showTimer: {
            type: Boolean,
            default: false
        },
        
        // Auto-advance to next question after answering
        autoAdvance: {
            type: Boolean,
            default: false
        },
        
        // Delay before auto-advancing (in seconds)
        autoAdvanceDelay: {
            type: Number,
            min: 1,
            max: 10,
            default: 3
        },
        
        // Confirm before submitting quiz
        confirmSubmission: {
            type: Boolean,
            default: true
        },
        
        // Theme preference for quiz interface
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        },
        
        // Instant grading preference
        instantGrading: {
            type: Boolean,
            default: false,
            description: 'Show immediate feedback after each question'
        }
    },
    
    // Study goals and scheduling
    studyGoals: {
        // Target number of questions per day
        dailyQuestionTarget: {
            type: Number,
            min: 1,
            max: 100,
            default: 30
        },
        
        // Target number of quizzes per week
        weeklyQuizTarget: {
            type: Number,
            min: 1,
            max: 20,
            default: 5
        },
        
        // Preferred study times
        preferredStudyTimes: [{
            dayOfWeek: {
                type: Number,
                min: 0,
                max: 6 // 0 = Sunday, 6 = Saturday
            },
            startTime: String, // Format: "HH:MM"
            endTime: String    // Format: "HH:MM"
        }],
        
        // Reminders and notifications
        notifications: {
            enabled: {
                type: Boolean,
                default: false
            },
            dailyReminder: {
                enabled: { type: Boolean, default: false },
                time: { type: String, default: "19:00" }
            },
            weeklyGoalReminder: {
                enabled: { type: Boolean, default: false },
                dayOfWeek: { type: Number, default: 0 } // Sunday
            }
        }
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
UserQuizPreferencesSchema.index({ userId: 1 });
UserQuizPreferencesSchema.index({ 'savedTemplates.name': 1 });
UserQuizPreferencesSchema.index({ 'studyGoals.notifications.enabled': 1 });

// Virtual for getting active competency ratios (normalized to 100%)
UserQuizPreferencesSchema.virtual('normalizedCompetencyRatios').get(function() {
    const ratios = this.quizComposition.competencyRatios;
    const total = ratios.physicalCareSkills + ratios.psychosocialCareSkills + ratios.roleOfNurseAide;
    
    if (total === 0) {
        // Return default ratios if all are zero
        return {
            physicalCareSkills: 64,
            psychosocialCareSkills: 10,
            roleOfNurseAide: 26
        };
    }
    
    return {
        physicalCareSkills: Math.round((ratios.physicalCareSkills / total) * 100),
        psychosocialCareSkills: Math.round((ratios.psychosocialCareSkills / total) * 100),
        roleOfNurseAide: Math.round((ratios.roleOfNurseAide / total) * 100)
    };
});

// Virtual for checking if ratios are valid
UserQuizPreferencesSchema.virtual('ratiosAreValid').get(function() {
    const ratios = this.quizComposition.competencyRatios;
    const total = ratios.physicalCareSkills + ratios.psychosocialCareSkills + ratios.roleOfNurseAide;
    return total > 0 && total <= 100;
});

// Method to calculate question distribution based on preferences
UserQuizPreferencesSchema.methods.calculateQuestionDistribution = function() {
    const questionCount = this.quizComposition.questionCount;
    const ratios = this.normalizedCompetencyRatios;
    
    return {
        physicalCareSkills: Math.round((ratios.physicalCareSkills / 100) * questionCount),
        psychosocialCareSkills: Math.round((ratios.psychosocialCareSkills / 100) * questionCount),
        roleOfNurseAide: Math.round((ratios.roleOfNurseAide / 100) * questionCount)
    };
};

// Method to add or update a saved template
UserQuizPreferencesSchema.methods.saveTemplate = function(templateData) {
    const { name, description, settings } = templateData;
    
    // Check if template with same name exists
    const existingIndex = this.savedTemplates.findIndex(t => t.name === name);
    
    const template = {
        name,
        description: description || '',
        settings,
        createdAt: existingIndex >= 0 ? this.savedTemplates[existingIndex].createdAt : new Date(),
        lastUsed: new Date(),
        useCount: existingIndex >= 0 ? this.savedTemplates[existingIndex].useCount + 1 : 1
    };
    
    if (existingIndex >= 0) {
        this.savedTemplates[existingIndex] = template;
    } else {
        this.savedTemplates.push(template);
    }
    
    return this.save();
};

// Method to use a saved template
UserQuizPreferencesSchema.methods.useTemplate = function(templateName) {
    const template = this.savedTemplates.find(t => t.name === templateName);
    
    if (!template) {
        throw new Error('Template not found');
    }
    
    // Update template usage
    template.lastUsed = new Date();
    template.useCount++;
    
    // Apply template settings to current preferences
    if (template.settings.questionCount) {
        this.quizComposition.questionCount = template.settings.questionCount;
    }
    
    if (template.settings.competencyRatios) {
        this.quizComposition.competencyRatios = template.settings.competencyRatios;
    }
    
    if (template.settings.difficulty) {
        this.difficultySettings.preferredDifficulty = template.settings.difficulty;
    }
    
    return this.save();
};

// Method to delete a saved template
UserQuizPreferencesSchema.methods.deleteTemplate = function(templateName) {
    const index = this.savedTemplates.findIndex(t => t.name === templateName);
    
    if (index >= 0) {
        this.savedTemplates.splice(index, 1);
        return this.save();
    }
    
    throw new Error('Template not found');
};

// Method to validate competency ratios
UserQuizPreferencesSchema.methods.validateRatios = function() {
    const ratios = this.quizComposition.competencyRatios;
    const total = ratios.physicalCareSkills + ratios.psychosocialCareSkills + ratios.roleOfNurseAide;
    
    const errors = [];
    
    if (total === 0) {
        errors.push('At least one competency area must have a non-zero ratio');
    }
    
    if (total > 100) {
        errors.push('Total competency ratios cannot exceed 100%');
    }
    
    if (ratios.physicalCareSkills < 0 || ratios.psychosocialCareSkills < 0 || ratios.roleOfNurseAide < 0) {
        errors.push('Competency ratios cannot be negative');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
};

// Static method to find or create preferences for a user
UserQuizPreferencesSchema.statics.findOrCreateForUser = async function(userId) {
    let preferences = await this.findOne({ userId });
    
    if (!preferences) {
        preferences = new this({
            userId,
            // All other fields will use their default values
        });
        await preferences.save();
    }
    
    return preferences;
};

// Static method to get default CNA exam template
UserQuizPreferencesSchema.statics.getCNAExamTemplate = function() {
    return {
        name: 'CNA Certification Exam',
        description: 'Standard CNA certification exam format',
        settings: {
            questionCount: 30,
            competencyRatios: {
                physicalCareSkills: 64,
                psychosocialCareSkills: 10,
                roleOfNurseAide: 26
            },
            difficulty: 'adaptive',
            focusAreas: []
        }
    };
};

// Static method to get quick practice template
UserQuizPreferencesSchema.statics.getQuickPracticeTemplate = function() {
    return {
        name: 'Quick Practice',
        description: 'Short practice quiz for daily review',
        settings: {
            questionCount: 10,
            competencyRatios: {
                physicalCareSkills: 60,
                psychosocialCareSkills: 15,
                roleOfNurseAide: 25
            },
            difficulty: 'adaptive',
            focusAreas: []
        }
    };
};

module.exports = mongoose.model('UserQuizPreferences', UserQuizPreferencesSchema);