// CNA Knowledge Base Documents for RAG System
// Structured knowledge documents based on Credentia 2024 standards and OBRA regulations

export const CNA_KNOWLEDGE_DOCUMENTS = [
  // Hand Hygiene Knowledge
  {
    id: "credentia-hand-hygiene-2024",
    skillId: "hand-hygiene",
    category: "infection-control",
    title: "Hand Hygiene Procedure - Credentia 2024 Standards",
    source: "credentia-2024",
    criticality: "high",
    tags: ["infection-control", "safety", "timing", "technique"],
    content: `
      HAND HYGIENE (HAND WASHING) - CREDENTIA 2024 STANDARDS
      
      PURPOSE: Prevent transmission of microorganisms and maintain infection control.
      
      CRITICAL REQUIREMENTS:
      - Must address client by name and introduce self before beginning
      - Water temperature should be comfortably warm, not hot
      - Minimum 20 seconds of vigorous lathering and scrubbing
      - Fingernails must be cleaned against opposite palm
      - Hands and wrists must be thoroughly wet before applying soap
      - Rinse with fingertips pointing downward
      - Dry hands completely starting with fingertips
      - Turn off faucet using paper towel to avoid recontamination
      
      SUPPLIES REQUIRED:
      - Sink with running water
      - Liquid soap
      - Clean paper towels
      - Waste receptacle
      
      SAFETY CONSIDERATIONS:
      - Never touch sink basin or faucet with clean hands after washing
      - Ensure complete coverage of all hand and wrist surfaces
      - Maintain proper technique throughout entire procedure
      - Use paper towel barrier when turning off faucet
      
      TIMING: Total procedure should take 60-90 seconds including lathering time.
      
      COMMON ERRORS:
      - Insufficient lathering time (less than 20 seconds)
      - Touching contaminated surfaces after washing
      - Inadequate drying technique
      - Forgetting to clean fingernails
      - Improper water temperature
    `
  },
  
  {
    id: "obra-hand-hygiene-regulations",
    skillId: "hand-hygiene",
    category: "infection-control",
    title: "OBRA Hand Hygiene Requirements",
    source: "obra-regulations",
    criticality: "high",
    tags: ["regulations", "infection-control", "compliance"],
    content: `
      OBRA HAND HYGIENE REQUIREMENTS
      
      Federal regulations require CNAs to maintain proper hand hygiene to prevent healthcare-associated infections.
      
      REGULATORY REQUIREMENTS:
      - Hand hygiene must be performed before and after each resident contact
      - Proper technique must be followed as outlined in facility policies
      - CNAs must demonstrate competency in hand hygiene techniques
      - Documentation of hand hygiene compliance may be required
      
      INFECTION CONTROL STANDARDS:
      - Use of antimicrobial soap when indicated
      - Minimum 20-second wash time for routine hand washing
      - Alcohol-based hand sanitizer as alternative when hands not visibly soiled
      - Hand hygiene before donning gloves and after removing gloves
      
      QUALITY ASSURANCE:
      - Regular monitoring of hand hygiene compliance
      - Corrective action for non-compliance
      - Ongoing education and training requirements
    `
  },

  {
    id: "hand-hygiene-common-errors",
    skillId: "hand-hygiene",
    category: "assessment",
    title: "Common Hand Hygiene Errors and Corrections",
    source: "assessment-data",
    criticality: "medium",
    tags: ["errors", "feedback", "improvement"],
    content: `
      COMMON HAND HYGIENE ERRORS AND CORRECTIONS
      
      ERROR: Insufficient lathering time
      CORRECTION: Count to 20 or sing "Happy Birthday" twice to ensure adequate time
      IMPACT: Reduces effectiveness of removing microorganisms
      
      ERROR: Missing fingernail cleaning
      CORRECTION: Clean nails against opposite palm during lathering
      IMPACT: Fingernails harbor high concentrations of bacteria
      
      ERROR: Inadequate rinsing
      CORRECTION: Rinse thoroughly with fingertips pointing down
      IMPACT: Soap residue can cause skin irritation and reduce effectiveness
      
      ERROR: Poor drying technique
      CORRECTION: Dry completely starting with fingertips, use fresh paper towel
      IMPACT: Damp hands transfer bacteria more easily
      
      ERROR: Contamination after washing
      CORRECTION: Use paper towel to turn off faucet, avoid touching sink
      IMPACT: Recontaminates clean hands immediately
      
      ASSESSMENT CRITERIA:
      - Technique accuracy: 25 points
      - Safety compliance: 30 points
      - Timing adherence: 20 points
      - Supply usage: 15 points
      - Professional presentation: 10 points
    `
  },

  // Elastic Stocking Knowledge
  {
    id: "credentia-elastic-stocking-2024",
    skillId: "elastic-stocking",
    category: "adl-assistance",
    title: "Elastic Stocking Application - Credentia 2024",
    source: "credentia-2024",
    criticality: "medium",
    tags: ["circulation", "positioning", "technique"],
    content: `
      APPLIES ONE KNEE-HIGH ELASTIC STOCKING - CREDENTIA 2024
      
      PURPOSE: Promote venous circulation and prevent blood clots in immobilized residents.
      
      CRITICAL REQUIREMENTS:
      - Resident must be in supine position before application
      - Explain procedure clearly to resident
      - Provide privacy throughout procedure
      - Turn stocking inside-out to heel before application
      - Place over toes, foot, and heel in one motion
      - Pull stocking over leg without twisting or creating wrinkles
      - Ensure heel is properly aligned
      - Move resident's foot and leg gently, never force
      - Check for proper fit and comfort
      
      SUPPLIES REQUIRED:
      - One knee-high elastic stocking (correct size)
      - Clean gloves if indicated
      
      POSITIONING REQUIREMENTS:
      - Resident in supine position (lying flat)
      - Bed at appropriate height for CNA
      - Privacy provided with curtain or screen
      
      SAFETY CONSIDERATIONS:
      - Never force or pull roughly on resident's limb
      - Check for proper circulation after application
      - Ensure no twists, wrinkles, or rolling that could restrict circulation
      - Observe for signs of discomfort or pain
      - Respect resident dignity and privacy
      
      TECHNIQUE POINTS:
      - Smooth, even application
      - Proper heel alignment
      - No bunching or wrinkling
      - Comfortable but snug fit
    `
  },

  {
    id: "elastic-stocking-safety-protocols",
    skillId: "elastic-stocking",
    category: "safety",
    title: "Elastic Stocking Safety Protocols",
    source: "safety-guidelines",
    criticality: "high",
    tags: ["safety", "circulation", "contraindications"],
    content: `
      ELASTIC STOCKING SAFETY PROTOCOLS
      
      CONTRAINDICATIONS:
      - Open wounds or sores on leg
      - Severe peripheral vascular disease
      - Recent leg surgery
      - Severe edema
      - Allergic reactions to stocking material
      
      SAFETY CHECKS:
      - Inspect skin before application
      - Check for proper size and fit
      - Monitor for signs of impaired circulation
      - Ensure no pressure points or bunching
      - Check resident comfort level
      
      WARNING SIGNS:
      - Blue or purple discoloration
      - Numbness or tingling
      - Increased pain or discomfort
      - Excessive tightness
      - Skin irritation or breakdown
      
      REPORTING REQUIREMENTS:
      - Document application in resident record
      - Report any adverse reactions immediately
      - Note resident tolerance and comfort
      - Record any difficulties with application
      
      INFECTION CONTROL:
      - Use clean technique
      - Wash hands before and after procedure
      - Use gloves if risk of contact with body fluids
    `
  },

  // Transfer Belt Ambulation Knowledge
  {
    id: "credentia-ambulate-transfer-belt-2024",
    skillId: "ambulate-transfer-belt",
    category: "mobility-safety",
    title: "Ambulation with Transfer Belt - Credentia 2024",
    source: "credentia-2024",
    criticality: "high",
    tags: ["mobility", "safety", "fall-prevention", "technique"],
    content: `
      ASSISTS TO AMBULATE USING TRANSFER BELT - CREDENTIA 2024
      
      PURPOSE: Safely assist resident to walk while providing support and fall prevention.
      
      CRITICAL SAFETY REQUIREMENTS:
      - Explain procedure thoroughly to resident
      - Ensure resident has non-skid footwear
      - Check that bed wheels are locked
      - Set bed at safe working height
      - Apply transfer belt securely at waist level
      - Provide clear instructions and counting signals
      - Walk slightly behind and to the side of resident
      - Maintain firm grip on transfer belt during ambulation
      - Assist resident to walk approximately 10 feet
      
      SUPPLIES REQUIRED:
      - Transfer belt (gait belt)
      - Non-skid socks or shoes
      - Clear walking path
      
      POSITIONING AND TECHNIQUE:
      - Resident sitting on edge of bed with feet flat on floor
      - Belt applied snugly around waist, above hip bones
      - CNA positioned for optimal leverage and support
      - Use proper body mechanics throughout
      
      SAFETY PROTOCOLS:
      - Never leave resident unattended during ambulation
      - Be prepared to assist resident to sit if weakness occurs
      - Monitor resident's tolerance and breathing
      - Stop immediately if resident becomes dizzy or weak
      - Maintain privacy and dignity throughout procedure
      
      COMMUNICATION:
      - Count "1, 2, 3" before standing
      - Give clear, simple instructions
      - Encourage resident participation
      - Ask about comfort level during walk
      
      DISTANCE REQUIREMENT: Minimum 10 feet of safe ambulation
    `
  },

  {
    id: "transfer-belt-safety-standards",
    skillId: "ambulate-transfer-belt",
    category: "safety",
    title: "Transfer Belt Safety Standards and Fall Prevention",
    source: "safety-guidelines",
    criticality: "high",
    tags: ["fall-prevention", "safety", "technique", "equipment"],
    content: `
      TRANSFER BELT SAFETY STANDARDS
      
      EQUIPMENT SAFETY:
      - Inspect belt for wear, tears, or weak points before use
      - Ensure buckle is secure and functional
      - Belt width should be at least 2 inches
      - Weight capacity appropriate for resident
      
      APPLICATION SAFETY:
      - Apply over clothing, never on bare skin
      - Position at waist level, above hip bones
      - Snug but not restrictive (can fit fingers underneath)
      - Never place over ostomy, feeding tube, or surgical site
      
      BODY MECHANICS:
      - CNA maintains wide base of support
      - Keep back straight, bend at knees
      - Hold belt with underhand grip
      - Stay close to resident during movement
      - Use leg muscles for lifting, not back
      
      FALL PREVENTION:
      - Clear path of obstacles before beginning
      - Have resident wear non-skid footwear
      - Check resident's balance before walking
      - Stop if resident shows signs of fatigue
      - Be prepared to ease resident to floor safely if fall occurs
      
      CONTRAINDICATIONS:
      - Recent abdominal surgery
      - Ostomy or feeding tube in belt area
      - Respiratory distress
      - Severe cardiac conditions
      - Doctor's orders for bed rest
      
      EMERGENCY PROCEDURES:
      - If resident begins to fall, maintain grip on belt
      - Guide resident to floor safely, protect head
      - Never try to catch or lift falling resident
      - Call for help immediately
      - Do not move resident after fall
    `
  },

  // PPE Knowledge
  {
    id: "credentia-ppe-gown-gloves-2024",
    skillId: "ppe-gown-gloves",
    category: "infection-control",
    title: "Donning and Removing PPE (Gown and Gloves) - Credentia 2024",
    source: "credentia-2024",
    criticality: "high",
    tags: ["infection-control", "ppe", "technique", "safety"],
    content: `
      DONNING AND REMOVING PPE (GOWN AND GLOVES) - CREDENTIA 2024
      
      PURPOSE: Protect CNA and resident from transmission of infectious agents.
      
      DONNING SEQUENCE (PUTTING ON):
      1. Perform hand hygiene
      2. Don gown first, tie at neck and waist
      3. Don gloves second, pull over gown cuffs
      4. Ensure complete coverage of wrists
      
      GOWN APPLICATION:
      - Fully cover torso from neck to knees
      - Wrap around back and secure ties
      - Ensure sleeves cover to wrists
      - No gaps or openings
      
      GLOVE APPLICATION:
      - Select appropriate size for proper fit
      - Extend gloves over gown cuffs
      - No skin exposure at wrists
      - Check for tears or punctures
      
      REMOVAL SEQUENCE (TAKING OFF):
      1. Remove gloves first using proper technique
      2. Perform hand hygiene
      3. Remove gown carefully without contamination
      4. Perform final hand hygiene
      
      GLOVE REMOVAL:
      - Pinch outside of one glove at wrist
      - Peel away from body, turning inside out
      - Hold removed glove in remaining gloved hand
      - Slide finger under clean inside of remaining glove
      - Peel off, encasing first glove inside
      - Dispose immediately
      
      GOWN REMOVAL:
      - Untie gown at waist and neck
      - Pull away from body at shoulders
      - Turn inside out while removing
      - Fold contaminated side inward
      - Dispose immediately
      
      CRITICAL POINTS:
      - Never touch outside of contaminated PPE
      - Remove in correct sequence to prevent self-contamination
      - Perform hand hygiene between glove and gown removal
      - Dispose of PPE in appropriate containers
    `
  },

  // General Assessment Knowledge
  {
    id: "cna-assessment-rubric-2024",
    skillId: "general",
    category: "assessment",
    title: "CNA Skills Assessment Rubric - 2024 Standards",
    source: "credentia-2024",
    criticality: "high",
    tags: ["assessment", "scoring", "standards", "rubric"],
    content: `
      CNA SKILLS ASSESSMENT RUBRIC - 2024 STANDARDS
      
      SCORING CATEGORIES:
      
      SAFETY COMPLIANCE (30% of total score):
      - Excellent (90-100): All safety protocols followed perfectly
      - Good (80-89): Minor safety oversight, no risk to resident
      - Satisfactory (70-79): Some safety concerns but procedure safe
      - Needs Improvement (60-69): Multiple safety issues
      - Unsatisfactory (Below 60): Critical safety violations
      
      TECHNICAL ACCURACY (25% of total score):
      - Excellent: Perfect technique execution
      - Good: Minor technique variations
      - Satisfactory: Some technique errors but acceptable
      - Needs Improvement: Multiple technique errors
      - Unsatisfactory: Major technique failures
      
      COMMUNICATION (15% of total score):
      - Explains procedure clearly to resident
      - Uses appropriate tone and language
      - Responds to resident questions/concerns
      - Maintains professional demeanor
      
      INFECTION CONTROL (15% of total score):
      - Proper hand hygiene
      - Appropriate use of PPE
      - Maintains clean technique
      - Prevents cross-contamination
      
      TIMING AND EFFICIENCY (10% of total score):
      - Completes procedure within reasonable time
      - Works efficiently without rushing
      - Manages time effectively
      
      PROFESSIONALISM (5% of total score):
      - Maintains resident dignity and privacy
      - Shows respect and courtesy
      - Follows professional standards
      
      CRITICAL ERROR DEFINITIONS:
      - Any action that could cause injury to resident
      - Violation of infection control protocols
      - Failure to provide privacy
      - Rough or inappropriate handling
      - Contamination of sterile/clean items
      
      AUTOMATIC FAILURE CRITERIA:
      - Any critical safety violation
      - Failure to wash hands when required
      - Rough handling of resident
      - Breach of privacy or dignity
      - Contamination leading to infection risk
    `
  },

  {
    id: "cna-professional-standards",
    skillId: "general",
    category: "professionalism",
    title: "CNA Professional Standards and Ethics",
    source: "professional-guidelines",
    criticality: "medium",
    tags: ["professionalism", "ethics", "communication", "dignity"],
    content: `
      CNA PROFESSIONAL STANDARDS AND ETHICS
      
      RESIDENT RIGHTS:
      - Right to dignity and respect
      - Right to privacy during procedures
      - Right to information about care
      - Right to participate in care decisions
      - Right to be free from abuse and neglect
      
      COMMUNICATION STANDARDS:
      - Address residents by preferred name
      - Explain all procedures before beginning
      - Use clear, simple language
      - Listen to resident concerns
      - Maintain confidentiality
      
      PROFESSIONAL BEHAVIOR:
      - Maintain professional appearance
      - Demonstrate reliability and punctuality
      - Work cooperatively with team members
      - Follow facility policies and procedures
      - Participate in continuing education
      
      ETHICAL PRINCIPLES:
      - Autonomy: Respect resident's right to choose
      - Beneficence: Act in resident's best interest
      - Non-maleficence: "Do no harm"
      - Justice: Treat all residents fairly
      - Veracity: Be truthful in all communications
      
      SCOPE OF PRACTICE:
      - Perform only tasks within training and competency
      - Follow care plans as written
      - Report changes in resident condition
      - Document care accurately and timely
      - Seek supervision when uncertain
      
      CULTURAL COMPETENCY:
      - Respect diverse backgrounds and beliefs
      - Adapt communication style as appropriate
      - Consider cultural preferences in care
      - Avoid assumptions or stereotypes
      - Seek cultural guidance when needed
    `
  }
];

// Helper function to get knowledge documents for a specific skill
export const getKnowledgeBySkill = (skillId) => {
  return CNA_KNOWLEDGE_DOCUMENTS.filter(doc => 
    doc.skillId === skillId || doc.skillId === 'general'
  );
};

// Helper function to get knowledge documents by category
export const getKnowledgeByCategory = (category) => {
  return CNA_KNOWLEDGE_DOCUMENTS.filter(doc => doc.category === category);
};

// Helper function to get critical knowledge documents
export const getCriticalKnowledge = () => {
  return CNA_KNOWLEDGE_DOCUMENTS.filter(doc => doc.criticality === 'high');
};

export default CNA_KNOWLEDGE_DOCUMENTS;