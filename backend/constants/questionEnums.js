// Shared enum constants for QuestionBank model
module.exports = {
    COMPETENCY_AREAS: [
        'Physical Care Skills', 
        'Psychosocial Care Skills', 
        'Role of the Nurse Aide'
    ],

    SKILL_CATEGORIES: [
        // Physical Care Skills categories
        'Activities of Daily Living',
        'Basic Nursing Skills', 
        'Restorative Skills',
        // Psychosocial Care Skills categories
        'Emotional and Mental Health Needs',
        'Spiritual and Cultural Needs',
        // Role of the Nurse Aide categories
        'Communication',
        'Client Rights',
        'Legal and Ethical Behavior',
        'Member of the Health Care Team'
    ],

    SKILL_TOPICS: [
        // Activities of Daily Living
        'Hygiene', 'Dressing and Grooming', 'Nutrition and Hydration', 
        'Elimination', 'Rest/Sleep/Comfort',
        // Basic Nursing Skills
        'Infection Control', 'Safety and Emergency Procedures', 
        'Therapeutic and Technical Procedures', 'Data Collection/Reporting',
        // Restorative Skills
        'Prevention', 'Self-Care', 'Independence for the Client',
        // Emotional and Mental Health Needs
        'Psychological Support', 'Handling Confusion and Dementia', 
        'Managing Emotional Distress',
        // Spiritual and Cultural Needs
        'Cultural Beliefs Respect', 'Spiritual Values in Caregiving',
        // Communication
        'Resident Interaction', 'Family Communication', 'Healthcare Team Communication',
        // Client Rights
        'Privacy Rights', 'Dignity and Respect', 'Resident Autonomy',
        // Legal and Ethical Behavior
        'Confidentiality', 'Ethical Conduct', 'Regulatory Compliance',
        // Member of the Health Care Team
        'Team Collaboration', 'CNA Responsibilities', 'Professional Boundaries'
    ],

    TEST_SUBJECTS: [
        'Resident care and daily living activities',
        'Infection control',
        'Safety and emergency procedures',
        'Communication and interpersonal skills',
        'Legal/ethical principles',
        'Resident\'s rights',
        'Mental health and social service needs',
        'Personal care skills',
        'Data collection/reporting'
    ],

    DIFFICULTIES: ['beginner', 'intermediate', 'advanced'],

    CORRECT_ANSWERS: ['A', 'B', 'C', 'D'],

    // Mappings for AI-generated values
    SKILL_TOPIC_MAPPINGS: {
        'Reporting and Observation': 'Data Collection/Reporting',
        'Observation and Reporting': 'Data Collection/Reporting',
        'Data Collection and Reporting': 'Data Collection/Reporting',
        'Emergency Procedures': 'Safety and Emergency Procedures',
        'Emergency Response': 'Safety and Emergency Procedures',
        'Personal Hygiene': 'Hygiene',
        'Basic Hygiene': 'Hygiene',
        'Nutritional Support': 'Nutrition and Hydration',
        'Feeding and Nutrition': 'Nutrition and Hydration',
        'Communication Skills': 'Resident Interaction',
        'Resident Communication': 'Resident Interaction'
    },

    TEST_SUBJECT_MAPPINGS: {
        'Emergency Situations': 'Safety and emergency procedures',
        'Emergency Response': 'Safety and emergency procedures',
        'Personal Care': 'Personal care skills',
        'Daily Living Activities': 'Resident care and daily living activities',
        'Resident Care': 'Resident care and daily living activities',
        'Communication Skills': 'Communication and interpersonal skills',
        'Legal and Ethical': 'Legal/ethical principles',
        'Mental Health': 'Mental health and social service needs',
        'CNA Responsibilities': 'Personal care skills', // AI mistakenly used skillTopic value for testSubject
        'Team Collaboration': 'Communication and interpersonal skills',
        'Professional Boundaries': 'Legal/ethical principles'
    }
};