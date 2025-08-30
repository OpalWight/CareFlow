// Skill Progress Service - Manages user skill tracking and analysis
const UserSkillProgress = require('../models/UserSkillProgress');

// CNA skill mapping based on competency areas and topics
const CNA_SKILL_MAPPING = {
    'Physical Care Skills': [
        'Hygiene and Personal Care',
        'Nutrition and Feeding',
        'Infection Control and Standard Precautions',
        'Safety and Emergency Procedures',
        'Basic Nursing Skills',
        'Mobility and Positioning',
        'Vital Signs and Measurements',
        'Basic Restorative Services'
    ],
    'Psychosocial Care Skills': [
        'Emotional Support and Mental Health',
        'Spiritual Care Needs',
        'Cultural Sensitivity and Diversity',
        'Care of Cognitively Impaired Residents',
        'End-of-Life Care'
    ],
    'Role of the Nurse Aide': [
        'Communication and Interpersonal Skills',
        'Resident Rights and Ethics',
        'Teamwork and Professional Boundaries',
        'Legal and Regulatory Requirements',
        'Documentation and Reporting',
        'Workplace Safety and Professionalism'
    ]
};

class SkillProgressService {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the service
     */
    async initialize() {
        this.initialized = true;
        console.log('✅ Skill Progress Service initialized');
    }

