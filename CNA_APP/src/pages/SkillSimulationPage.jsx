import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import InteractiveScenarioPage from '../components/interactive/InteractiveScenarioPage';
import '../styles/SkillSimulationPage.css';

function SkillSimulationPage() {
    const location = useLocation();
    const [selectedSkill, setSelectedSkill] = useState('');
    const [skillId, setSkillId] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const skill = params.get('skill');
        const id = params.get('skillId');
        
        if (skill) {
            setSelectedSkill(decodeURIComponent(skill));
        }
        
        if (id) {
            setSkillId(id);
        } else if (skill) {
            // Convert skill name to skillId if not provided
            const convertedId = getSkillId(decodeURIComponent(skill));
            setSkillId(convertedId);
        }
    }, [location]);

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

    const handleBackToHub = () => {
        window.location.href = '/learner-home-final';
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

    // If no skill is selected, show skill selection interface
    if (!skillId || !selectedSkill) {
        return (
            <Layout>
                <div className="skill-simulation-page-container">
                    <button 
                        className="back-button"
                        onClick={handleBackToHub}
                    >
                        ← Back to Learning Hub
                    </button>

                    <div className="skill-simulation-page-header">
                        <h1>🎯 Skill Simulation</h1>
                        <p>Please select a skill from the Learning Hub to begin simulation</p>
                    </div>

                    <div className="no-skill-selected">
                        <div className="no-skill-icon">🎯</div>
                        <h2>No Skill Selected</h2>
                        <p>Return to the Learning Hub to choose a CNA skill for simulation practice.</p>
                        <button 
                            className="select-skill-button"
                            onClick={handleBackToHub}
                        >
                            Go to Learning Hub
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    // Render the simulation with selected skill
    return (
        <Layout>
            <div className="skill-simulation-page-container">
                <div className="simulation-skill-info">
                    <button 
                        className="back-button"
                        onClick={handleBackToHub}
                    >
                        ← Back to Learning Hub
                    </button>
                    
                    <div className="skill-info-header">
                        <div className="skill-info-content">
                            <h2>Skill Simulation: {selectedSkill}</h2>
                            {skillCategory && (
                                <div className="skill-category-badge" style={{ backgroundColor: skillCategory.color }}>
                                    <span className="category-icon">{skillCategory.icon}</span>
                                    <span className="category-name">{skillCategory.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="interactive-simulation-wrapper">
                    <InteractiveScenarioPage 
                        skillId={skillId} 
                        onBackToHub={handleBackToHub}
                    />
                </div>
            </div>
        </Layout>
    );
}

export default SkillSimulationPage;