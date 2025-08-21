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
  },

  'electronic-blood-pressure': {
    title: 'Measures and Records Electronic Blood Pressure',
    patientRoomTitle: 'Vital Signs Station - Electronic BP',
    description: 'Take electronic blood pressure using automated machine',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'position-arm', name: 'Position arm with palm up, exposed', dropZone: 'patient-arm', requiredSupply: null },
      { id: 'select-cuff-size', name: 'Select appropriate cuff size', dropZone: 'bp-controls', requiredSupply: 'bp-machine-electronic' },
      { id: 'place-cuff', name: 'Place cuff snugly over brachial artery', dropZone: 'patient-arm', requiredSupply: 'bp-machine-electronic' },
      { id: 'start-machine', name: 'Press start on electronic machine', dropZone: 'bp-controls', requiredSupply: null },
      { id: 'wait-reading', name: 'Wait for machine to complete reading', dropZone: 'bp-controls', requiredSupply: null },
      { id: 'remove-cuff', name: 'Remove cuff from patient', dropZone: 'patient-arm', requiredSupply: null },
      { id: 'signaling-device', name: 'Ensure signaling device within reach', dropZone: 'bedside-table', requiredSupply: null },
      { id: 'wash-hands', name: 'Wash hands before recording', dropZone: 'handwashing-area', requiredSupply: null },
      { id: 'record-bp', name: 'Record blood pressure reading', dropZone: 'documentation-area', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'patient-arm', label: 'Patient Arm/Brachial Area', emoji: '💪', color: '#ffebee' },
      { id: 'bp-controls', label: 'BP Machine Controls', emoji: '🩺', color: '#fff3e0' },
      { id: 'bedside-table', label: 'Bedside Table', emoji: '🏥', color: '#e8f5e8' },
      { id: 'handwashing-area', label: 'Hand Washing', emoji: '🚿', color: '#e1f5fe' },
      { id: 'documentation-area', label: 'Documentation', emoji: '📋', color: '#f3e5f5' }
    ]
  },

  'urinary-output': {
    title: 'Measures and Records Urinary Output',
    patientRoomTitle: 'Urinary Output Measurement Station',
    description: 'Accurately measure and record urine output',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'put-on-gloves', name: 'Put on clean gloves', dropZone: 'ppe-area', requiredSupply: 'gloves' },
      { id: 'pour-urine', name: 'Pour urine into graduated cylinder', dropZone: 'measurement-area', requiredSupply: 'graduated-cylinder' },
      { id: 'measure-at-eye-level', name: 'Read measurement at eye level', dropZone: 'measurement-area', requiredSupply: null },
      { id: 'empty-cylinder', name: 'Empty cylinder into toilet', dropZone: 'disposal-area', requiredSupply: null },
      { id: 'rinse-cylinder', name: 'Rinse graduated cylinder', dropZone: 'cleaning-area', requiredSupply: null },
      { id: 'clean-bedpan', name: 'Clean bedpan thoroughly', dropZone: 'cleaning-area', requiredSupply: 'bed-pan' },
      { id: 'remove-gloves', name: 'Remove gloves properly', dropZone: 'ppe-area', requiredSupply: null },
      { id: 'wash-hands', name: 'Wash hands thoroughly', dropZone: 'handwashing-area', requiredSupply: null },
      { id: 'record-output', name: 'Record output measurement', dropZone: 'documentation-area', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'ppe-area', label: 'PPE Station', emoji: '🧤', color: '#ffebee' },
      { id: 'measurement-area', label: 'Measurement Area', emoji: '📏', color: '#fff3e0' },
      { id: 'disposal-area', label: 'Disposal Area', emoji: '🚽', color: '#e8f5e8' },
      { id: 'cleaning-area', label: 'Equipment Cleaning', emoji: '🧼', color: '#f1f8e9' },
      { id: 'handwashing-area', label: 'Hand Washing', emoji: '🚿', color: '#e1f5fe' },
      { id: 'documentation-area', label: 'Documentation', emoji: '📋', color: '#fafafa' }
    ]
  },

  'weight-measurement': {
    title: 'Measures and Records Weight of Ambulatory Client',
    patientRoomTitle: 'Weight Measurement Station',
    description: 'Safely weigh ambulatory client using standing scale',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'balance-scale', name: 'Balance scale to zero', dropZone: 'scale-controls', requiredSupply: 'standing-scale' },
      { id: 'assist-onto-scale', name: 'Assist client to step onto scale', dropZone: 'scale-platform', requiredSupply: null },
      { id: 'position-feet', name: 'Position feet properly on scale', dropZone: 'scale-platform', requiredSupply: null },
      { id: 'read-weight', name: 'Read weight when needle stops moving', dropZone: 'scale-controls', requiredSupply: null },
      { id: 'assist-off-scale', name: 'Assist client to step off scale', dropZone: 'scale-platform', requiredSupply: null },
      { id: 'signaling-device', name: 'Ensure signaling device within reach', dropZone: 'bedside-table', requiredSupply: null },
      { id: 'wash-hands', name: 'Wash hands before recording', dropZone: 'handwashing-area', requiredSupply: null },
      { id: 'record-weight', name: 'Record weight measurement', dropZone: 'documentation-area', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'scale-controls', label: 'Scale Controls', emoji: '⚖️', color: '#fff3e0' },
      { id: 'scale-platform', label: 'Scale Platform', emoji: '📏', color: '#e8f5e8' },
      { id: 'bedside-table', label: 'Bedside Table', emoji: '🏥', color: '#f1f8e9' },
      { id: 'handwashing-area', label: 'Hand Washing', emoji: '🚿', color: '#e1f5fe' },
      { id: 'documentation-area', label: 'Documentation', emoji: '📋', color: '#f3e5f5' }
    ]
  },

  'denture-cleaning': {
    title: 'Cleans Upper or Lower Denture',
    patientRoomTitle: 'Denture Cleaning Station',
    description: 'Safely clean patient dentures maintaining proper hygiene',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'put-on-gloves', name: 'Put on clean gloves', dropZone: 'ppe-area', requiredSupply: 'gloves' },
      { id: 'line-sink', name: 'Line sink with paper towel', dropZone: 'sink-prep', requiredSupply: 'paper-towel' },
      { id: 'fill-basin', name: 'Fill emesis basin with cool water', dropZone: 'water-prep', requiredSupply: 'emesis-basin' },
      { id: 'remove-denture', name: 'Remove denture from mouth', dropZone: 'patient-mouth', requiredSupply: null },
      { id: 'place-liner', name: 'Place liner towel in working area', dropZone: 'work-area', requiredSupply: 'liner-towel' },
      { id: 'apply-paste', name: 'Apply denture paste to brush', dropZone: 'work-area', requiredSupply: 'denture-paste' },
      { id: 'brush-denture', name: 'Brush all surfaces of denture', dropZone: 'work-area', requiredSupply: 'denture-brush' },
      { id: 'rinse-denture', name: 'Rinse denture thoroughly', dropZone: 'sink-area', requiredSupply: null },
      { id: 'place-container', name: 'Place denture in container with solution', dropZone: 'storage-area', requiredSupply: 'denture-container' },
      { id: 'clean-equipment', name: 'Clean and store equipment properly', dropZone: 'cleaning-area', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'ppe-area', label: 'PPE Station', emoji: '🧤', color: '#ffebee' },
      { id: 'sink-prep', label: 'Sink Preparation', emoji: '🚿', color: '#e1f5fe' },
      { id: 'water-prep', label: 'Water Preparation', emoji: '💧', color: '#e8f5e8' },
      { id: 'patient-mouth', label: 'Patient Mouth', emoji: '👄', color: '#fff3e0' },
      { id: 'work-area', label: 'Work Area', emoji: '🦷', color: '#f1f8e9' },
      { id: 'sink-area', label: 'Sink Area', emoji: '🚰', color: '#e9ecef' },
      { id: 'storage-area', label: 'Storage Area', emoji: '🥤', color: '#f8f9fa' },
      { id: 'cleaning-area', label: 'Equipment Cleaning', emoji: '🧼', color: '#fafafa' }
    ]
  },

  'dressing-affected-arm': {
    title: 'Dresses Client with Affected (Weak) Right Arm',
    patientRoomTitle: 'Dressing Assistance Station',
    description: 'Safely dress client with affected right arm using proper technique',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'position-client', name: 'Position client sitting upright', dropZone: 'patient-positioning', requiredSupply: null },
      { id: 'support-affected-arm', name: 'Support affected arm during removal', dropZone: 'patient-arm', requiredSupply: null },
      { id: 'remove-from-unaffected', name: 'Remove shirt from unaffected arm first', dropZone: 'patient-arm', requiredSupply: 'gown' },
      { id: 'remove-from-affected', name: 'Remove shirt from affected arm', dropZone: 'patient-arm', requiredSupply: null },
      { id: 'place-towel', name: 'Place towel over chest for warmth', dropZone: 'patient-chest', requiredSupply: 'bath-towel' },
      { id: 'put-affected-arm-first', name: 'Put shirt on affected arm first', dropZone: 'patient-arm', requiredSupply: 'shirts' },
      { id: 'put-unaffected-arm', name: 'Put shirt on unaffected arm', dropZone: 'patient-arm', requiredSupply: null },
      { id: 'button-shirt', name: 'Button shirt from bottom to top', dropZone: 'patient-chest', requiredSupply: null },
      { id: 'adjust-comfort', name: 'Adjust for comfort and proper fit', dropZone: 'patient-positioning', requiredSupply: null },
      { id: 'signaling-device', name: 'Place signaling device within reach', dropZone: 'bedside-table', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'patient-positioning', label: 'Patient Position', emoji: '🪑', color: '#e8f5e8' },
      { id: 'patient-arm', label: 'Patient Arms', emoji: '💪', color: '#ffebee' },
      { id: 'patient-chest', label: 'Patient Chest', emoji: '👔', color: '#fff3e0' },
      { id: 'bedside-table', label: 'Bedside Table', emoji: '🏥', color: '#f1f8e9' }
    ]
  },

  'catheter-care-female': {
    title: 'Provides Catheter Care for Female',
    patientRoomTitle: 'Catheter Care Station',
    description: 'Provide proper catheter care maintaining sterile technique',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'position-supine', name: 'Position client supine with knees flexed', dropZone: 'patient-positioning', requiredSupply: null },
      { id: 'place-protector', name: 'Place disposable pad under buttocks', dropZone: 'patient-perineal', requiredSupply: 'disposable-bed-pad' },
      { id: 'put-on-gloves', name: 'Put on clean gloves', dropZone: 'ppe-area', requiredSupply: 'gloves' },
      { id: 'cover-legs', name: 'Cover legs with bath towel', dropZone: 'patient-legs', requiredSupply: 'bath-towel' },
      { id: 'check-water-temp', name: 'Test water temperature for comfort', dropZone: 'water-testing', requiredSupply: 'basin' },
      { id: 'separate-labia', name: 'Gently separate labia with non-dominant hand', dropZone: 'patient-perineal', requiredSupply: null },
      { id: 'clean-downward', name: 'Clean from meatus downward with washcloth', dropZone: 'patient-perineal', requiredSupply: 'washcloth' },
      { id: 'clean-catheter', name: 'Clean catheter tubing 4 inches from meatus', dropZone: 'catheter-tubing', requiredSupply: 'washcloth' },
      { id: 'dry-area', name: 'Pat dry the cleaned area', dropZone: 'patient-perineal', requiredSupply: 'bath-towel' },
      { id: 'remove-pad', name: 'Remove disposable pad', dropZone: 'disposal-area', requiredSupply: null },
      { id: 'position-comfortable', name: 'Position client comfortably', dropZone: 'patient-positioning', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'patient-positioning', label: 'Patient Position', emoji: '🛏️', color: '#e8f5e8' },
      { id: 'patient-perineal', label: 'Perineal Area', emoji: '🩺', color: '#ffebee' },
      { id: 'ppe-area', label: 'PPE Station', emoji: '🧤', color: '#fff3e0' },
      { id: 'patient-legs', label: 'Patient Legs', emoji: '🦵', color: '#f1f8e9' },
      { id: 'water-testing', label: 'Water Temperature', emoji: '🌡️', color: '#e1f5fe' },
      { id: 'catheter-tubing', label: 'Catheter Tubing', emoji: '🔗', color: '#f8f9fa' },
      { id: 'disposal-area', label: 'Disposal Area', emoji: '🗑️', color: '#fafafa' }
    ]
  },

  'foot-care': {
    title: 'Provides Foot Care on One Foot',
    patientRoomTitle: 'Foot Care Station',
    description: 'Provide proper foot care including washing and moisturizing',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'position-client', name: 'Position client comfortably', dropZone: 'patient-positioning', requiredSupply: null },
      { id: 'put-on-gloves', name: 'Put on clean gloves', dropZone: 'ppe-area', requiredSupply: 'gloves' },
      { id: 'place-towel-under', name: 'Place towel under foot', dropZone: 'patient-foot', requiredSupply: 'bath-towel' },
      { id: 'fill-basin', name: 'Fill basin with comfortably warm water', dropZone: 'water-prep', requiredSupply: 'basin' },
      { id: 'place-foot-water', name: 'Place foot in basin of water', dropZone: 'patient-foot', requiredSupply: null },
      { id: 'wash-foot', name: 'Wash foot with soap and washcloth', dropZone: 'patient-foot', requiredSupply: 'soap' },
      { id: 'rinse-foot', name: 'Rinse foot thoroughly', dropZone: 'patient-foot', requiredSupply: null },
      { id: 'dry-foot', name: 'Dry foot thoroughly including between toes', dropZone: 'patient-foot', requiredSupply: 'bath-towel' },
      { id: 'apply-lotion', name: 'Apply lotion to foot except between toes', dropZone: 'patient-foot', requiredSupply: 'lotion' },
      { id: 'remove-equipment', name: 'Remove basin and supplies', dropZone: 'cleaning-area', requiredSupply: null },
      { id: 'signaling-device', name: 'Place signaling device within reach', dropZone: 'bedside-table', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'patient-positioning', label: 'Patient Position', emoji: '🛏️', color: '#e8f5e8' },
      { id: 'ppe-area', label: 'PPE Station', emoji: '🧤', color: '#ffebee' },
      { id: 'patient-foot', label: 'Patient Foot', emoji: '🦶', color: '#fff3e0' },
      { id: 'water-prep', label: 'Water Preparation', emoji: '💧', color: '#e1f5fe' },
      { id: 'cleaning-area', label: 'Equipment Cleaning', emoji: '🧼', color: '#f1f8e9' },
      { id: 'bedside-table', label: 'Bedside Table', emoji: '🏥', color: '#f8f9fa' }
    ]
  },

  'mouth-care': {
    title: 'Provides Mouth Care',
    patientRoomTitle: 'Oral Care Station',
    description: 'Provide thorough mouth care maintaining oral hygiene',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'position-upright', name: 'Position client sitting upright', dropZone: 'patient-positioning', requiredSupply: null },
      { id: 'put-on-gloves', name: 'Put on clean gloves', dropZone: 'ppe-area', requiredSupply: 'gloves' },
      { id: 'place-towel', name: 'Place towel across chest', dropZone: 'patient-chest', requiredSupply: 'bath-towel' },
      { id: 'wet-toothbrush', name: 'Wet toothbrush with water', dropZone: 'prep-area', requiredSupply: 'denture-brush' },
      { id: 'apply-toothpaste', name: 'Apply small amount of toothpaste', dropZone: 'prep-area', requiredSupply: 'toothpaste' },
      { id: 'brush-teeth', name: 'Brush teeth gently in circular motions', dropZone: 'patient-mouth', requiredSupply: null },
      { id: 'brush-tongue', name: 'Brush tongue gently', dropZone: 'patient-mouth', requiredSupply: null },
      { id: 'rinse-mouth', name: 'Have client rinse mouth with water', dropZone: 'patient-mouth', requiredSupply: 'cup-water' },
      { id: 'wipe-mouth', name: 'Wipe mouth and chin with towel', dropZone: 'patient-face', requiredSupply: 'wash-towel' },
      { id: 'clean-equipment', name: 'Clean and store equipment', dropZone: 'cleaning-area', requiredSupply: null },
      { id: 'signaling-device', name: 'Place signaling device within reach', dropZone: 'bedside-table', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'patient-positioning', label: 'Patient Position', emoji: '🪑', color: '#e8f5e8' },
      { id: 'ppe-area', label: 'PPE Station', emoji: '🧤', color: '#ffebee' },
      { id: 'patient-chest', label: 'Patient Chest', emoji: '👔', color: '#fff3e0' },
      { id: 'prep-area', label: 'Preparation Area', emoji: '🧴', color: '#f1f8e9' },
      { id: 'patient-mouth', label: 'Patient Mouth', emoji: '👄', color: '#e1f5fe' },
      { id: 'patient-face', label: 'Patient Face', emoji: '👤', color: '#f8f9fa' },
      { id: 'cleaning-area', label: 'Equipment Cleaning', emoji: '🧼', color: '#fafafa' },
      { id: 'bedside-table', label: 'Bedside Table', emoji: '🏥', color: '#e9ecef' }
    ]
  },

  'perineal-care-female': {
    title: 'Provides Perineal Care for Female',
    patientRoomTitle: 'Perineal Care Station',
    description: 'Provide proper perineal care maintaining dignity and cleanliness',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'position-supine', name: 'Position client supine with knees flexed', dropZone: 'patient-positioning', requiredSupply: null },
      { id: 'place-pad', name: 'Place disposable pad under buttocks', dropZone: 'patient-perineal', requiredSupply: 'disposable-bed-pad' },
      { id: 'cover-legs', name: 'Cover legs with bath towel', dropZone: 'patient-legs', requiredSupply: 'bath-towel' },
      { id: 'put-on-gloves', name: 'Put on clean gloves', dropZone: 'ppe-area', requiredSupply: 'gloves' },
      { id: 'check-water-temp', name: 'Test water temperature for comfort', dropZone: 'water-testing', requiredSupply: 'basin' },
      { id: 'separate-labia', name: 'Gently separate labia with non-dominant hand', dropZone: 'patient-perineal', requiredSupply: null },
      { id: 'clean-front-back', name: 'Clean from front to back with washcloth', dropZone: 'patient-perineal', requiredSupply: 'washcloth' },
      { id: 'use-clean-area', name: 'Use clean area of cloth for each stroke', dropZone: 'patient-perineal', requiredSupply: null },
      { id: 'dry-area', name: 'Pat dry the area gently', dropZone: 'patient-perineal', requiredSupply: 'bath-towel' },
      { id: 'remove-pad', name: 'Remove disposable pad', dropZone: 'disposal-area', requiredSupply: null },
      { id: 'position-comfortable', name: 'Position client comfortably', dropZone: 'patient-positioning', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'patient-positioning', label: 'Patient Position', emoji: '🛏️', color: '#e8f5e8' },
      { id: 'patient-perineal', label: 'Perineal Area', emoji: '🩺', color: '#ffebee' },
      { id: 'patient-legs', label: 'Patient Legs', emoji: '🦵', color: '#fff3e0' },
      { id: 'ppe-area', label: 'PPE Station', emoji: '🧤', color: '#f1f8e9' },
      { id: 'water-testing', label: 'Water Temperature', emoji: '🌡️', color: '#e1f5fe' },
      { id: 'disposal-area', label: 'Disposal Area', emoji: '🗑️', color: '#f8f9fa' }
    ]
  },

  'position-on-side': {
    title: 'Positions Resident on One Side',
    patientRoomTitle: 'Patient Positioning Station',
    description: 'Safely position patient on side maintaining proper body alignment',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'lock-bed-wheels', name: 'Lock bed wheels for safety', dropZone: 'bed-controls', requiredSupply: null },
      { id: 'lower-bed', name: 'Lower bed to safe working height', dropZone: 'bed-controls', requiredSupply: null },
      { id: 'lower-head', name: 'Lower head of bed flat', dropZone: 'bed-controls', requiredSupply: null },
      { id: 'cross-arms', name: 'Cross client arms over chest', dropZone: 'patient-arms', requiredSupply: null },
      { id: 'bend-leg', name: 'Bend leg on side client will turn to', dropZone: 'patient-legs', requiredSupply: null },
      { id: 'turn-client', name: 'Turn client gently to side', dropZone: 'patient-body', requiredSupply: null },
      { id: 'place-pillow-head', name: 'Place pillow under head and neck', dropZone: 'patient-head', requiredSupply: 'pillows' },
      { id: 'place-pillow-back', name: 'Place pillow against back for support', dropZone: 'patient-back', requiredSupply: 'pillows' },
      { id: 'place-pillow-legs', name: 'Place pillow between legs', dropZone: 'patient-legs', requiredSupply: 'pillows' },
      { id: 'position-arms', name: 'Position arms comfortably', dropZone: 'patient-arms', requiredSupply: null },
      { id: 'check-alignment', name: 'Check body alignment and comfort', dropZone: 'patient-body', requiredSupply: null },
      { id: 'signaling-device', name: 'Place signaling device within reach', dropZone: 'bedside-table', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'bed-controls', label: 'Bed Controls', emoji: '🛏️', color: '#e8f5e8' },
      { id: 'patient-arms', label: 'Patient Arms', emoji: '💪', color: '#ffebee' },
      { id: 'patient-legs', label: 'Patient Legs', emoji: '🦵', color: '#fff3e0' },
      { id: 'patient-body', label: 'Patient Body', emoji: '🧍', color: '#f1f8e9' },
      { id: 'patient-head', label: 'Patient Head', emoji: '👤', color: '#e1f5fe' },
      { id: 'patient-back', label: 'Patient Back', emoji: '🔄', color: '#f8f9fa' },
      { id: 'bedside-table', label: 'Bedside Table', emoji: '🏥', color: '#fafafa' }
    ]
  },

  'prom-knee-ankle': {
    title: 'Performs Modified Passive Range of Motion (PROM) for One Knee and One Ankle',
    patientRoomTitle: 'Range of Motion Exercise Station',
    description: 'Perform passive range of motion exercises for knee and ankle',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'position-supine', name: 'Position client supine in bed', dropZone: 'patient-positioning', requiredSupply: null },
      { id: 'expose-leg', name: 'Expose leg while maintaining dignity', dropZone: 'patient-leg', requiredSupply: null },
      { id: 'support-leg', name: 'Support leg with both hands', dropZone: 'patient-leg', requiredSupply: null },
      { id: 'flex-knee', name: 'Slowly flex knee toward chest', dropZone: 'patient-knee', requiredSupply: null },
      { id: 'extend-knee', name: 'Slowly extend knee back to straight', dropZone: 'patient-knee', requiredSupply: null },
      { id: 'repeat-knee', name: 'Repeat knee flexion/extension 3 times', dropZone: 'patient-knee', requiredSupply: null },
      { id: 'support-ankle', name: 'Support ankle and lower leg', dropZone: 'patient-ankle', requiredSupply: null },
      { id: 'flex-ankle', name: 'Slowly flex ankle (toes toward shin)', dropZone: 'patient-ankle', requiredSupply: null },
      { id: 'extend-ankle', name: 'Slowly extend ankle (toes away)', dropZone: 'patient-ankle', requiredSupply: null },
      { id: 'repeat-ankle', name: 'Repeat ankle flexion/extension 3 times', dropZone: 'patient-ankle', requiredSupply: null },
      { id: 'cover-leg', name: 'Cover leg and position comfortably', dropZone: 'patient-leg', requiredSupply: null },
      { id: 'signaling-device', name: 'Place signaling device within reach', dropZone: 'bedside-table', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'patient-positioning', label: 'Patient Position', emoji: '🛏️', color: '#e8f5e8' },
      { id: 'patient-leg', label: 'Patient Leg', emoji: '🦵', color: '#ffebee' },
      { id: 'patient-knee', label: 'Patient Knee', emoji: '🔄', color: '#fff3e0' },
      { id: 'patient-ankle', label: 'Patient Ankle', emoji: '🦶', color: '#f1f8e9' },
      { id: 'bedside-table', label: 'Bedside Table', emoji: '🏥', color: '#e1f5fe' }
    ]
  },

  'prom-shoulder': {
    title: 'Performs Modified Passive Range of Motion (PROM) for One Shoulder',
    patientRoomTitle: 'Shoulder Range of Motion Station',
    description: 'Perform passive range of motion exercises for shoulder joint',
    steps: [
      { id: 'explain-procedure', name: 'Explain procedure clearly to client', dropZone: 'client-interaction', requiredSupply: null },
      { id: 'provide-privacy', name: 'Provide privacy with curtain/screen', dropZone: 'privacy-area', requiredSupply: null },
      { id: 'position-supine', name: 'Position client supine in bed', dropZone: 'patient-positioning', requiredSupply: null },
      { id: 'expose-arm', name: 'Expose arm while maintaining dignity', dropZone: 'patient-arm', requiredSupply: null },
      { id: 'support-arm', name: 'Support arm at wrist and elbow', dropZone: 'patient-arm', requiredSupply: null },
      { id: 'raise-arm', name: 'Slowly raise arm above head', dropZone: 'patient-shoulder', requiredSupply: null },
      { id: 'lower-arm', name: 'Slowly lower arm to side', dropZone: 'patient-shoulder', requiredSupply: null },
      { id: 'repeat-elevation', name: 'Repeat arm elevation 3 times', dropZone: 'patient-shoulder', requiredSupply: null },
      { id: 'move-across-chest', name: 'Move arm across chest', dropZone: 'patient-shoulder', requiredSupply: null },
      { id: 'return-side', name: 'Return arm to side', dropZone: 'patient-shoulder', requiredSupply: null },
      { id: 'repeat-adduction', name: 'Repeat across chest movement 3 times', dropZone: 'patient-shoulder', requiredSupply: null },
      { id: 'rotate-shoulder', name: 'Gently rotate shoulder in small circles', dropZone: 'patient-shoulder', requiredSupply: null },
      { id: 'position-comfortable', name: 'Position arm comfortably at side', dropZone: 'patient-arm', requiredSupply: null },
      { id: 'signaling-device', name: 'Place signaling device within reach', dropZone: 'bedside-table', requiredSupply: null }
    ],
    dropZones: [
      { id: 'client-interaction', label: 'Client Communication', emoji: '👋', color: '#e3f2fd' },
      { id: 'privacy-area', label: 'Privacy Controls', emoji: '🚪', color: '#f3e5f5' },
      { id: 'patient-positioning', label: 'Patient Position', emoji: '🛏️', color: '#e8f5e8' },
      { id: 'patient-arm', label: 'Patient Arm', emoji: '💪', color: '#ffebee' },
      { id: 'patient-shoulder', label: 'Patient Shoulder', emoji: '🔄', color: '#fff3e0' },
      { id: 'bedside-table', label: 'Bedside Table', emoji: '🏥', color: '#f1f8e9' }
    ]
  }
};

export default CNA_SKILL_SCENARIOS;