    /**
     * Update user skill progress based on quiz results
     * @param {string} userId - User ID
     * @param {Object} quizResult - Quiz result data
     */
    async updateSkillProgress(userId, quizResult) {
        try {
            console.log(`📊 Updating skill progress for user ${userId}`);
            
            const { questions, quizId } = quizResult;
            
            // Group questions by skill topic and competency area
            const skillPerformance = this._analyzeSkillPerformance(questions);
            
            // Update progress for each skill
            const updatePromises = [];
            
            for (const [skillKey, data] of Object.entries(skillPerformance)) {
                const [competencyArea, skillTopic] = skillKey.split('::');
                
                // Find or create skill progress record
                const skillProgress = await UserSkillProgress.findOrCreateSkill(
                    userId, 
                    skillTopic, 
                    competencyArea
                );
                
                // Update with quiz data
                updatePromises.push(
                    skillProgress.updateWithQuizData({
                        quizId,
                        questionsAnswered: data.totalQuestions,
                        correctAnswers: data.correctAnswers,
                        timeSpent: data.timeSpent,
                        averageDifficulty: data.averageDifficulty
                    })
                );
            }
            
            await Promise.all(updatePromises);
            
            console.log(`✅ Updated skill progress for ${Object.keys(skillPerformance).length} skills`);
            
        } catch (error) {
            console.error('❌ Error updating skill progress:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive skill analysis for a user
     * @param {string} userId - User ID
     * @returns {Object} Skill analysis data
     */
    async getSkillAnalysis(userId) {
        try {
            const skillSummary = await UserSkillProgress.getUserSkillSummary(userId);
            const detailedSkills = await UserSkillProgress.find({ userId })
                .sort({ 'performance.accuracy': -1 });
            
            const analysis = {
                overview: skillSummary,
                skillBreakdown: this._formatSkillBreakdown(detailedSkills),
                recommendations: this._generateRecommendations(detailedSkills),
                competencyAnalysis: this._analyzeCompetencyAreas(detailedSkills),
                learningPath: this._generateLearningPath(detailedSkills),
                achievements: this._collectAchievements(detailedSkills)
            };
            
            return analysis;
            
        } catch (error) {
            console.error('❌ Error getting skill analysis:', error);
            throw error;
        }
    }

    /**
     * Get skills that need practice for adaptive quiz generation
     * @param {string} userId - User ID
     * @param {number} limit - Maximum number of skills to return
     * @returns {Array} Skills needing practice
     */
    async getSkillsNeedingPractice(userId, limit = 5) {
        try {
            const skills = await UserSkillProgress.find({ 
                userId,
                'practiceStatus.needsPractice': true 
            })
            .sort({ 
                'practiceStatus.practiceUrgency': -1,  // Critical first
                'performance.accuracy': 1  // Lowest accuracy first
            })
            .limit(limit);
            
            return skills.map(skill => ({
                skillTopic: skill.skillTopic,
                competencyArea: skill.competencyArea,
                accuracy: skill.performance.accuracy,
                urgency: skill.practiceStatus.practiceUrgency,
                strengthLevel: skill.performance.strengthLevel
            }));
            
        } catch (error) {
            console.error('❌ Error getting skills needing practice:', error);
            return [];
        }
    }

    /**
     * Get user's strongest skills
     * @param {string} userId - User ID  
     * @param {number} limit - Maximum number of skills to return
     * @returns {Array} Strongest skills
     */
    async getStrongestSkills(userId, limit = 5) {
        try {
            const skills = await UserSkillProgress.find({ 
                userId,
                'performance.strengthLevel': { $in: ['strong', 'mastered'] }
            })
            .sort({ 'performance.accuracy': -1 })
            .limit(limit);
            
            return skills.map(skill => ({
                skillTopic: skill.skillTopic,
                competencyArea: skill.competencyArea,
                accuracy: skill.performance.accuracy,
                strengthLevel: skill.performance.strengthLevel
            }));
            
        } catch (error) {
            console.error('❌ Error getting strongest skills:', error);
            return [];
        }
    }

    /**
     * Get learning recommendations for a user
     * @param {string} userId - User ID
     * @returns {Object} Learning recommendations
     */
    async getRecommendations(userId) {
        try {
            const skills = await UserSkillProgress.find({ userId })
                .sort({ 'performance.accuracy': 1 });  // Weakest first
            
            return this._generateRecommendations(skills);
            
        } catch (error) {
            console.error('❌ Error getting recommendations:', error);
            throw error;
        }
    }

    /**
     * Get skill progress trends for a user
     * @param {string} userId - User ID
     * @param {number} days - Number of days to analyze
     * @returns {Object} Progress trends
     */
    async getProgressTrends(userId, days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            const skills = await UserSkillProgress.find({ 
                userId,
                lastUpdated: { $gte: cutoffDate }
            });
            
            const trends = {
                improving: skills.filter(s => s.performance.trend === 'improving').length,
                stable: skills.filter(s => s.performance.trend === 'stable').length,
                declining: skills.filter(s => s.performance.trend === 'declining').length,
                totalActiveSkills: skills.length,
                skillsByStrength: {
                    mastered: skills.filter(s => s.performance.strengthLevel === 'mastered').length,
                    strong: skills.filter(s => s.performance.strengthLevel === 'strong').length,
                    developing: skills.filter(s => s.performance.strengthLevel === 'developing').length,
                    weak: skills.filter(s => s.performance.strengthLevel === 'weak').length
                }
            };
            
            return trends;
            
        } catch (error) {
            console.error('❌ Error getting progress trends:', error);
            throw error;
        }
    }

    // Private helper methods

    /**
     * Validate and sanitize difficulty values
     */
    _validateDifficulty(difficulty) {
        const validDifficulties = ['beginner', 'intermediate', 'advanced'];
        
        // Direct match
        if (validDifficulties.includes(difficulty)) {
            return difficulty;
        }
        
        // Map common alternative values
        const difficultyMap = {
            'easy': 'beginner',
            'basic': 'beginner',
            'simple': 'beginner',
            'medium': 'intermediate',
            'normal': 'intermediate',
            'standard': 'intermediate',
            'hard': 'advanced',
            'difficult': 'advanced',
            'expert': 'advanced'
        };
        
        const lowerDifficulty = difficulty?.toLowerCase();
        if (difficultyMap[lowerDifficulty]) {
            return difficultyMap[lowerDifficulty];
        }
        
        // Default fallback
        return 'intermediate';
    }

    /**
     * Analyze skill performance from quiz questions
     */
    _analyzeSkillPerformance(questions) {
        const skillPerformance = {};
        
        questions.forEach(question => {
            const competencyArea = question.competencyArea;
            const skillTopic = question.skillTopic || this._inferSkillTopic(question.question, competencyArea);
            const skillKey = `${competencyArea}::${skillTopic}`;
            
            if (!skillPerformance[skillKey]) {
                skillPerformance[skillKey] = {
                    totalQuestions: 0,
                    correctAnswers: 0,
                    timeSpent: 0,
                    difficulties: []
                };
            }
            
            skillPerformance[skillKey].totalQuestions++;
            if (question.isCorrect) {
                skillPerformance[skillKey].correctAnswers++;
            }
            
            // Add difficulty tracking if available
            if (question.difficulty) {
                const validatedDifficulty = this._validateDifficulty(question.difficulty);
                skillPerformance[skillKey].difficulties.push(validatedDifficulty);
            }
        });
        
        // Calculate average difficulty for each skill
        Object.keys(skillPerformance).forEach(skillKey => {
            const data = skillPerformance[skillKey];
            if (data.difficulties.length > 0) {
                const difficultyMap = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
                const avgDifficultyNum = data.difficulties.reduce((sum, diff) => 
                    sum + (difficultyMap[diff] || 2), 0) / data.difficulties.length;
                
                if (avgDifficultyNum <= 1.3) data.averageDifficulty = 'beginner';
                else if (avgDifficultyNum <= 2.3) data.averageDifficulty = 'intermediate';
                else data.averageDifficulty = 'advanced';
            } else {
                data.averageDifficulty = 'intermediate';
            }
        });
        
        return skillPerformance;
    }

    /**
     * Infer skill topic from question content when not explicitly provided
     */
    _inferSkillTopic(questionText, competencyArea) {
        const skillTopics = CNA_SKILL_MAPPING[competencyArea] || [];
        const questionLower = questionText.toLowerCase();
        
        // Simple keyword matching to infer skill topic
        for (const skill of skillTopics) {
            const skillKeywords = skill.toLowerCase().split(' ');
            if (skillKeywords.some(keyword => questionLower.includes(keyword))) {
                return skill;
            }
        }
        
        // Default to first skill in competency area if no match
        return skillTopics[0] || 'General Skills';
    }

    /**
     * Format skill breakdown for user interface
     */
    _formatSkillBreakdown(skills) {
        const breakdown = {};
        
        skills.forEach(skill => {
            if (!breakdown[skill.competencyArea]) {
                breakdown[skill.competencyArea] = [];
            }
            
            breakdown[skill.competencyArea].push({
                skillTopic: skill.skillTopic,
                accuracy: skill.performance.accuracy,
                strengthLevel: skill.performance.strengthLevel,
                trend: skill.performance.trend,
                confidenceLevel: skill.performance.confidenceLevel,
                totalQuestions: skill.performance.totalQuestions,
                lastUpdated: skill.lastUpdated
            });
        });
        
        return breakdown;
    }

    /**
     * Generate personalized learning recommendations
     */
    _generateRecommendations(skills) {
        const recommendations = {
            immediate: [],
            shortTerm: [],
            longTerm: [],
            priority: 'medium'
        };
        
        // Sort skills by urgency and accuracy
        const criticalSkills = skills.filter(s => s.practiceStatus.practiceUrgency === 'critical');
        const weakSkills = skills.filter(s => s.performance.strengthLevel === 'weak');
        const decliningSkills = skills.filter(s => s.performance.trend === 'declining');
        
        // Immediate recommendations (critical issues)
        criticalSkills.forEach(skill => {
            recommendations.immediate.push({
                type: 'skill_practice',
                skillTopic: skill.skillTopic,
                reason: 'Critical skill deficiency detected',
                action: `Focus on ${skill.skillTopic} fundamentals`,
                urgency: 'high'
            });
        });
        
        // Short-term recommendations (weak skills)
        weakSkills.slice(0, 3).forEach(skill => {
            recommendations.shortTerm.push({
                type: 'skill_improvement',
                skillTopic: skill.skillTopic,
                reason: 'Below proficiency threshold',
                action: `Practice ${skill.skillTopic} scenarios`,
                urgency: 'medium'
            });
        });
        
        // Long-term recommendations (declining skills)
        decliningSkills.slice(0, 2).forEach(skill => {
            recommendations.longTerm.push({
                type: 'skill_maintenance',
                skillTopic: skill.skillTopic,
                reason: 'Performance declining over time',
                action: `Review and reinforce ${skill.skillTopic}`,
                urgency: 'low'
            });
        });
        
        // Set overall priority
        if (criticalSkills.length > 0) {
            recommendations.priority = 'high';
        } else if (weakSkills.length > 2) {
            recommendations.priority = 'medium';
        } else {
            recommendations.priority = 'low';
        }
        
        return recommendations;
    }

    /**
     * Analyze competency areas (Physical Care, Psychosocial, Role of Nurse Aide)
     */
    _analyzeCompetencyAreas(skills) {
        const competencyAnalysis = {};
        
        Object.keys(CNA_SKILL_MAPPING).forEach(competency => {
            const competencySkills = skills.filter(s => s.competencyArea === competency);
            
            if (competencySkills.length > 0) {
                const avgAccuracy = competencySkills.reduce((sum, s) => sum + s.performance.accuracy, 0) / competencySkills.length;
                const masteredCount = competencySkills.filter(s => s.performance.strengthLevel === 'mastered').length;
                const strongCount = competencySkills.filter(s => s.performance.strengthLevel === 'strong').length;
                
                competencyAnalysis[competency] = {
                    averageAccuracy: Math.round(avgAccuracy),
                    totalSkills: competencySkills.length,
                    masteredSkills: masteredCount,
                    strongSkills: strongCount,
                    masteryLevel: this._calculateMasteryLevel(avgAccuracy, masteredCount, competencySkills.length),
                    needsWork: competencySkills.filter(s => s.performance.strengthLevel === 'weak').length
                };
            } else {
                competencyAnalysis[competency] = {
                    averageAccuracy: 0,
                    totalSkills: 0,
                    masteredSkills: 0,
                    strongSkills: 0,
                    masteryLevel: 'beginner',
                    needsWork: 0
                };
            }
        });
        
        return competencyAnalysis;
    }

    /**
     * Calculate mastery level for competency area
     */
    _calculateMasteryLevel(avgAccuracy, masteredCount, totalSkills) {
        const masteryRatio = masteredCount / totalSkills;
        
        if (avgAccuracy >= 90 && masteryRatio >= 0.8) {
            return 'expert';
        } else if (avgAccuracy >= 80 && masteryRatio >= 0.5) {
            return 'proficient';
        } else if (avgAccuracy >= 70) {
            return 'competent';
        } else if (avgAccuracy >= 60) {
            return 'developing';
        } else {
            return 'beginner';
        }
    }

    /**
     * Generate personalized learning path
     */
    _generateLearningPath(skills) {
        const weakSkills = skills.filter(s => s.performance.strengthLevel === 'weak')
                                .sort((a, b) => a.performance.accuracy - b.performance.accuracy);
        
        const developingSkills = skills.filter(s => s.performance.strengthLevel === 'developing')
                                      .sort((a, b) => a.performance.accuracy - b.performance.accuracy);
        
        return {
            phase1: {
                title: 'Foundation Building',
                skills: weakSkills.slice(0, 3).map(s => s.skillTopic),
                duration: '2-4 weeks',
                focus: 'Master fundamental concepts'
            },
            phase2: {
                title: 'Skill Development',
                skills: developingSkills.slice(0, 4).map(s => s.skillTopic),
                duration: '4-6 weeks',
                focus: 'Build proficiency through practice'
            },
            phase3: {
                title: 'Mastery & Maintenance',
                skills: skills.filter(s => s.performance.strengthLevel === 'strong')
                             .slice(0, 3).map(s => s.skillTopic),
                duration: 'Ongoing',
                focus: 'Maintain and refine skills'
            }
        };
    }

    /**
     * Collect achievements from all skills
     */
    _collectAchievements(skills) {
        const allAchievements = [];
        
        skills.forEach(skill => {
            skill.milestones.forEach(milestone => {
                allAchievements.push({
                    skillTopic: skill.skillTopic,
                    type: milestone.type,
                    achievedAt: milestone.achievedAt,
                    details: milestone.details,
                    accuracyAtTime: milestone.accuracyAtTime
                });
            });
        });
        
        // Sort by most recent first
        return allAchievements.sort((a, b) => b.achievedAt - a.achievedAt).slice(0, 20);
    }
}

module.exports = SkillProgressService;