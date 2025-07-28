import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import '../styles/ChatPractice.css';

function ChatPractice() {
    const location = useLocation();
    const [selectedSkill, setSelectedSkill] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const skill = params.get('skill');
        if (skill) {
            setSelectedSkill(decodeURIComponent(skill));
        }
    }, [location]);

    const handleBackToHome = () => {
        window.location.href = '/learner-home-final';
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

    const handleStartChat = () => {
        if (selectedSkill) {
            const skillId = getSkillId(selectedSkill);
            if (skillId) {
                window.location.href = `/chat?skillId=${skillId}`;
            } else {
                window.location.href = '/chat';
            }
        }
    };

    return (
        <Layout>
            <div className="chat-practice-container">
                <button 
                    className="back-button"
                    onClick={handleBackToHome}
                >
                    ← Back to Learning Hub
                </button>

                <div className="chat-practice-header">
                    <h1>💬 Chat Practice</h1>
                    <p>Interactive AI-guided practice session</p>
                </div>

                <div className="skill-info-card">
                    <h2>Selected Skill:</h2>
                    <div className="skill-name-display">
                        {selectedSkill || 'No skill selected'}
                    </div>
                    
                    {selectedSkill && (
                        <div className="skill-description">
                            <p>
                                You're about to start an interactive chat practice session for this CNA skill. 
                                The AI instructor will guide you through the procedure, ask questions, and provide 
                                feedback to help you master this essential skill.
                            </p>
                        </div>
                    )}
                </div>

                <div className="practice-actions">
                    {selectedSkill ? (
                        <button 
                            className="start-practice-button"
                            onClick={handleStartChat}
                        >
                            Start Chat Practice Session
                        </button>
                    ) : (
                        <div className="no-skill-message">
                            <p>Please select a skill from the Learning Hub to begin practice.</p>
                            <button 
                                className="select-skill-button"
                                onClick={handleBackToHome}
                            >
                                Select a Skill
                            </button>
                        </div>
                    )}
                </div>

                <div className="practice-info">
                    <h3>What to Expect:</h3>
                    <ul>
                        <li>Step-by-step guidance through the procedure</li>
                        <li>Interactive questions to test your knowledge</li>
                        <li>Real-time feedback and corrections</li>
                        <li>Tips for best practices and safety considerations</li>
                        <li>Practice scenarios similar to real clinical situations</li>
                    </ul>
                </div>
            </div>
        </Layout>
    );
}

export default ChatPractice;