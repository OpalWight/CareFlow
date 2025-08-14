import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import InteractiveScenarioPage from '../components/interactive/InteractiveScenarioPage';
import '../styles/SkillSimulation.css';

function SkillSimulation() {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedSkill, setSelectedSkill] = useState('');
    const [skillId, setSkillId] = useState('');
    const [simulationStarted, setSimulationStarted] = useState(false);
    const [showInstructionScreen, setShowInstructionScreen] = useState(false);
    const [showHints, setShowHints] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const skill = params.get('skill');
        const id = params.get('skillId');
        
        if (skill) {
            setSelectedSkill(decodeURIComponent(skill));
        }
        
        if (id) {
            setSkillId(id);
            setSimulationStarted(true);
        } else if (skill) {
            const convertedId = getSkillId(decodeURIComponent(skill));
            setSkillId(convertedId);
            setShowInstructionScreen(true);
        }
    }, [location]);

    const handleBackToHome = () => {
        navigate('/learner-home-final');
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
        return skillNameToId[skillName] || 'hand-hygiene';
    };

    const handleStartSimulation = () => {
        if (selectedSkill) {
            setSimulationStarted(true);
        }
    };

    const handleNormalMode = () => {
        setShowHints(true);
        setShowInstructionScreen(false);
        setSimulationStarted(true);
    };

    const handleNoHints = () => {
        setShowHints(false);
        setShowInstructionScreen(false);
        setSimulationStarted(true);
    };

    const handleBackToSelection = () => {
        navigate('/learner-home-final');
    };

    const getSkillCategory = (skill) => {
        const infectionControl = ['Hand Hygiene (Hand Washing)', 'Donning and Removing PPE (Gown and Gloves)'];
        const adl = [
            'Applies One Knee-High Elastic Stocking', 'Assists with Use of Bedpan', 'Cleans Upper or Lower Denture',
            'Dresses Client with Affected (Weak) Right Arm', 'Feeds Client Who Cannot Feed Self',
            'Gives Modified Bed Bath (Face and One Arm, Hand, and Underarm/Armpit)',
            'Provides Catheter Care for Female', 'Provides Foot Care on One Foot',
            'Provides Mouth Care', 'Provides Perineal Care for Female'
        ];
        const mobility = [
            'Assists to Ambulate Using Transfer Belt', 'Positions Resident on One Side',
            'Transfers from Bed to Wheelchair Using Transfer Belt'
        ];
        const measurement = [
            'Counts and Records Radial Pulse', 'Counts and Records Respirations',
            'Measures and Records Electronic Blood Pressure', 'Measures and Records Urinary Output',
            'Measures and Records Weight of Ambulatory Client', 'Measures and Records Manual Blood Pressure'
        ];
        const rangeMotion = [
            'Performs Modified Passive Range of Motion (PROM) for One Knee and One Ankle',
            'Performs Modified Passive Range of Motion (PROM) for One Shoulder'
        ];

        if (infectionControl.includes(skill)) return { name: 'Infection Control', icon: '🦠', color: '#dc3545' };
        if (adl.includes(skill)) return { name: 'Activities of Daily Living', icon: '🛁', color: '#007bff' };
        if (mobility.includes(skill)) return { name: 'Mobility and Transfer', icon: '🚶', color: '#28a745' };
        if (measurement.includes(skill)) return { name: 'Measurement and Monitoring', icon: '📊', color: '#ffc107' };
        if (rangeMotion.includes(skill)) return { name: 'Range of Motion', icon: '💪', color: '#6f42c1' };
        
        return { name: 'General', icon: '🎯', color: '#6c757d' };
    };

    const skillCategory = selectedSkill ? getSkillCategory(selectedSkill) : null;

    // If simulation is started or skillId is provided directly in URL, render full-screen InteractiveScenarioPage
    if (simulationStarted && selectedSkill && skillId) {
        return (
            <InteractiveScenarioPage 
                skillId={skillId} 
                onBackToHub={handleBackToSelection}
                skillName={selectedSkill}
                skillCategory={skillCategory}
                showHints={showHints}
            />
        );
    }

    // If no skill is selected, show skill selection interface with enhanced features
    if (!selectedSkill) {
        return (
            <Layout>
                <div className="skill-simulation-container">
                    <button 
                        className="back-button"
                        onClick={handleBackToHome}
                    >
                        ← Back to Learning Hub
                    </button>

                    <div className="skill-simulation-header">
                        <h1>🎯 Skill Simulation</h1>
                        <p>Please select a skill from the Learning Hub to begin simulation</p>
                    </div>

                    <div className="no-skill-selected">
                        <div className="no-skill-icon">🎯</div>
                        <h2>No Skill Selected</h2>
                        <p>Return to the Learning Hub to choose a CNA skill for simulation practice.</p>
                        <button 
                            className="select-skill-button"
                            onClick={handleBackToHome}
                        >
                            Go to Learning Hub
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    // Show instruction screen when skill is selected but simulation hasn't started
    if (showInstructionScreen && selectedSkill) {
        return (
            <Layout>
                <div className="skill-simulation-container">
                    <button 
                        className="back-button"
                        onClick={handleBackToHome}
                    >
                        ← Back to Learning Hub
                    </button>

                    <div className="instruction-screen">
                        <h1 className="instruction-heading">Step 1, Find Materials!</h1>
                        
                        <div className="instruction-buttons">
                            <button 
                                className="instruction-button no-hints-button"
                                onClick={handleNoHints}
                            >
                                No Hints
                            </button>
                            <button 
                                className="instruction-button normal-mode-button"
                                onClick={handleNormalMode}
                            >
                                Normal Mode
                            </button>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    // Show skill information and features before starting simulation
    return (
        <Layout>
            <div className="skill-simulation-container">
                <button 
                    className="back-button"
                    onClick={handleBackToHome}
                >
                    ← Back to Learning Hub
                </button>

                <div className="skill-simulation-header">
                    <h1>🎯 Skill Simulation</h1>
                    <p>Immersive scenario-based learning experience</p>
                </div>

                <div className="skill-info-card">
                    <h2>Selected Skill:</h2>
                    <div className="skill-name-display">
                        {selectedSkill}
                    </div>
                    
                    {skillCategory && (
                        <div className="skill-category-badge" style={{ backgroundColor: skillCategory.color }}>
                            <span className="category-icon">{skillCategory.icon}</span>
                            <span className="category-name">{skillCategory.name}</span>
                        </div>
                    )}
                    
                    <div className="skill-description">
                        <p>
                            You're about to enter an immersive simulation environment where you'll practice 
                            this CNA skill in realistic scenarios. The simulation will present you with 
                            virtual patients and situations that mirror real clinical environments.
                        </p>
                    </div>
                </div>

                <div className="simulation-features">
                    <div className="feature-grid">
                        <div className="feature-item">
                            <div className="feature-icon">🏥</div>
                            <h4>Realistic Environment</h4>
                            <p>Practice in virtual healthcare settings that mirror real facilities</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">👥</div>
                            <h4>Virtual Patients</h4>
                            <p>Interact with diverse patient scenarios and conditions</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">📋</div>
                            <h4>Step-by-Step Guidance</h4>
                            <p>Follow detailed procedures with visual and audio cues</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🎖️</div>
                            <h4>Performance Tracking</h4>
                            <p>Receive detailed feedback and performance metrics</p>
                        </div>
                    </div>
                </div>

                <div className="practice-actions">
                    <button 
                        className="start-simulation-button"
                        onClick={handleStartSimulation}
                    >
                        Enter Simulation Environment
                    </button>
                </div>

                <div className="simulation-info">
                    <h3>Simulation Benefits:</h3>
                    <ul>
                        <li>Safe environment to practice and make mistakes</li>
                        <li>Repeatable scenarios for skill mastery</li>
                        <li>Immediate feedback on technique and safety</li>
                        <li>Confidence building before real patient care</li>
                        <li>Standardized learning experiences</li>
                    </ul>
                </div>
            </div>
        </Layout>
    );
}

export default SkillSimulation;