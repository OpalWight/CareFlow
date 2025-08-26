import React, { useState, useEffect } from 'react';
import { useAuth } from '../api/AuthContext';
import Layout from '../components/Layout';
import progressService from '../api/progressService';
import '../styles/LearnerHomeFinal.css';

function LearnerHomeFinal(){
    const {user, isAuthenticated} = useAuth();
    const [openDropdowns, setOpenDropdowns] = useState({});
    const [allLessonsOpen, setAllLessonsOpen] = useState(false);
    const [progressSummary, setProgressSummary] = useState(null);

    const allSkills = [
        'Hand Hygiene (Hand Washing)',
        'Donning and Removing PPE (Gown and Gloves)',
        'Applies One Knee-High Elastic Stocking',
        'Assists with Use of Bedpan',
        'Cleans Upper or Lower Denture',
        'Dresses Client with Affected (Weak) Right Arm',
        'Feeds Client Who Cannot Feed Self',
        'Gives Modified Bed Bath (Face and One Arm, Hand, and Underarm/Armpit)',
        'Provides Catheter Care for Female',
        'Provides Foot Care on One Foot',
        'Provides Mouth Care',
        'Provides Perineal Care for Female',
        'Assists to Ambulate Using Transfer Belt',
        'Positions Resident on One Side',
        'Transfers from Bed to Wheelchair Using Transfer Belt',
        'Counts and Records Radial Pulse',
        'Counts and Records Respirations',
        'Measures and Records Electronic Blood Pressure',
        'Measures and Records Urinary Output',
        'Measures and Records Weight of Ambulatory Client',
        'Measures and Records Manual Blood Pressure',
        'Performs Modified Passive Range of Motion (PROM) for One Knee and One Ankle',
        'Performs Modified Passive Range of Motion (PROM) for One Shoulder'
    ];

    const skillCategories = [
        { id: 'infection-control', title: 'Infection Control', icon: '🦠' },
        { id: 'adl', title: 'Activities of Daily Living (ADLs)', icon: '🛁' },
        { id: 'mobility', title: 'Mobility and Transfer', icon: '🚶' },
        { id: 'measurement', title: 'Measurement and Monitoring', icon: '📊' },
        { id: 'range-motion', title: 'Range of Motion', icon: '💪' }
    ];

    useEffect(() => {
        if (isAuthenticated) {
            fetchProgressData();
        }
    }, [isAuthenticated]);

    const fetchProgressData = async () => {
        try {
            const summary = await progressService.getProgressSummary();
            setProgressSummary(summary);
        } catch (error) {
            console.error('Error fetching progress data:', error);
        }
    };

    const calculateCompletionPercentage = () => {
        if (!progressSummary) return 0;
        
        // Calculate based on actual skill completion data from progressSummary
        const totalSkills = allSkills.length;
        if (totalSkills === 0) return 0;
        
        // Use the averageCompletionPercentage from the progress summary
        return Math.round(progressSummary.averageCompletionPercentage || 0);
    };

    const getSkillId = (skillName) => {
        const skillNameToId = {
            "Hand Hygiene (Hand Washing)": "hand-hygiene",
            "Donning and Removing PPE (Gown and Gloves)": "ppe-gown-gloves",
            "Applies One Knee-High Elastic Stocking": "elastic-stocking",
            "Assists with Use of Bedpan": "bedpan-use",
            "Cleans Upper or Lower Denture": "denture-cleaning",
            "Dresses Client with Affected (Weak) Right Arm": "dressing-affected-arm",
            "Feeds Client Who Cannot Feed Self": "feeding-client",
            "Gives Modified Bed Bath (Face and One Arm, Hand, and Underarm/Armpit)": "modified-bed-bath",
            "Provides Catheter Care for Female": "catheter-care-female",
            "Provides Foot Care on One Foot": "foot-care",
            "Provides Mouth Care": "mouth-care",
            "Provides Perineal Care for Female": "perineal-care-female",
            "Assists to Ambulate Using Transfer Belt": "ambulate-transfer-belt",
            "Positions Resident on One Side": "position-on-side",
            "Transfers from Bed to Wheelchair Using Transfer Belt": "transfer-bed-wheelchair",
            "Counts and Records Radial Pulse": "radial-pulse",
            "Counts and Records Respirations": "respirations",
            "Measures and Records Electronic Blood Pressure": "electronic-blood-pressure",
            "Measures and Records Urinary Output": "urinary-output",
            "Measures and Records Weight of Ambulatory Client": "weight-measurement",
            "Measures and Records Manual Blood Pressure": "manual-blood-pressure",
            "Performs Modified Passive Range of Motion (PROM) for One Knee and One Ankle": "prom-knee-ankle",
            "Performs Modified Passive Range of Motion (PROM) for One Shoulder": "prom-shoulder"
        };
        return skillNameToId[skillName] || null;
    };

    const toggleDropdown = (skillName) => {
        setOpenDropdowns(prev => ({
            ...prev,
            [skillName]: !prev[skillName]
        }));
    };

    const toggleAllLessons = () => {
        setAllLessonsOpen(!allLessonsOpen);
    };

    const handleChatPractice = (skill) => {
        const skillId = getSkillId(skill);
        if (skillId) {
            window.location.href = `/chat?skillId=${skillId}`;
        } else {
            console.error(`No skillId found for skill: ${skill}`);
            alert(`Error: Unable to find skill ID for "${skill}". Please try again or contact support.`);
        }
    };

    const handleSkillSimulation = (skill) => {
        window.location.href = `/skill-simulation?skill=${encodeURIComponent(skill)}`;
    };

    const scrollToSkill = (skillName) => {
        const element = document.getElementById(`skill-${skillName.replace(/\s+/g, '-').toLowerCase()}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setAllLessonsOpen(false);
    };

    return (
        <Layout 
            enableVerticalLinesToggle={true}
            verticalLinesDefaultVisible={true}
        >
            <div className="learner-home-final-container">
                {/* Left sidebar with All Lessons dropdown */}
                <div className="left-sidebar">
                    <div className="all-lessons-dropdown">
                        <button 
                            className="all-lessons-button" 
                            onClick={toggleAllLessons}
                        >
                            All Lessons <span className="dropdown-arrow-left">{allLessonsOpen ? '^' : 'v'}</span>
                        </button>
                        {allLessonsOpen && (
                            <div className="all-lessons-menu">
                                {allSkills.map((skill, index) => (
                                    <div 
                                        key={index}
                                        className="all-lessons-item"
                                        onClick={() => scrollToSkill(skill)}
                                    >
                                        <span className="skill-name-left">{skill}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main content area with individual skill dropdown menus */}
                <div className="main-content">
                    <div className="learner-home-final-header">
                        <h1>CNA Skills Learning Hub</h1>
                        <p>Your comprehensive platform for CNA skill practice and mastery</p>
                        
                        {isAuthenticated && (
                            <div className="progress-section">
                                <div className="progress-bar-container">
                                    <div className="progress-info">
                                        <span className="progress-label">Overall Progress</span>
                                        <span className="progress-percentage">{calculateCompletionPercentage()}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ width: `${calculateCompletionPercentage()}%` }}
                                        ></div>
                                    </div>
                                </div>
                                {progressSummary && (
                                    <div className="progress-stats">
                                        <span className="completed-skills">{progressSummary.completedSkills || 0} of {progressSummary.totalSkills || 0} skills completed</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="vertical-dropdowns">
                        {allSkills.map((skill, index) => (
                            <div 
                                key={skill} 
                                id={`skill-${skill.replace(/\s+/g, '-').toLowerCase()}`}
                                className="skill-individual-dropdown"
                                style={{ marginTop: index * 20 + 'px' }}
                            >
                                <button
                                    className="skill-dropdown-button"
                                    onClick={() => toggleDropdown(skill)}
                                >
                                    <span className="skill-title">{skill}</span>
                                    <span className="dropdown-arrow">
                                        {openDropdowns[skill] ? '^' : 'v'}
                                    </span>
                                </button>

                                {openDropdowns[skill] && (
                                    <div className="skill-dropdown-content">
                                        <div className="skill-options">
                                            <button
                                                className="skill-option-button chat-practice"
                                                onClick={() => handleChatPractice(skill)}
                                            >
                                                💬 Chat Practice
                                            </button>
                                            <button
                                                className="skill-option-button skill-simulation"
                                                onClick={() => handleSkillSimulation(skill)}
                                            >
                                                🎯 Skill Simulation
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default LearnerHomeFinal