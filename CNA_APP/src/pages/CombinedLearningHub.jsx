import React, { useState } from 'react';
import Layout from '../components/Layout';
import InteractiveScenarioPage from '../components/interactive/InteractiveScenarioPage';
import '../styles/CombinedLearningHub.css';

function CombinedLearningHub() {
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [currentMode, setCurrentMode] = useState(null); // 'chat' or 'simulation'
    const [selectedSkillId, setSelectedSkillId] = useState(null);

    const handleBackToLearnerHome = () => {
        window.location.href = '/learner-home';
    };

    const handleBackToSkills = () => {
        setSelectedSkill(null);
        setCurrentMode(null);
        setSelectedSkillId(null);
    };

    const handleChatPractice = (lessonName, skillId) => {
        console.log(`Starting chat practice: ${lessonName} with skillId: ${skillId}`);
        window.location.href = `/chat?skillId=${skillId}`;
    };

    const handleScenarioSimulation = (lessonName, skillId) => {
        console.log(`Starting scenario simulation: ${lessonName} with skillId: ${skillId}`);
        setCurrentMode('simulation');
        setSelectedSkillId(skillId);
    };

    // Mapping from skill names to skill IDs in the database
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

    const skillCategories = {
        infectionControl: {
            title: "Infection Control",
            icon: "🦠",
            color: "infection-control",
            lessons: [
                {
                    title: "Hand Hygiene (Hand Washing)",
                    description: "Learn proper hand washing techniques and when to perform hand hygiene.",
                    skillId: "hand-hygiene"
                },
                {
                    title: "Donning and Removing PPE (Gown and Gloves)",
                    description: "Practice the correct sequence for putting on and removing personal protective equipment.",
                    skillId: "ppe-gown-gloves"
                }
            ]
        },
        adl: {
            title: "Activities of Daily Living (ADLs)",
            icon: "🛁",
            color: "adl",
            lessons: [
                {
                    title: "Applies One Knee-High Elastic Stocking",
                    description: "Learn to properly apply compression stockings to prevent blood clots.",
                    skillId: "elastic-stocking"
                },
                {
                    title: "Assists with Use of Bedpan",
                    description: "Practice safe and dignified bedpan assistance techniques.",
                    skillId: "bedpan-use"
                },
                {
                    title: "Cleans Upper or Lower Denture",
                    description: "Master proper denture cleaning and care procedures.",
                    skillId: "denture-cleaning"
                },
                {
                    title: "Dresses Client with Affected (Weak) Right Arm",
                    description: "Learn adaptive dressing techniques for clients with limited mobility.",
                    skillId: "dressing-affected-arm"
                },
                {
                    title: "Feeds Client Who Cannot Feed Self",
                    description: "Practice safe feeding techniques and aspiration prevention.",
                    skillId: "feeding-client"
                },
                {
                    title: "Gives Modified Bed Bath (Face and One Arm, Hand, and Underarm/Armpit)",
                    description: "Learn proper bed bathing techniques while maintaining client dignity.",
                    skillId: "modified-bed-bath"
                },
                {
                    title: "Provides Catheter Care for Female",
                    description: "Practice proper catheter care and infection prevention.",
                    skillId: "catheter-care-female"
                },
                {
                    title: "Provides Foot Care on One Foot",
                    description: "Learn safe foot care practices for client comfort and health.",
                    skillId: "foot-care"
                },
                {
                    title: "Provides Mouth Care",
                    description: "Master oral hygiene techniques for dependent clients.",
                    skillId: "mouth-care"
                },
                {
                    title: "Provides Perineal Care for Female",
                    description: "Practice dignified and thorough perineal care procedures.",
                    skillId: "perineal-care-female"
                }
            ]
        },
        mobility: {
            title: "Mobility and Transfer",
            icon: "🚶",
            color: "mobility",
            lessons: [
                {
                    title: "Assists to Ambulate Using Transfer Belt",
                    description: "Learn safe ambulation assistance with proper body mechanics.",
                    skillId: "ambulate-transfer-belt"
                },
                {
                    title: "Positions Resident on One Side",
                    description: "Practice proper positioning techniques to prevent pressure sores.",
                    skillId: "position-on-side"
                },
                {
                    title: "Transfers from Bed to Wheelchair Using Transfer Belt",
                    description: "Master safe transfer techniques using assistive devices.",
                    skillId: "transfer-bed-wheelchair"
                }
            ]
        },
        measurement: {
            title: "Measurement and Monitoring",
            icon: "📊",
            color: "measurement",
            lessons: [
                {
                    title: "Counts and Records Radial Pulse",
                    description: "Learn to accurately assess and document pulse rate and rhythm.",
                    skillId: "radial-pulse"
                },
                {
                    title: "Counts and Records Respirations",
                    description: "Practice proper respiratory assessment techniques.",
                    skillId: "respirations"
                },
                {
                    title: "Measures and Records Electronic Blood Pressure",
                    description: "Master automated blood pressure measurement and documentation.",
                    skillId: "electronic-blood-pressure"
                },
                {
                    title: "Measures and Records Urinary Output",
                    description: "Learn accurate urine measurement and recording procedures.",
                    skillId: "urinary-output"
                },
                {
                    title: "Measures and Records Weight of Ambulatory Client",
                    description: "Practice safe and accurate weight measurement techniques.",
                    skillId: "weight-measurement"
                },
                {
                    title: "Measures and Records Manual Blood Pressure",
                    description: "Master manual blood pressure measurement using a sphygmomanometer.",
                    skillId: "manual-blood-pressure"
                }
            ]
        },
        rangeMotion: {
            title: "Range of Motion",
            icon: "💪",
            color: "range-motion",
            lessons: [
                {
                    title: "Performs Modified Passive Range of Motion (PROM) for One Knee and One Ankle",
                    description: "Learn proper joint movement techniques to maintain mobility.",
                    skillId: "prom-knee-ankle"
                },
                {
                    title: "Performs Modified Passive Range of Motion (PROM) for One Shoulder",
                    description: "Practice safe shoulder range of motion exercises.",
                    skillId: "prom-shoulder"
                }
            ]
        }
    };

    const SkillCategoryCard = ({ categoryKey, category }) => (
        <div 
            className={`combined-skill-category ${category.color}`}
            onClick={() => setSelectedSkill(categoryKey)}
        >
            <div className="combined-skill-category-icon">{category.icon}</div>
            <h3 className="combined-skill-category-title">{category.title}</h3>
            <p className="combined-skill-category-count">
                {category.lessons.length} lessons available
            </p>
            <div className="combined-skill-category-arrow">→</div>
        </div>
    );

    const LessonDetailView = ({ category }) => (
        <div className="combined-lesson-detail-view">
            <button 
                className="combined-back-button"
                onClick={handleBackToSkills}
            >
                ← Back to Skills
            </button>

            <div className="combined-lesson-header">
                <div className="combined-lesson-header-icon">{category.icon}</div>
                <div>
                    <h2 className="combined-lesson-header-title">{category.title}</h2>
                    <p className="combined-lesson-header-subtitle">
                        Choose your learning method for each lesson
                    </p>
                </div>
            </div>

            <div className="combined-lessons-grid">
                {category.lessons.map((lesson, index) => (
                    <div key={index} className="combined-lesson-card">
                        <h4 className="combined-lesson-title">{lesson.title}</h4>
                        <p className="combined-lesson-description">{lesson.description}</p>
                        
                        <div className="combined-lesson-options">
                            <button 
                                className="combined-lesson-option chat"
                                onClick={() => handleChatPractice(lesson.title, lesson.skillId)}
                            >
                                <span className="combined-option-icon">💬</span>
                                <div className="combined-option-content">
                                    <div className="combined-option-title">Chat Practice</div>
                                    <div className="combined-option-description">Interactive AI guidance</div>
                                </div>
                            </button>

                            <button 
                                className="combined-lesson-option simulation"
                                onClick={() => handleScenarioSimulation(lesson.title, lesson.skillId)}
                            >
                                <span className="combined-option-icon">🎭</span>
                                <div className="combined-option-content">
                                    <div className="combined-option-title">Scenario Simulation</div>
                                    <div className="combined-option-description">Hands-on practice</div>
                                </div>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // If in simulation mode, render the InteractiveScenarioPage
    if (currentMode === 'simulation') {
        return (
            <Layout>
                <div style={{ padding: '1rem' }}>
                    <InteractiveScenarioPage 
                        skillId={selectedSkillId} 
                        onBackToHub={handleBackToSkills}
                    />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="combined-learning-hub-container">
                <button 
                    className="combined-hub-back-button"
                    onClick={handleBackToLearnerHome}
                >
                    ← Back to Learner Home
                </button>

                {!selectedSkill ? (
                    <>
                        <div className="combined-hub-header">
                            <h1 className="combined-hub-title">Integrated Learning Hub</h1>
                            <p className="combined-hub-subtitle">
                                Choose a skill category to access both chat practice and scenario simulations
                            </p>
                        </div>

                        <div className="combined-skills-grid">
                            {Object.entries(skillCategories).map(([key, category]) => (
                                <SkillCategoryCard 
                                    key={key} 
                                    categoryKey={key} 
                                    category={category} 
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <LessonDetailView category={skillCategories[selectedSkill]} />
                )}
            </div>
        </Layout>
    );
}

export default CombinedLearningHub;