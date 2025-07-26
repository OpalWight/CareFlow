// CNA Skill Scenarios based on Credentia 2024 guidelines
// Each scenario contains specific steps, drop zones, and validation rules

export const CNA_SKILL_SCENARIOS = {
  'hand-hygiene': {
    title: 'Hand Hygiene (Hand Washing)',
    patientRoomTitle: 'Hand Hygiene Station',
    description: 'Perform proper hand hygiene technique for 20+ seconds',
    steps: [
      { id: 'address-client', name: 'Address client by name and introduce self', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'turn-on-water', name: 'Turn on water at sink', dropZone: 'sink-control', requiredSupply: 'sink' },
      { id: 'wet-hands', name: 'Wet hands and wrists thoroughly', dropZone: 'sink', requiredSupply: 'warm-water' },
      { id: 'apply-soap', name: 'Apply soap to hands', dropZone: 'hands', requiredSupply: 'soap' },
      { id: 'lather-20sec', name: 'Lather for at least 20 seconds with friction', dropZone: 'hands', requiredSupply: null },
      { id: 'clean-nails', name: 'Clean fingernails against opposite palm', dropZone: 'hands', requiredSupply: null },
      { id: 'rinse-hands', name: 'Rinse all surfaces, fingertips down', dropZone: 'sink', requiredSupply: 'warm-water' },
      { id: 'dry-hands', name: 'Dry with clean paper towel, fingertips first', dropZone: 'hands', requiredSupply: 'paper-towel' },
      { id: 'turn-off-faucet', name: 'Turn off faucet with paper towel', dropZone: 'sink-control', requiredSupply: 'paper-towel' }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Introduction Area', emoji: '👋', color: '#e3f2fd' },
      { id: 'sink', label: 'Sink Basin', emoji: '🚿', color: '#e8f5e8' },
      { id: 'sink-control', label: 'Faucet Controls', emoji: '🔧', color: '#fff3e0' },
      { id: 'hands', label: 'Hand Care Area', emoji: '🤲', color: '#f3e5f5' }
    ]
  },

  'elastic-stocking': {
    title: 'Applies One Knee-High Elastic Stocking',
    patientRoomTitle: 'Patient Bedside - Stocking Application',
    description: 'Apply elastic stocking to patient in supine position',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'supine-position', name: 'Ensure client is in supine position', dropZone: 'patient-bed', requiredSupply: null },
      { id: 'turn-inside-out', name: 'Turn stocking inside-out to heel', dropZone: 'bedside-prep', requiredSupply: 'elastic-stocking' },
      { id: 'place-over-toes', name: 'Place stocking over toes, foot and heel', dropZone: 'patient-foot', requiredSupply: 'elastic-stocking' },
      { id: 'pull-over-leg', name: 'Pull top of stocking over foot, heel and leg', dropZone: 'patient-leg', requiredSupply: null },
      { id: 'gentle-movement', name: 'Move foot and leg gently, avoid force', dropZone: 'patient-leg', requiredSupply: null },
      { id: 'check-fit', name: 'Ensure no twists/wrinkles, heel aligned', dropZone: 'patient-leg', requiredSupply: null },
      { id: 'signaling-device', name: 'Place signaling device within reach', dropZone: 'bedside-table', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'patient-bed', label: 'Patient Bed', emoji: '🛏️', color: '#e8f5e8' },
      { id: 'bedside-prep', label: 'Bedside Preparation', emoji: '📋', color: '#fff3e0' },
      { id: 'patient-foot', label: 'Patient Foot', emoji: '🦶', color: '#ffebee' },
      { id: 'patient-leg', label: 'Patient Leg', emoji: '🦵', color: '#e1f5fe' },
      { id: 'bedside-table', label: 'Bedside Table', emoji: '🏥', color: '#f1f8e9' }
    ]
  },

  'ambulate-transfer-belt': {
    title: 'Assists to Ambulate Using Transfer Belt',
    patientRoomTitle: 'Ambulation Training Area',
    description: 'Safely assist client to walk 10 feet using transfer belt',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'non-skid-shoes', name: 'Ensure client has non-skid footwear', dropZone: 'patient-feet', requiredSupply: 'non-skid-socks' },
      { id: 'safe-bed-level', name: 'Set bed at safe level', dropZone: 'bed-controls', requiredSupply: null },
      { id: 'lock-wheels', name: 'Check and lock bed wheels', dropZone: 'bed-controls', requiredSupply: null },
      { id: 'sitting-position', name: 'Assist client to sitting with feet flat', dropZone: 'patient-bedside', requiredSupply: null },
      { id: 'apply-belt', name: 'Apply transfer belt securely at waist', dropZone: 'patient-waist', requiredSupply: 'transfer-belt' },
      { id: 'standing-instructions', name: 'Provide standing instructions and signal', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'assist-standing', name: 'Count to 3, assist standing with upward grasp', dropZone: 'patient-waist', requiredSupply: null },
      { id: 'walk-10-feet', name: 'Walk slightly behind client for 10 feet', dropZone: 'walking-path', requiredSupply: null },
      { id: 'return-to-bed', name: 'Assist client back to bed, remove belt', dropZone: 'patient-bed', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'patient-feet', label: 'Patient Feet', emoji: '👟', color: '#fff3e0' },
      { id: 'bed-controls', label: 'Bed Controls', emoji: '🛏️', color: '#e8f5e8' },
      { id: 'patient-bedside', label: 'Bedside Position', emoji: '🪑', color: '#f1f8e9' },
      { id: 'patient-waist', label: 'Patient Waist/Belt Area', emoji: '🔗', color: '#ffebee' },
      { id: 'walking-path', label: '10-Foot Walking Path', emoji: '🚶', color: '#e1f5fe' },
      { id: 'patient-bed', label: 'Patient Bed', emoji: '🛏️', color: '#f3e5f5' }
    ]
  },

  'bedpan-use': {
    title: 'Assists with Use of Bedpan',
    patientRoomTitle: 'Bedpan Assistance Station',
    description: 'Safely assist client with bedpan use maintaining dignity',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'lower-head', name: 'Lower head of bed before placing bedpan', dropZone: 'bed-controls', requiredSupply: null },
      { id: 'put-on-gloves', name: 'Put on clean gloves before handling', dropZone: 'ppe-area', requiredSupply: 'gloves' },
      { id: 'place-bedpan', name: 'Place bedpan correctly under buttocks', dropZone: 'patient-bedpan-area', requiredSupply: 'bed-pan' },
      { id: 'remove-gloves', name: 'Remove gloves and wash hands', dropZone: 'handwashing-area', requiredSupply: null },
      { id: 'raise-head', name: 'Raise head of bed after positioning', dropZone: 'bed-controls', requiredSupply: null },
      { id: 'toilet-tissue', name: 'Place toilet tissue within reach', dropZone: 'bedside-table', requiredSupply: 'toilet-paper' },
      { id: 'hand-wipe', name: 'Place hand wipe within reach', dropZone: 'bedside-table', requiredSupply: 'hand-wipe' },
      { id: 'signaling-device', name: 'Place signaling device within reach', dropZone: 'bedside-table', requiredSupply: null },
      { id: 'clean-gloves-remove', name: 'Put on clean gloves to remove bedpan', dropZone: 'ppe-area', requiredSupply: 'gloves' },
      { id: 'lower-head-remove', name: 'Lower head of bed before removal', dropZone: 'bed-controls', requiredSupply: null },
      { id: 'empty-bedpan', name: 'Empty and rinse bedpan into toilet', dropZone: 'disposal-area', requiredSupply: null },
      { id: 'dirty-supply', name: 'Place bedpan in designated dirty area', dropZone: 'disposal-area', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'bed-controls', label: 'Bed Controls', emoji: '🛏️', color: '#e8f5e8' },
      { id: 'ppe-area', label: 'PPE Station', emoji: '🧤', color: '#ffebee' },
      { id: 'patient-bedpan-area', label: 'Bedpan Placement', emoji: '🚽', color: '#fff3e0' },
      { id: 'handwashing-area', label: 'Hand Washing', emoji: '🚿', color: '#e1f5fe' },
      { id: 'bedside-table', label: 'Bedside Table', emoji: '🏥', color: '#f1f8e9' },
      { id: 'disposal-area', label: 'Disposal Area', emoji: '🗑️', color: '#fafafa' }
    ]
  },

  'radial-pulse': {
    title: 'Counts and Records Radial Pulse',
    patientRoomTitle: 'Vital Signs Station - Pulse',
    description: 'Count radial pulse for one full minute and record accurately',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'locate-pulse', name: 'Place fingertips on thumb side of wrist', dropZone: 'patient-wrist', requiredSupply: null },
      { id: 'count-pulse', name: 'Count beats for one full minute', dropZone: 'timing-area', requiredSupply: 'wall-clock' },
      { id: 'signaling-device', name: 'Ensure signaling device within reach', dropZone: 'bedside-table', requiredSupply: null },
      { id: 'wash-hands', name: 'Wash hands before recording', dropZone: 'handwashing-area', requiredSupply: null },
      { id: 'record-pulse', name: 'Record pulse rate (within ±4 beats)', dropZone: 'documentation-area', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'patient-wrist', label: 'Patient Wrist/Radial Pulse', emoji: '✋', color: '#ffebee' },
      { id: 'timing-area', label: 'Timing/Clock Area', emoji: '🕐', color: '#fff3e0' },
      { id: 'bedside-table', label: 'Bedside Table', emoji: '🏥', color: '#f1f8e9' },
      { id: 'handwashing-area', label: 'Hand Washing', emoji: '🚿', color: '#e1f5fe' },
      { id: 'documentation-area', label: 'Documentation', emoji: '📋', color: '#f3e5f5' }
    ]
  },

  'respirations': {
    title: 'Counts and Records Respirations',
    patientRoomTitle: 'Vital Signs Station - Respirations',
    description: 'Count respirations for one full minute without patient awareness',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'count-respirations', name: 'Count respirations for one full minute', dropZone: 'patient-chest', requiredSupply: 'wall-clock' },
      { id: 'signaling-device', name: 'Ensure signaling device within reach', dropZone: 'bedside-table', requiredSupply: null },
      { id: 'wash-hands', name: 'Wash hands before recording', dropZone: 'handwashing-area', requiredSupply: null },
      { id: 'record-respirations', name: 'Record rate (within ±2 breaths)', dropZone: 'documentation-area', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'patient-chest', label: 'Patient Chest/Breathing', emoji: '🫁', color: '#ffebee' },
      { id: 'bedside-table', label: 'Bedside Table', emoji: '🏥', color: '#f1f8e9' },
      { id: 'handwashing-area', label: 'Hand Washing', emoji: '🚿', color: '#e1f5fe' },
      { id: 'documentation-area', label: 'Documentation', emoji: '📋', color: '#f3e5f5' }
    ]
  },

  'ppe-gown-gloves': {
    title: 'Donning and Removing PPE (Gown and Gloves)',
    patientRoomTitle: 'PPE Training Station',
    description: 'Properly don and remove gown and gloves without contamination',
    steps: [
      { id: 'pick-up-gown', name: 'Pick up gown and unfold', dropZone: 'ppe-staging', requiredSupply: 'gown' },
      { id: 'arms-through-sleeves', name: 'Place arms through each sleeve', dropZone: 'gown-area', requiredSupply: null },
      { id: 'fasten-neck', name: 'Fasten the neck opening', dropZone: 'gown-area', requiredSupply: null },
      { id: 'secure-waist', name: 'Secure gown at waist, cover back', dropZone: 'gown-area', requiredSupply: null },
      { id: 'put-on-gloves', name: 'Put on gloves', dropZone: 'glove-area', requiredSupply: 'gloves' },
      { id: 'overlap-cuffs', name: 'Ensure glove cuffs overlap gown cuffs', dropZone: 'glove-area', requiredSupply: null },
      { id: 'remove-first-glove', name: 'Remove one glove grasping at palm', dropZone: 'removal-area', requiredSupply: null },
      { id: 'remove-second-glove', name: 'Remove second glove from inside', dropZone: 'removal-area', requiredSupply: null },
      { id: 'dispose-gloves', name: 'Dispose gloves without contamination', dropZone: 'disposal-area', requiredSupply: null },
      { id: 'unfasten-gown', name: 'Unfasten gown at waist and neck', dropZone: 'removal-area', requiredSupply: null },
      { id: 'remove-gown', name: 'Remove gown without touching outside', dropZone: 'removal-area', requiredSupply: null },
      { id: 'dispose-gown', name: 'Dispose gown without contamination', dropZone: 'disposal-area', requiredSupply: null }
    ],
    dropZones: [
      { id: 'ppe-staging', label: 'PPE Staging Area', emoji: '📦', color: '#e3f2fd' },
      { id: 'gown-area', label: 'Gown Application', emoji: '👘', color: '#e8f5e8' },
      { id: 'glove-area', label: 'Glove Application', emoji: '🧤', color: '#fff3e0' },
      { id: 'removal-area', label: 'PPE Removal Zone', emoji: '🚮', color: '#ffebee' },
      { id: 'disposal-area', label: 'Disposal Area', emoji: '🗑️', color: '#f3e5f5' }
    ]
  },

  'manual-blood-pressure': {
    title: 'Measures and Records Manual Blood Pressure',
    patientRoomTitle: 'Vital Signs Station - Manual BP',
    description: 'Take manual blood pressure using cuff and stethoscope',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'clean-stethoscope', name: 'Wipe stethoscope with alcohol', dropZone: 'cleaning-area', requiredSupply: 'alcohol-wipes' },
      { id: 'position-arm', name: 'Position arm with palm up, exposed', dropZone: 'patient-arm', requiredSupply: null },
      { id: 'feel-brachial', name: 'Feel for brachial artery at elbow', dropZone: 'patient-arm', requiredSupply: null },
      { id: 'place-cuff', name: 'Place cuff snugly over brachial artery', dropZone: 'patient-arm', requiredSupply: 'bp-machine-manual' },
      { id: 'stethoscope-ears', name: 'Put stethoscope in ears, over artery', dropZone: 'patient-arm', requiredSupply: 'stethoscope' },
      { id: 'inflate-cuff', name: 'Inflate cuff to 160-180 mmHg', dropZone: 'bp-controls', requiredSupply: null },
      { id: 'deflate-listen', name: 'Deflate slowly, note first and last sounds', dropZone: 'bp-controls', requiredSupply: null },
      { id: 'remove-cuff', name: 'Remove cuff from patient', dropZone: 'patient-arm', requiredSupply: null },
      { id: 'signaling-device', name: 'Ensure signaling device within reach', dropZone: 'bedside-table', requiredSupply: null },
      { id: 'wash-hands', name: 'Wash hands before recording', dropZone: 'handwashing-area', requiredSupply: null },
      { id: 'record-bp', name: 'Record systolic/diastolic (within ±8)', dropZone: 'documentation-area', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'cleaning-area', label: 'Equipment Cleaning', emoji: '🧼', color: '#f1f8e9' },
      { id: 'patient-arm', label: 'Patient Arm/Brachial Area', emoji: '💪', color: '#ffebee' },
      { id: 'bp-controls', label: 'BP Machine Controls', emoji: '🩺', color: '#fff3e0' },
      { id: 'bedside-table', label: 'Bedside Table', emoji: '🏥', color: '#e8f5e8' },
      { id: 'handwashing-area', label: 'Hand Washing', emoji: '🚿', color: '#e1f5fe' },
      { id: 'documentation-area', label: 'Documentation', emoji: '📋', color: '#f3e5f5' }
    ]
  },

  'feeding-client': {
    title: 'Feeds Client Who Cannot Feed Self',
    patientRoomTitle: 'Patient Feeding Station',
    description: 'Safely assist client with eating while maintaining dignity',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'check-name', name: 'Check name card and ask client to state name', dropZone: 'documentation-area', requiredSupply: 'diet-card' },
      { id: 'upright-position', name: 'Position client upright (75-90 degrees)', dropZone: 'patient-positioning', requiredSupply: null },
      { id: 'place-tray', name: 'Place tray where food is visible', dropZone: 'feeding-table', requiredSupply: 'food-tray' },
      { id: 'clean-hands', name: 'Clean client hands before feeding', dropZone: 'client-hand-area', requiredSupply: 'hand-wipe' },
      { id: 'sit-facing', name: 'Sit in chair facing client', dropZone: 'caregiver-chair', requiredSupply: null },
      { id: 'describe-food', name: 'Tell client what foods are on tray', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'ask-preference', name: 'Ask what client wants to eat first', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'offer-food', name: 'Offer one bite of each food type', dropZone: 'feeding-area', requiredSupply: 'fork' },
      { id: 'offer-beverage', name: 'Offer beverage at least once', dropZone: 'feeding-area', requiredSupply: null },
      { id: 'ask-ready', name: 'Ask if ready for next bite/sip', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'clean-mouth', name: 'Clean mouth and hands at end', dropZone: 'client-face-area', requiredSupply: 'hand-wipe' },
      { id: 'remove-tray', name: 'Remove food tray', dropZone: 'feeding-table', requiredSupply: null },
      { id: 'leave-upright', name: 'Leave client upright with signal device', dropZone: 'patient-positioning', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'documentation-area', label: 'Name Card Check', emoji: '📋', color: '#f3e5f5' },
      { id: 'patient-positioning', label: 'Patient Position', emoji: '🛏️', color: '#e8f5e8' },
      { id: 'feeding-table', label: 'Feeding Table', emoji: '🍽️', color: '#fff3e0' },
      { id: 'client-hand-area', label: 'Client Hands', emoji: '🤲', color: '#f1f8e9' },
      { id: 'caregiver-chair', label: 'Caregiver Seating', emoji: '🪑', color: '#e1f5fe' },
      { id: 'feeding-area', label: 'Feeding Area', emoji: '🥄', color: '#ffebee' },
      { id: 'client-face-area', label: 'Client Face/Mouth', emoji: '👄', color: '#fafafa' }
    ]
  },

  'modified-bed-bath': {
    title: 'Gives Modified Bed Bath (Face and One Arm)',
    patientRoomTitle: 'Bed Bath Station',
    description: 'Give modified bed bath washing face and one arm safely',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'remove-gown', name: 'Remove gown, place in soiled linen', dropZone: 'linen-area', requiredSupply: 'gown' },
      { id: 'check-water-temp', name: 'Check water temperature for comfort', dropZone: 'water-testing', requiredSupply: 'basin' },
      { id: 'put-on-gloves', name: 'Put on clean gloves before washing', dropZone: 'ppe-area', requiredSupply: 'gloves' },
      { id: 'wash-eyes', name: 'Wash eyes with wet cloth, no soap', dropZone: 'patient-face', requiredSupply: 'washcloth' },
      { id: 'wash-face', name: 'Wash face with clean area of cloth', dropZone: 'patient-face', requiredSupply: 'soap' },
      { id: 'dry-face', name: 'Dry face with dry towel', dropZone: 'patient-face', requiredSupply: 'bath-towel' },
      { id: 'expose-arm', name: 'Expose one arm, place towel underneath', dropZone: 'patient-arm', requiredSupply: 'bath-towel' },
      { id: 'soap-washcloth', name: 'Apply soap to wet washcloth', dropZone: 'washing-prep', requiredSupply: 'soap' },
      { id: 'wash-arm', name: 'Wash fingers, hand, arm and underarm', dropZone: 'patient-arm', requiredSupply: 'washcloth' },
      { id: 'rinse-dry-arm', name: 'Rinse and dry arm thoroughly', dropZone: 'patient-arm', requiredSupply: 'bath-towel' },
      { id: 'put-on-gown', name: 'Put clean gown on client', dropZone: 'patient-dressing', requiredSupply: 'gown' },
      { id: 'empty-basin', name: 'Empty, rinse and dry basin', dropZone: 'cleaning-area', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'linen-area', label: 'Linen Management', emoji: '🧺', color: '#f1f8e9' },
      { id: 'water-testing', label: 'Water Temperature', emoji: '🌡️', color: '#e1f5fe' },
      { id: 'ppe-area', label: 'PPE Station', emoji: '🧤', color: '#ffebee' },
      { id: 'patient-face', label: 'Patient Face', emoji: '👤', color: '#fff3e0' },
      { id: 'patient-arm', label: 'Patient Arm', emoji: '💪', color: '#e8f5e8' },
      { id: 'washing-prep', label: 'Wash Preparation', emoji: '🧽', color: '#fafafa' },
      { id: 'patient-dressing', label: 'Patient Dressing', emoji: '👘', color: '#f8f9fa' },
      { id: 'cleaning-area', label: 'Equipment Cleaning', emoji: '🧼', color: '#e9ecef' }
    ]
  },

  'transfer-bed-wheelchair': {
    title: 'Transfers from Bed to Wheelchair Using Transfer Belt',
    patientRoomTitle: 'Patient Transfer Station',
    description: 'Safely transfer patient from bed to wheelchair',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'position-wheelchair', name: 'Position wheelchair alongside bed', dropZone: 'wheelchair-positioning', requiredSupply: 'wheelchair' },
      { id: 'fold-footrests', name: 'Fold up or remove footrests', dropZone: 'wheelchair-prep', requiredSupply: null },
      { id: 'lock-wheelchair', name: 'Lock wheels on wheelchair', dropZone: 'wheelchair-prep', requiredSupply: null },
      { id: 'safe-bed-level', name: 'Set bed at safe level', dropZone: 'bed-controls', requiredSupply: null },
      { id: 'lock-bed-wheels', name: 'Check and lock bed wheels', dropZone: 'bed-controls', requiredSupply: null },
      { id: 'sitting-position', name: 'Assist client to sitting, feet flat', dropZone: 'patient-bedside', requiredSupply: null },
      { id: 'put-on-shoes', name: 'Ensure client is wearing shoes', dropZone: 'patient-feet', requiredSupply: null },
      { id: 'apply-belt', name: 'Apply transfer belt securely at waist', dropZone: 'patient-waist', requiredSupply: 'transfer-belt' },
      { id: 'standing-instructions', name: 'Provide transfer instructions and signal', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'assist-standing', name: 'Count to 3, assist standing safely', dropZone: 'patient-waist', requiredSupply: null },
      { id: 'turn-to-chair', name: 'Help client turn to face wheelchair', dropZone: 'transfer-area', requiredSupply: null },
      { id: 'lower-to-chair', name: 'Lower client into wheelchair', dropZone: 'wheelchair-seat', requiredSupply: null },
      { id: 'position-hips', name: 'Position hips against chair back', dropZone: 'wheelchair-seat', requiredSupply: null },
      { id: 'remove-belt', name: 'Remove transfer belt', dropZone: 'patient-waist', requiredSupply: null },
      { id: 'position-feet', name: 'Position feet on footrests', dropZone: 'wheelchair-footrests', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'wheelchair-positioning', label: 'Wheelchair Position', emoji: '♿', color: '#e8f5e8' },
      { id: 'wheelchair-prep', label: 'Wheelchair Setup', emoji: '🔧', color: '#fff3e0' },
      { id: 'bed-controls', label: 'Bed Controls', emoji: '🛏️', color: '#f1f8e9' },
      { id: 'patient-bedside', label: 'Bedside Position', emoji: '🪑', color: '#e1f5fe' },
      { id: 'patient-feet', label: 'Patient Feet', emoji: '👟', color: '#ffebee' },
      { id: 'patient-waist', label: 'Transfer Belt Area', emoji: '🔗', color: '#fafafa' },
      { id: 'transfer-area', label: 'Transfer Zone', emoji: '↔️', color: '#f8f9fa' },
      { id: 'wheelchair-seat', label: 'Wheelchair Seat', emoji: '💺', color: '#e9ecef' },
      { id: 'wheelchair-footrests', label: 'Wheelchair Footrests', emoji: '🦶', color: '#dee2e6' }
    ]
  }
};

export default CNA_SKILL_SCENARIOS;