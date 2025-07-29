import React, { useState } from 'react';
import DropZone from './DropZone';
import CNA_SKILL_SCENARIOS from '../../data/cnaSkillScenarios';
import '../../styles/interactive/PatientRoom.css';

function PatientRoom({ collectedSupplies, skillId = 'hand-hygiene', onStepComplete, completedSkillSteps = [] }) {
  const [completedSteps, setCompletedSteps] = useState(completedSkillSteps);
  const [activeActions, setActiveActions] = useState({}); // Track active action buttons
  const scenario = CNA_SKILL_SCENARIOS[skillId] || CNA_SKILL_SCENARIOS['hand-hygiene'];

  // Sync with parent component's completed steps
  React.useEffect(() => {
    setCompletedSteps(completedSkillSteps);
  }, [completedSkillSteps]);

  const handleDropZoneSuccess = (dropZoneId, supplyId) => {
    // Find the step that should be completed when an item is dropped in this zone
    const currentStep = scenario.steps.find(step => 
      step.dropZone === dropZoneId && 
      (!step.requiredSupply || step.requiredSupply === supplyId)
    );

    if (currentStep && !completedSteps.includes(currentStep.id)) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
      if (onStepComplete) {
        onStepComplete(currentStep.id);
      }
    }
  };

  const handleActionButtonClick = (stepId, actionType) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
      if (onStepComplete) {
        onStepComplete(stepId);
      }
      // Show brief animation for action completion
      setActiveActions(prev => ({ ...prev, [stepId]: true }));
      setTimeout(() => {
        setActiveActions(prev => ({ ...prev, [stepId]: false }));
      }, 1000);
    }
  };

  const isStepCompleted = (stepId) => completedSteps.includes(stepId);

  // Define action buttons for steps that require verbal communication or specific actions
  const getActionButtons = (step) => {
    const communicationSteps = [
      'explain-procedure', 'address-client', 'standing-instructions', 'ask-preference', 
      'ask-ready', 'describe-food', 'check-name', 'provide-privacy', 'tell-client',
      'ask-client', 'instruct-client'
    ];
    
    const physicalActionSteps = [
      'turn-on-water', 'turn-off-faucet', 'lather-20sec', 'clean-nails', 'lock-wheels',
      'balance-scale', 'start-machine', 'wait-reading', 'count-pulse', 'count-respirations',
      'inflate-cuff', 'deflate-listen', 'button-shirt', 'cross-arms', 'bend-leg',
      'turn-client', 'flex-knee', 'extend-knee', 'repeat-knee', 'flex-ankle', 'extend-ankle',
      'repeat-ankle', 'raise-arm', 'lower-arm', 'repeat-elevation', 'move-across-chest',
      'return-side', 'repeat-adduction', 'rotate-shoulder', 'lock-bed-wheels', 'lower-bed',
      'lower-head', 'upright-position', 'sitting-position', 'position-supine', 'position-upright',
      'position-client', 'position-comfortable', 'safe-bed-level', 'fold-footrests', 'lock-wheelchair',
      'supine-position', 'expose-leg', 'expose-arm', 'support-leg', 'support-arm', 'support-ankle',
      'cover-leg', 'cover-legs', 'separate-labia', 'use-clean-area', 'check-alignment',
      'assist-standing', 'assist-onto-scale', 'assist-off-scale', 'turn-to-chair', 'lower-to-chair',
      'position-hips', 'position-feet', 'position-arms', 'support-affected-arm', 'adjust-comfort',
      'remove-from-unaffected', 'remove-from-affected', 'put-affected-arm-first', 'put-unaffected-arm',
      'brush-teeth', 'brush-tongue', 'brush-denture', 'rinse-mouth', 'rinse-denture', 'rinse-foot',
      'wash-foot', 'dry-foot', 'dry-area', 'pat-dry', 'clean-downward', 'clean-front-back',
      'clean-catheter', 'place-foot-water', 'measure-at-eye-level', 'read-weight', 'read-weight',
      'select-cuff-size', 'feel-brachial', 'remove-denture', 'wet-toothbrush', 'apply-toothpaste'
    ];

    if (communicationSteps.includes(step.id)) {
      return (
        <button
          className={`action-button communication-action ${isStepCompleted(step.id) ? 'completed' : ''} ${activeActions[step.id] ? 'active' : ''}`}
          onClick={() => handleActionButtonClick(step.id, 'communication')}
          disabled={isStepCompleted(step.id)}
        >
          💬 {step.name}
        </button>
      );
    }

    if (physicalActionSteps.includes(step.id)) {
      return (
        <button
          className={`action-button physical-action ${isStepCompleted(step.id) ? 'completed' : ''} ${activeActions[step.id] ? 'active' : ''}`}
          onClick={() => handleActionButtonClick(step.id, 'physical')}
          disabled={isStepCompleted(step.id)}
        >
          ✋ {step.name}
        </button>
      );
    }

    return null;
  };

  return (
    <div>
      <h2 id="patient-room-h2">{scenario.patientRoomTitle}</h2>
      <p id="patient-room-p">{scenario.description}</p>
      
      <div className="patient-room-container">
        {/* Hospital bed - always present */}
        <div className="hospital-bed">
          <div className="patient-representation">
            <div className="patient-head" />
            <div className="patient-body">🏥</div>
            {/* Skill-specific patient areas */}
            {skillId === 'elastic-stocking' && <div className="patient-leg">🦵</div>}
            {skillId === 'feeding-client' && <div className="patient-mouth">👄</div>}
            {skillId.includes('blood-pressure') && <div className="patient-arm-bp">💪</div>}
          </div>
        </div>

        {/* Dynamic drop zones based on skill */}
        <div className="drop-zones-grid">
          {scenario.dropZones.map((zone, index) => {
            const positionStyle = {
              gridArea: `zone-${index + 1}`,
              minHeight: '80px',
              backgroundColor: zone.color
            };

            return (
              <div key={zone.id} className={`drop-zone-${zone.id}`} style={positionStyle}>
                <DropZone 
                  id={zone.id}
                  label={zone.label}
                  style={{
                    minHeight: '80px',
                    backgroundColor: zone.color,
                    border: completedSteps.some(stepId => {
                      const step = scenario.steps.find(s => s.id === stepId);
                      return step && step.dropZone === zone.id;
                    }) ? '3px solid #4caf50' : '2px dashed #ccc'
                  }}
                  onDropSuccess={(supplyId) => handleDropZoneSuccess(zone.id, supplyId)}
                >
                  <div className="zone-content">
                    <div className="zone-emoji">{zone.emoji}</div>
                    <div className="zone-label">{zone.label}</div>
                  </div>
                </DropZone>
              </div>
            );
          })}
        </div>

        {/* Skill-specific equipment */}
        {skillId === 'transfer-bed-wheelchair' && (
          <div className="wheelchair-area">
            <div className="wheelchair-icon">♿</div>
            <div className="wheelchair-label">Wheelchair</div>
          </div>
        )}

        {skillId === 'hand-hygiene' && (
          <div className="sink-area">
            <div className="sink-icon">🚿</div>
            <div className="sink-label">Hand Washing Sink</div>
          </div>
        )}

        {skillId === 'feeding-client' && (
          <div className="feeding-table">
            <div className="table-icon">🍽️</div>
            <div className="table-label">Feeding Table</div>
          </div>
        )}

        {/* Bedside table - common to most skills */}
        <div className="bedside-table">
          <div className="table-icon">🏥</div>
          <div className="table-label">Bedside Table</div>
        </div>

        {/* Room title */}
        <div className="room-title">
          🏥 {scenario.patientRoomTitle}
        </div>

        {/* Interactive Actions Panel */}
        <div className="interactive-actions-panel">
          <h4>Available Actions:</h4>
          <div className="action-buttons-grid">
            {scenario.steps.map((step) => {
              const actionButton = getActionButtons(step);
              if (actionButton) {
                return (
                  <div key={step.id} className="action-button-container">
                    {actionButton}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Dynamic instructions based on skill */}
        <div className="room-instructions">
          <h4>Procedure Steps:</h4>
          <ol>
            {scenario.steps.map((step, index) => (
              <li 
                key={step.id} 
                className={isStepCompleted(step.id) ? 'completed-step' : 'pending-step'}
                style={{
                  color: isStepCompleted(step.id) ? '#4caf50' : '#666',
                  textDecoration: isStepCompleted(step.id) ? 'line-through' : 'none'
                }}
              >
                {isStepCompleted(step.id) ? '✅' : `${index + 1}.`} {step.name}
                {getActionButtons(step) && (
                  <div className="inline-action-button">
                    {getActionButtons(step)}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* Progress indicator */}
        <div className="progress-indicator">
          <div className="progress-text">
            Progress: {completedSteps.length} / {scenario.steps.length} steps completed
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{
                width: `${(completedSteps.length / scenario.steps.length) * 100}%`,
                backgroundColor: completedSteps.length === scenario.steps.length ? '#4caf50' : '#2196f3'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientRoom;