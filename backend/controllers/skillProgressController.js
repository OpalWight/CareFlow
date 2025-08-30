const SkillProgressService = require('../services/skillProgressService');
const UserSkillProgress = require('../models/UserSkillProgress');

// Initialize service
let skillProgressService = null;

const initializeService = async () => {
    if (!skillProgressService) {
        skillProgressService = new SkillProgressService();
        try {
            await skillProgressService.initialize();
            console.log('✅ Skill Progress Service ready in controller');
        } catch (error) {
            console.warn('⚠️ Skill Progress Service initialization failed:', error.message);
        }
    }
    return skillProgressService;
};

/**
 * Get comprehensive skill analysis for a user
 */
exports.getSkillAnalysis = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const service = await initializeService();
        if (!service || !service.initialized) {
            return res.status(503).json({ message: 'Skill progress service unavailable' });
        }
        
        const analysis = await service.getSkillAnalysis(userId);
        
        res.json({
            userId,
            analysis,
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error getting skill analysis:', error);
        res.status(500).json({ 
            message: 'Error retrieving skill analysis',
            error: error.message 
        });
    }
};

/**
 * Get skills that need practice for adaptive learning
 */
exports.getSkillsNeedingPractice = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 5 } = req.query;
        
        const service = await initializeService();
        if (!service) {
            // Fallback: get directly from database
            const skills = await UserSkillProgress.find({ 
                userId,
                'practiceStatus.needsPractice': true 
            })
            .sort({ 
                'practiceStatus.practiceUrgency': -1,
                'performance.accuracy': 1 
            })
            .limit(parseInt(limit));
            
            const formattedSkills = skills.map(skill => ({
                skillTopic: skill.skillTopic,
                competencyArea: skill.competencyArea,
                accuracy: skill.performance.accuracy,
                urgency: skill.practiceStatus.practiceUrgency,
                strengthLevel: skill.performance.strengthLevel
            }));
            
            return res.json({ skills: formattedSkills });
        }
        
        const skills = await service.getSkillsNeedingPractice(userId, parseInt(limit));
        
        res.json({
            skills,
            totalCount: skills.length,
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error getting skills needing practice:', error);
        res.status(500).json({ 
            message: 'Error retrieving skills needing practice',
            error: error.message 
        });
    }
};

/**
 * Get user's strongest skills
 */
exports.getStrongestSkills = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 5 } = req.query;
        
        const service = await initializeService();
        if (!service) {
            // Fallback: get directly from database
            const skills = await UserSkillProgress.find({ 
                userId,
                'performance.strengthLevel': { $in: ['strong', 'mastered'] }
            })
            .sort({ 'performance.accuracy': -1 })
            .limit(parseInt(limit));
            
            const formattedSkills = skills.map(skill => ({
                skillTopic: skill.skillTopic,
                competencyArea: skill.competencyArea,
                accuracy: skill.performance.accuracy,
                strengthLevel: skill.performance.strengthLevel
            }));
            
            return res.json({ skills: formattedSkills });
        }
        
        const skills = await service.getStrongestSkills(userId, parseInt(limit));
        
        res.json({
            skills,
            totalCount: skills.length,
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error getting strongest skills:', error);
        res.status(500).json({ 
            message: 'Error retrieving strongest skills',
            error: error.message 
        });
    }
};

/**
 * Get learning recommendations for a user
 */
exports.getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const service = await initializeService();
        if (!service || !service.initialized) {
            return res.status(503).json({ message: 'Skill progress service unavailable' });
        }
        
        const recommendations = await service.getRecommendations(userId);
        
        res.json({
            userId,
            recommendations,
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error getting recommendations:', error);
        res.status(500).json({ 
            message: 'Error retrieving recommendations',
            error: error.message 
        });
    }
};

/**
 * Get skill progress trends
 */
exports.getProgressTrends = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 30 } = req.query;
        
        const service = await initializeService();
        if (!service || !service.initialized) {
            return res.status(503).json({ message: 'Skill progress service unavailable' });
        }
        
        const trends = await service.getProgressTrends(userId, parseInt(days));
        
        res.json({
            userId,
            trends,
            periodDays: parseInt(days),
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error getting progress trends:', error);
        res.status(500).json({ 
            message: 'Error retrieving progress trends',
            error: error.message 
        });
    }
};

/**
 * Get detailed skill information for a specific skill
 */
exports.getSkillDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { skillTopic } = req.params;
        
        const skill = await UserSkillProgress.findOne({ userId, skillTopic });
        
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found for this user' });
        }
        
        res.json({
            userId,
            skillTopic: skill.skillTopic,
            competencyArea: skill.competencyArea,
            performance: skill.performance,
            recentHistory: skill.quizHistory.slice(-10), // Last 10 quiz attempts
            learningInsights: skill.learningInsights,
            milestones: skill.milestones.sort((a, b) => b.achievedAt - a.achievedAt),
            practiceStatus: skill.practiceStatus,
            lastUpdated: skill.lastUpdated,
            firstEncountered: skill.firstEncountered
        });
        
    } catch (error) {
        console.error('❌ Error getting skill details:', error);
        res.status(500).json({ 
            message: 'Error retrieving skill details',
            error: error.message 
        });
    }
};

/**
 * Get user's skill dashboard data (overview)
 */
exports.getSkillDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get skill summary from database
        const skillSummary = await UserSkillProgress.getUserSkillSummary(userId);
        
        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentActivity = await UserSkillProgress.find({
            userId,
            lastUpdated: { $gte: thirtyDaysAgo }
        }).sort({ lastUpdated: -1 }).limit(10);
        
        // Get recent milestones
        const allSkills = await UserSkillProgress.find({ userId });
        const recentMilestones = [];
        
        allSkills.forEach(skill => {
            skill.milestones.forEach(milestone => {
                recentMilestones.push({
                    skillTopic: skill.skillTopic,
                    type: milestone.type,
                    achievedAt: milestone.achievedAt,
                    details: milestone.details,
                    accuracyAtTime: milestone.accuracyAtTime
                });
            });
        });
        
        // Sort milestones by date and get recent ones
        recentMilestones.sort((a, b) => b.achievedAt - a.achievedAt);
        
        res.json({
            userId,
            summary: skillSummary,
            recentActivity: recentActivity.map(skill => ({
                skillTopic: skill.skillTopic,
                competencyArea: skill.competencyArea,
                accuracy: skill.performance.accuracy,
                strengthLevel: skill.performance.strengthLevel,
                trend: skill.performance.trend,
                lastUpdated: skill.lastUpdated
            })),
            recentMilestones: recentMilestones.slice(0, 5),
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error getting skill dashboard:', error);
        res.status(500).json({ 
            message: 'Error retrieving skill dashboard',
            error: error.message 
        });
    }
};

/**
 * Get competency area breakdown
 */
exports.getCompetencyBreakdown = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const skills = await UserSkillProgress.find({ userId });
        
        const competencyAreas = {
            'Physical Care Skills': {
                skills: [],
                averageAccuracy: 0,
                masteredCount: 0,
                totalSkills: 0
            },
            'Psychosocial Care Skills': {
                skills: [],
                averageAccuracy: 0,
                masteredCount: 0,
                totalSkills: 0
            },
            'Role of the Nurse Aide': {
                skills: [],
                averageAccuracy: 0,
                masteredCount: 0,
                totalSkills: 0
            }
        };
        
        // Group skills by competency area
        skills.forEach(skill => {
            const area = competencyAreas[skill.competencyArea];
            if (area) {
                area.skills.push({
                    skillTopic: skill.skillTopic,
                    accuracy: skill.performance.accuracy,
                    strengthLevel: skill.performance.strengthLevel,
                    trend: skill.performance.trend
                });
                area.totalSkills++;
                if (skill.performance.strengthLevel === 'mastered') {
                    area.masteredCount++;
                }
            }
        });
        
        // Calculate averages
        Object.keys(competencyAreas).forEach(areaName => {
            const area = competencyAreas[areaName];
            if (area.totalSkills > 0) {
                area.averageAccuracy = Math.round(
                    area.skills.reduce((sum, skill) => sum + skill.accuracy, 0) / area.totalSkills
                );
            }
            area.masteryPercentage = area.totalSkills > 0 ? 
                Math.round((area.masteredCount / area.totalSkills) * 100) : 0;
        });
        
        res.json({
            userId,
            competencyAreas,
            totalSkillsTracked: skills.length,
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error getting competency breakdown:', error);
        res.status(500).json({ 
            message: 'Error retrieving competency breakdown',
            error: error.message 
        });
    }
};