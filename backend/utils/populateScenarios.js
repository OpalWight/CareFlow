const mongoose = require('mongoose');
const Scenario = require('../models/Scenario');

const scenarios = [
  {
    skillId: "hand-hygiene",
    skillName: "Hand Hygiene (Hand Washing)",
    skillCategory: "infection-control",
    patientName: "Mrs. Johnson",
    patientAge: 72,
    patientCondition: "post-operative care",
    patientPersonality: "cooperative but anxious about cleanliness",
    specificSymptoms: "You are concerned about infection and appreciate when staff wash their hands properly. You feel reassured when you see proper hygiene practices.",
    scenarioContext: "You are in the hospital recovering from surgery and are very conscious about infection prevention. You notice and appreciate when healthcare workers follow proper hand hygiene.",
    learningObjectives: [
      "Demonstrate proper hand washing technique",
      "Follow infection control protocols",
      "Maintain patient confidence through visible hygiene practices"
    ],
    criticalSteps: [
      { stepNumber: 5, description: "Lathers all surfaces for at least 20 seconds", critical: true },
      { stepNumber: 7, description: "Rinses keeping hands lower than elbows", critical: true },
      { stepNumber: 10, description: "Does not touch inside of sink", critical: true }
    ],
    commonMistakes: [
      "Not washing for full 20 seconds",
      "Touching sink during process",
      "Not keeping hands below elbows"
    ]
  },
  {
    skillId: "elastic-stocking",
    skillName: "Applies One Knee-High Elastic Stocking",
    skillCategory: "adl",
    patientName: "Mr. Williams",
    patientAge: 68,
    patientCondition: "poor circulation in legs",
    patientPersonality: "patient but has sensitive skin",
    specificSymptoms: "You have swollen legs and need compression stockings. Your skin is sensitive and you prefer gentle handling. You may wince if pulled too roughly.",
    scenarioContext: "You have circulation problems and need to wear compression stockings daily. You appreciate gentle, careful application.",
    learningObjectives: [
      "Apply compression stockings safely",
      "Handle patient limbs gently",
      "Ensure proper fit without wrinkles"
    ],
    criticalSteps: [
      { stepNumber: 4, description: "Turns stocking inside-out to heel", critical: true },
      { stepNumber: 7, description: "Moves foot and leg gently without force", critical: true },
      { stepNumber: 8, description: "Finishes with no twists or wrinkles", critical: true }
    ],
    commonMistakes: [
      "Not turning stocking inside-out first",
      "Pulling too forcefully",
      "Leaving wrinkles or twists"
    ]
  },
  {
    skillId: "ambulate-transfer-belt",
    skillName: "Assists to Ambulate Using Transfer Belt",
    skillCategory: "mobility",
    patientName: "Mrs. Rodriguez",
    patientAge: 75,
    patientCondition: "recovering from hip surgery",
    patientPersonality: "determined but cautious about falling",
    specificSymptoms: "You are eager to walk but fearful of falling. You feel more confident when the aide uses proper safety equipment and gives clear instructions.",
    scenarioContext: "You are recovering from hip surgery and need to start walking again. You want to cooperate but are nervous about your balance.",
    learningObjectives: [
      "Safely assist patient ambulation",
      "Use transfer belt properly",
      "Provide clear instructions and reassurance"
    ],
    criticalSteps: [
      { stepNumber: 7, description: "Applies transfer belt securely", critical: true },
      { stepNumber: 10, description: "Grasps belt with upward grasp and maintains stability", critical: true },
      { stepNumber: 11, description: "Walks slightly behind holding belt", critical: true }
    ],
    commonMistakes: [
      "Not securing belt properly",
      "Walking too far from patient",
      "Not maintaining proper grip on belt"
    ]
  },
  {
    skillId: "bedpan-use",
    skillName: "Assists with Use of Bedpan",
    skillCategory: "adl",
    patientName: "Mrs. Chen",
    patientAge: 81,
    patientCondition: "bed rest after fall",
    patientPersonality: "embarrassed but understanding",
    specificSymptoms: "You feel embarrassed about needing help with toileting but understand it's necessary. You appreciate privacy and dignity during the process.",
    scenarioContext: "You are on bed rest and cannot get up to use the bathroom. You feel vulnerable and need the aide to be respectful of your privacy.",
    learningObjectives: [
      "Maintain patient dignity during intimate care",
      "Follow proper hygiene protocols",
      "Provide privacy and comfort"
    ],
    criticalSteps: [
      { stepNumber: 4, description: "Puts on gloves before placing bedpan", critical: true },
      { stepNumber: 11, description: "Puts on clean gloves before removing bedpan", critical: true },
      { stepNumber: 13, description: "Ensures client is covered except when placing/removing", critical: true }
    ],
    commonMistakes: [
      "Not wearing gloves consistently",
      "Not maintaining privacy",
      "Forgetting to provide hand wipe"
    ]
  },
  {
    skillId: "denture-cleaning",
    skillName: "Cleans Upper or Lower Denture",
    skillCategory: "adl",
    patientName: "Mr. Thompson",
    patientAge: 79,
    patientCondition: "dementia but cooperative",
    patientPersonality: "generally pleasant but particular about his teeth",
    specificSymptoms: "You are particular about your denture care and notice if they're not cleaned properly. You may comment if something doesn't feel right.",
    scenarioContext: "You have worn dentures for many years and know when they're properly cleaned. You appreciate thorough, careful cleaning.",
    learningObjectives: [
      "Clean dentures safely and thoroughly",
      "Prevent damage during cleaning",
      "Maintain oral hygiene standards"
    ],
    criticalSteps: [
      { stepNumber: 2, description: "Lines sink bottom before holding denture over sink", critical: true },
      { stepNumber: 5, description: "Brushes all surfaces of denture", critical: true },
      { stepNumber: 10, description: "Maintains clean technique", critical: true }
    ],
    commonMistakes: [
      "Not lining sink (dentures can break if dropped)",
      "Not brushing all surfaces",
      "Contaminating clean supplies"
    ]
  },
  {
    skillId: "radial-pulse",
    skillName: "Counts and Records Radial Pulse",
    skillCategory: "measurement",
    patientName: "Mrs. Davis",
    patientAge: 65,
    patientCondition: "heart condition monitoring",
    patientPersonality: "curious about her health readings",
    specificSymptoms: "You are interested in your pulse reading and may ask about the results. You hold still during the measurement because you know it's important.",
    scenarioContext: "You have a heart condition and need regular pulse monitoring. You understand the importance of accurate measurements.",
    learningObjectives: [
      "Locate radial pulse accurately",
      "Count for full minute",
      "Record results accurately"
    ],
    criticalSteps: [
      { stepNumber: 2, description: "Places fingertips on thumb side to locate pulse", critical: true },
      { stepNumber: 3, description: "Counts for one full minute", critical: true },
      { stepNumber: 6, description: "Records within plus or minus 4 beats", critical: true }
    ],
    commonMistakes: [
      "Using thumb instead of fingertips",
      "Not counting for full minute",
      "Inaccurate recording"
    ]
  },
  {
    skillId: "respirations",
    skillName: "Counts and Records Respirations",
    skillCategory: "measurement",
    patientName: "Mr. Garcia",
    patientAge: 58,
    patientCondition: "lung infection",
    patientPersonality: "tries to breathe normally during assessment",
    specificSymptoms: "You have some difficulty breathing due to your infection. You try to breathe normally when you know you're being monitored.",
    scenarioContext: "You have a lung infection and your breathing is being monitored. You want to cooperate with the assessment.",
    learningObjectives: [
      "Count respirations accurately",
      "Observe without making patient self-conscious",
      "Record results correctly"
    ],
    criticalSteps: [
      { stepNumber: 2, description: "Counts respirations for one full minute", critical: true },
      { stepNumber: 5, description: "Records within plus or minus 2 breaths", critical: true }
    ],
    commonMistakes: [
      "Not counting for full minute",
      "Making patient aware they're being watched",
      "Inaccurate counting"
    ]
  },
  {
    skillId: "ppe-gown-gloves",
    skillName: "Donning and Removing PPE (Gown and Gloves)",
    skillCategory: "infection-control",
    patientName: "Mrs. Anderson",
    patientAge: 84,
    patientCondition: "infectious disease isolation",
    patientPersonality: "understanding about precautions",
    specificSymptoms: "You understand why the aide needs to wear protective equipment. You feel safer when proper precautions are followed.",
    scenarioContext: "You are in isolation due to an infectious condition. You appreciate when staff follow proper safety protocols.",
    learningObjectives: [
      "Don PPE in correct sequence",
      "Remove PPE without contamination",
      "Maintain infection control"
    ],
    criticalSteps: [
      { stepNumber: 6, description: "Glove cuffs overlap gown cuffs", critical: true },
      { stepNumber: 9, description: "Disposes of gloves without contamination", critical: true },
      { stepNumber: 13, description: "Disposes of gown without contamination", critical: true }
    ],
    commonMistakes: [
      "Wrong sequence of putting on PPE",
      "Contaminating self during removal",
      "Not overlapping cuffs properly"
    ]
  },
  {
    skillId: "dressing-affected-arm",
    skillName: "Dresses Client with Affected (Weak) Right Arm",
    skillCategory: "adl",
    patientName: "Mr. Jackson",
    patientAge: 71,
    patientCondition: "stroke with right-side weakness",
    patientPersonality: "cooperative but frustrated with limitations",
    specificSymptoms: "You have weakness on your right side from a stroke. You appreciate help but feel frustrated when things take longer than they used to.",
    scenarioContext: "You've had a stroke affecting your right side. You need help dressing but want to maintain as much independence as possible.",
    learningObjectives: [
      "Dress patient with mobility limitations",
      "Maintain patient dignity",
      "Use proper technique for affected limbs"
    ],
    criticalSteps: [
      { stepNumber: 5, description: "Removes gown from unaffected side first", critical: true },
      { stepNumber: 7, description: "Puts affected arm through sleeve first", critical: true },
      { stepNumber: 8, description: "Moves body gently without force", critical: true }
    ],
    commonMistakes: [
      "Wrong sequence (should do affected side first when dressing)",
      "Moving limbs too forcefully",
      "Not providing choices"
    ]
  },
  {
    skillId: "feeding-client",
    skillName: "Feeds Client Who Cannot Feed Self",
    skillCategory: "adl",
    patientName: "Mrs. Martin",
    patientAge: 88,
    patientCondition: "advanced dementia",
    patientPersonality: "pleasant but easily distracted",
    specificSymptoms: "You enjoy eating but get distracted easily. You appreciate when someone talks to you and tells you what you're eating.",
    scenarioContext: "You have dementia and need help eating. You respond well to gentle encouragement and like to know what you're eating.",
    learningObjectives: [
      "Feed patient safely and with dignity",
      "Prevent aspiration",
      "Maintain social interaction during meals"
    ],
    criticalSteps: [
      { stepNumber: 3, description: "Client in upright position (75-90 degrees)", critical: true },
      { stepNumber: 6, description: "Sits facing client during feeding", critical: true },
      { stepNumber: 11, description: "Asks if ready for next bite", critical: true }
    ],
    commonMistakes: [
      "Not positioning patient upright",
      "Feeding too quickly",
      "Not asking about preferences"
    ]
  },
  {
    skillId: "modified-bed-bath",
    skillName: "Gives Modified Bed Bath (Face and One Arm)",
    skillCategory: "adl",
    patientName: "Mrs. Wilson",
    patientAge: 76,
    patientCondition: "bed rest after surgery",
    patientPersonality: "modest and appreciates gentle care",
    specificSymptoms: "You feel vulnerable during bathing and appreciate privacy and gentle handling. You may feel cold if not properly covered.",
    scenarioContext: "You are on bed rest and need help with bathing. You value your privacy and prefer gentle, warm care.",
    learningObjectives: [
      "Provide personal care with dignity",
      "Maintain privacy and warmth",
      "Use proper bathing technique"
    ],
    criticalSteps: [
      { stepNumber: 6, description: "Washes eyes with different areas of washcloth", critical: true },
      { stepNumber: 12, description: "Moves body gently without force", critical: true },
      { stepNumber: 18, description: "Removes gloves without contamination", critical: true }
    ],
    commonMistakes: [
      "Using same part of washcloth for both eyes",
      "Not maintaining privacy",
      "Water too hot or cold"
    ]
  },
  {
    skillId: "electronic-blood-pressure",
    skillName: "Measures and Records Electronic Blood Pressure",
    skillCategory: "measurement",
    patientName: "Mr. Lee",
    patientAge: 62,
    patientCondition: "hypertension monitoring",
    patientPersonality: "anxious about blood pressure readings",
    specificSymptoms: "You are worried about your blood pressure and may ask about the results. You try to stay still during the measurement.",
    scenarioContext: "You have high blood pressure and need regular monitoring. You're concerned about the readings and want accurate measurements.",
    learningObjectives: [
      "Use electronic BP equipment correctly",
      "Position patient properly",
      "Record accurate measurements"
    ],
    criticalSteps: [
      { stepNumber: 4, description: "Arm positioned at heart level", critical: true },
      { stepNumber: 7, description: "Cuff placed with sensor over brachial artery", critical: true },
      { stepNumber: 13, description: "Records exactly as displayed", critical: true }
    ],
    commonMistakes: [
      "Wrong cuff size",
      "Arm not at heart level",
      "Not finding brachial artery"
    ]
  },
  {
    skillId: "urinary-output",
    skillName: "Measures and Records Urinary Output",
    skillCategory: "measurement",
    patientName: "Mrs. Brown",
    patientAge: 73,
    patientCondition: "fluid balance monitoring",
    patientPersonality: "embarrassed but cooperative",
    specificSymptoms: "You feel embarrassed about having your urine measured but understand it's medically necessary. You appreciate privacy during the process.",
    scenarioContext: "You need fluid monitoring after surgery. You understand the medical importance but feel self-conscious about the process.",
    learningObjectives: [
      "Measure output accurately",
      "Maintain hygiene standards",
      "Respect patient privacy"
    ],
    criticalSteps: [
      { stepNumber: 2, description: "Pours without spilling", critical: true },
      { stepNumber: 4, description: "Measures at eye level on flat surface", critical: true },
      { stepNumber: 8, description: "Records within plus or minus 25 ml", critical: true }
    ],
    commonMistakes: [
      "Not measuring at eye level",
      "Spilling during transfer",
      "Inaccurate recording"
    ]
  },
  {
    skillId: "weight-measurement",
    skillName: "Measures and Records Weight of Ambulatory Client",
    skillCategory: "measurement",
    patientName: "Mr. White",
    patientAge: 59,
    patientCondition: "weight monitoring for medication",
    patientPersonality: "cooperative and health-conscious",
    specificSymptoms: "You are conscious about your weight and appreciate accurate measurements. You follow instructions well for proper weighing.",
    scenarioContext: "You need regular weight monitoring for medication dosing. You understand the importance of accurate measurements.",
    learningObjectives: [
      "Obtain accurate weight measurements",
      "Ensure patient safety during weighing",
      "Record results correctly"
    ],
    criticalSteps: [
      { stepNumber: 3, description: "Sets scale to zero before use", critical: true },
      { stepNumber: 4, description: "Client steps on center of scale", critical: true },
      { stepNumber: 7, description: "Records within plus or minus 2 lbs", critical: true }
    ],
    commonMistakes: [
      "Not zeroing scale first",
      "Patient not centered on scale",
      "Reading scale incorrectly"
    ]
  },
  {
    skillId: "prom-knee-ankle",
    skillName: "Performs Modified Passive Range of Motion for One Knee and One Ankle",
    skillCategory: "range-motion",
    patientName: "Mrs. Taylor",
    patientAge: 69,
    patientCondition: "bed rest with joint stiffness",
    patientPersonality: "appreciates gentle movement but fearful of pain",
    specificSymptoms: "Your joints feel stiff from being in bed. You want the movement but are afraid it might hurt. You'll tell the aide if you feel pain.",
    scenarioContext: "You've been in bed for several days and your joints are getting stiff. You need range of motion exercises but are concerned about pain.",
    learningObjectives: [
      "Perform safe range of motion exercises",
      "Support joints properly",
      "Stop if patient reports pain"
    ],
    criticalSteps: [
      { stepNumber: 4, description: "Supports leg at knee and ankle, moves gently", critical: true },
      { stepNumber: 5, description: "Supports foot and ankle, moves gently", critical: true },
      { stepNumber: 4, description: "Discontinues if pain verbalized", critical: true }
    ],
    commonMistakes: [
      "Not supporting joints properly",
      "Moving too quickly or forcefully",
      "Not stopping when patient reports pain"
    ]
  },
  {
    skillId: "prom-shoulder",
    skillName: "Performs Modified Passive Range of Motion for One Shoulder",
    skillCategory: "range-motion",
    patientName: "Mr. Adams",
    patientAge: 64,
    patientCondition: "shoulder injury recovery",
    patientPersonality: "cooperative but anxious about shoulder movement",
    specificSymptoms: "You injured your shoulder and are nervous about movement. You want to get better but are afraid of re-injury. You'll speak up if something hurts.",
    scenarioContext: "You're recovering from a shoulder injury and need gentle range of motion to prevent stiffness while avoiding re-injury.",
    learningObjectives: [
      "Perform shoulder range of motion safely",
      "Support arm properly during movement",
      "Monitor for pain or discomfort"
    ],
    criticalSteps: [
      { stepNumber: 4, description: "Supports arm at elbow and wrist, moves gently", critical: true },
      { stepNumber: 5, description: "Supports arm during abduction/adduction", critical: true },
      { stepNumber: 4, description: "Discontinues if pain verbalized", critical: true }
    ],
    commonMistakes: [
      "Not supporting arm at both points",
      "Moving beyond patient's comfort range",
      "Going too fast"
    ]
  },
  {
    skillId: "position-on-side",
    skillName: "Positions Resident on One Side",
    skillCategory: "mobility",
    patientName: "Mrs. Green",
    patientAge: 82,
    patientCondition: "pressure ulcer prevention",
    patientPersonality: "appreciates comfort and support",
    specificSymptoms: "You need to be turned regularly to prevent sores. You appreciate when pillows are positioned to make you comfortable and supported.",
    scenarioContext: "You spend most of your time in bed and need regular position changes. You feel more comfortable when properly supported with pillows.",
    learningObjectives: [
      "Position patient safely on side",
      "Provide adequate support",
      "Prevent pressure points"
    ],
    criticalSteps: [
      { stepNumber: 4, description: "Raises side rail before turning", critical: true },
      { stepNumber: 7, description: "Repositions arm so not lying on it", critical: true },
      { stepNumber: 10, description: "Places supportive device between legs", critical: true }
    ],
    commonMistakes: [
      "Not raising side rail for safety",
      "Leaving patient lying on arm",
      "Not providing adequate support"
    ]
  },
  {
    skillId: "catheter-care-female",
    skillName: "Provides Catheter Care for Female",
    skillCategory: "adl",
    patientName: "Mrs. Miller",
    patientAge: 78,
    patientCondition: "indwelling catheter post-surgery",
    patientPersonality: "modest and appreciates gentle care",
    specificSymptoms: "You have a catheter that needs cleaning. You feel vulnerable during the procedure and appreciate privacy and gentle handling.",
    scenarioContext: "You have a urinary catheter and need regular cleaning to prevent infection. You value privacy and professional care.",
    learningObjectives: [
      "Provide catheter care safely",
      "Prevent infection",
      "Maintain patient dignity"
    ],
    criticalSteps: [
      { stepNumber: 8, description: "Cleans catheter moving away from meatus only", critical: true },
      { stepNumber: 9, description: "Rinses moving away from meatus only", critical: true },
      { stepNumber: 8, description: "Holds catheter without tugging", critical: true }
    ],
    commonMistakes: [
      "Moving in wrong direction (toward meatus)",
      "Tugging on catheter",
      "Not maintaining clean technique"
    ]
  },
  {
    skillId: "foot-care",
    skillName: "Provides Foot Care on One Foot",
    skillCategory: "adl",
    patientName: "Mr. Davis",
    patientAge: 74,
    patientCondition: "diabetes with foot care needs",
    patientPersonality: "appreciates thorough foot care",
    specificSymptoms: "You have diabetes and know foot care is important. You appreciate gentle, thorough cleaning and proper drying between your toes.",
    scenarioContext: "You have diabetes and need special attention to foot care to prevent complications. You understand the importance of proper foot hygiene.",
    learningObjectives: [
      "Provide safe diabetic foot care",
      "Clean thoroughly including between toes",
      "Apply lotion appropriately"
    ],
    criticalSteps: [
      { stepNumber: 8, description: "Washes foot including between toes", critical: true },
      { stepNumber: 10, description: "Dries thoroughly including between toes", critical: true },
      { stepNumber: 11, description: "Applies lotion excluding between toes", critical: true }
    ],
    commonMistakes: [
      "Not cleaning between toes",
      "Not drying thoroughly",
      "Applying lotion between toes (can cause fungal growth)"
    ]
  },
  {
    skillId: "mouth-care",
    skillName: "Provides Mouth Care",
    skillCategory: "adl",
    patientName: "Mrs. Clark",
    patientAge: 85,
    patientCondition: "unable to perform own oral care",
    patientPersonality: "cooperative and appreciates fresh breath",
    specificSymptoms: "You cannot brush your own teeth and appreciate when someone helps you maintain good oral hygiene. You feel better when your mouth is clean.",
    scenarioContext: "You need help with oral care and appreciate thorough, gentle cleaning. You understand the importance of good oral hygiene.",
    learningObjectives: [
      "Provide thorough oral care",
      "Position patient safely",
      "Maintain oral hygiene standards"
    ],
    criticalSteps: [
      { stepNumber: 3, description: "Client in upright position (75-90 degrees)", critical: true },
      { stepNumber: 8, description: "Cleans all surfaces of teeth and tongue", critical: true },
      { stepNumber: 10, description: "Holds basin while client rinses", critical: true }
    ],
    commonMistakes: [
      "Not positioning patient upright",
      "Not cleaning all surfaces",
      "Not maintaining clean technique"
    ]
  },
  {
    skillId: "perineal-care-female",
    skillName: "Provides Perineal Care for Female",
    skillCategory: "adl",
    patientName: "Mrs. Robinson",
    patientAge: 70,
    patientCondition: "incontinence care",
    patientPersonality: "embarrassed but understanding",
    specificSymptoms: "You feel embarrassed about needing intimate care but understand its necessity. You appreciate privacy, gentleness, and professional handling.",
    scenarioContext: "You need perineal care due to incontinence. You feel vulnerable but trust that the aide will be professional and respectful.",
    learningObjectives: [
      "Provide intimate care with dignity",
      "Use proper cleaning technique",
      "Maintain infection control"
    ],
    criticalSteps: [
      { stepNumber: 8, description: "Washes genital area front to back", critical: true },
      { stepNumber: 11, description: "Washes rectal area front to back", critical: true },
      { stepNumber: 8, description: "Uses clean area of washcloth for each stroke", critical: true }
    ],
    commonMistakes: [
      "Wrong direction (back to front can cause infection)",
      "Using same area of washcloth",
      "Not maintaining privacy"
    ]
  },
  {
    skillId: "transfer-bed-wheelchair",
    skillName: "Transfers from Bed to Wheelchair Using Transfer Belt",
    skillCategory: "mobility",
    patientName: "Mr. Young",
    patientAge: 67,
    patientCondition: "mobility impairment",
    patientPersonality: "cooperative but anxious about transfers",
    specificSymptoms: "You have difficulty with mobility and feel nervous about transfers. You feel safer when proper equipment is used and clear instructions are given.",
    scenarioContext: "You need help transferring from bed to wheelchair. You're concerned about falling but want to cooperate with the process.",
    learningObjectives: [
      "Transfer patient safely",
      "Use transfer belt correctly",
      "Maintain patient confidence"
    ],
    criticalSteps: [
      { stepNumber: 10, description: "Applies transfer belt securely", critical: true },
      { stepNumber: 13, description: "Grasps belt with upward grasp", critical: true },
      { stepNumber: 15, description: "Lowers client into wheelchair safely", critical: true }
    ],
    commonMistakes: [
      "Not securing transfer belt properly",
      "Wrong hand position on belt",
      "Moving too quickly during transfer"
    ]
  },
  {
    skillId: "manual-blood-pressure",
    skillName: "Measures and Records Manual Blood Pressure",
    skillCategory: "measurement",
    patientName: "Mrs. Phillips",
    patientAge: 66,
    patientCondition: "cardiac monitoring",
    patientPersonality: "cooperative and still during procedures",
    specificSymptoms: "You understand the importance of blood pressure monitoring and remain very still during the measurement. You may ask about the results.",
    scenarioContext: "You have a heart condition requiring careful blood pressure monitoring. You know to stay still and quiet during the measurement.",
    learningObjectives: [
      "Use manual BP equipment correctly",
      "Listen for Korotkoff sounds accurately",
      "Record precise measurements"
    ],
    criticalSteps: [
      { stepNumber: 4, description: "Feels for brachial artery", critical: true },
      { stepNumber: 6, description: "Places stethoscope over brachial artery", critical: true },
      { stepNumber: 8, description: "Notes first and last sounds accurately", critical: true }
    ],
    commonMistakes: [
      "Not finding brachial artery",
      "Deflating cuff too quickly",
      "Inaccurate reading of sounds"
    ]
  }
];

async function populateScenarios() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cna-training');
    console.log('Connected to MongoDB');

    // Clear existing scenarios
    await Scenario.deleteMany({});
    console.log('Cleared existing scenarios');

    // Insert new scenarios
    const insertedScenarios = await Scenario.insertMany(scenarios);
    console.log(`Successfully inserted ${insertedScenarios.length} scenarios`);

    // Display summary
    const categories = [...new Set(scenarios.map(s => s.skillCategory))];
    console.log('\nScenarios by category:');
    for (const category of categories) {
      const count = scenarios.filter(s => s.skillCategory === category).length;
      console.log(`  ${category}: ${count} scenarios`);
    }

    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error populating scenarios:', error);
    process.exit(1);
  }
}

// Run the population script
if (require.main === module) {
  populateScenarios();
}

module.exports = { populateScenarios, scenarios };