import React from 'react';
import Layout from '../components/Layout';
import '../styles/SkillsHub.css';

function SkillsHub() {
    const handleBackToLearnerHome = () => {
        window.location.href = '/learner-home';
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

    const handleLessonClick = (lessonName) => {
        const skillId = skillNameToId[lessonName];
        if (skillId) {
            console.log(`Starting lesson: ${lessonName} with skillId: ${skillId}`);
            window.location.href = `/chat?skillId=${skillId}`;
        } else {
            console.error(`No skill ID found for lesson: ${lessonName}`);
            // Fallback to default
            window.location.href = '/chat';
        }
    };

    const infectionControlLessons = [
        {
            title: "Hand Hygiene (Hand Washing)",
            description: "Learn proper hand washing techniques and when to perform hand hygiene."
        },
        {
            title: "Donning and Removing PPE (Gown and Gloves)",
            description: "Practice the correct sequence for putting on and removing personal protective equipment."
        }
    ];

    const adlLessons = [
        {
            title: "Applies One Knee-High Elastic Stocking",
            description: "Learn to properly apply compression stockings to prevent blood clots."
        },
        {
            title: "Assists with Use of Bedpan",
            description: "Practice safe and dignified bedpan assistance techniques."
        },
        {
            title: "Cleans Upper or Lower Denture",
            description: "Master proper denture cleaning and care procedures."
        },
        {
            title: "Dresses Client with Affected (Weak) Right Arm",
            description: "Learn adaptive dressing techniques for clients with limited mobility."
        },
        {
            title: "Feeds Client Who Cannot Feed Self",
            description: "Practice safe feeding techniques and aspiration prevention."
        },
        {
            title: "Gives Modified Bed Bath (Face and One Arm, Hand, and Underarm/Armpit)",
            description: "Learn proper bed bathing techniques while maintaining client dignity."
        },
        {
            title: "Provides Catheter Care for Female",
            description: "Practice proper catheter care and infection prevention."
        },
        {
            title: "Provides Foot Care on One Foot",
            description: "Learn safe foot care practices for client comfort and health."
        },
        {
            title: "Provides Mouth Care",
            description: "Master oral hygiene techniques for dependent clients."
        },
        {
            title: "Provides Perineal Care for Female",
            description: "Practice dignified and thorough perineal care procedures."
        }
    ];

    const mobilityLessons = [
        {
            title: "Assists to Ambulate Using Transfer Belt",
            description: "Learn safe ambulation assistance with proper body mechanics."
        },
        {
            title: "Positions Resident on One Side",
            description: "Practice proper positioning techniques to prevent pressure sores."
        },
        {
            title: "Transfers from Bed to Wheelchair Using Transfer Belt",
            description: "Master safe transfer techniques using assistive devices."
        }
    ];

    const measurementLessons = [
        {
            title: "Counts and Records Radial Pulse",
            description: "Learn to accurately assess and document pulse rate and rhythm."
        },
        {
            title: "Counts and Records Respirations",
            description: "Practice proper respiratory assessment techniques."
        },
        {
            title: "Measures and Records Electronic Blood Pressure",
            description: "Master automated blood pressure measurement and documentation."
        },
        {
            title: "Measures and Records Urinary Output",
            description: "Learn accurate urine measurement and recording procedures."
        },
        {
            title: "Measures and Records Weight of Ambulatory Client",
            description: "Practice safe and accurate weight measurement techniques."
        },
        {
            title: "Measures and Records Manual Blood Pressure",
            description: "Master manual blood pressure measurement using a sphygmomanometer."
        }
    ];

    const rangeMotionLessons = [
        {
            title: "Performs Modified Passive Range of Motion (PROM) for One Knee and One Ankle",
            description: "Learn proper joint movement techniques to maintain mobility."
        },
        {
            title: "Performs Modified Passive Range of Motion (PROM) for One Shoulder",
            description: "Practice safe shoulder range of motion exercises."
        }
    ];

    const LessonCategory = ({ title, lessons, className, icon }) => (
        <div className={`skills-category ${className}`}>
            <span className="skills-category-icon">{icon}</span>
            <h3 className="skills-category-title">{title}</h3>
            <div className="skills-category-lessons">
                {lessons.map((lesson, index) => (
                    <div
                        key={index}
                        className="skills-lesson-item"
                        onClick={() => handleLessonClick(lesson.title)}
                    >
                        <h4 className="skills-lesson-title">{lesson.title}</h4>
                        <p className="skills-lesson-description">{lesson.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="skills-hub-container">
                <button 
                    className="skills-hub-back-button"
                    onClick={handleBackToLearnerHome}
                >
                    ← Back to Learner Home
                </button>

                <div className="skills-hub-header">
                    <h1 className="skills-hub-title">CNA Skills Practice Hub</h1>
                    <p className="skills-hub-subtitle">
                        Select a skill category below to begin your interactive practice session
                    </p>
                </div>

                <div className="skills-hub-categories">
                    <LessonCategory
                        title="Infection Control"
                        lessons={infectionControlLessons}
                        className="infection-control"
                        icon="🦠"
                    />

                    <LessonCategory
                        title="Activities of Daily Living (ADLs)"
                        lessons={adlLessons}
                        className="adl"
                        icon="🛁"
                    />

                    <LessonCategory
                        title="Mobility and Transfer"
                        lessons={mobilityLessons}
                        className="mobility"
                        icon="🚶"
                    />

                    <LessonCategory
                        title="Measurement and Monitoring"
                        lessons={measurementLessons}
                        className="measurement"
                        icon="📊"
                    />

                    <LessonCategory
                        title="Range of Motion"
                        lessons={rangeMotionLessons}
                        className="range-motion"
                        icon="💪"
                    />
                </div>
            </div>
        </Layout>
    );
}

export default SkillsHub;