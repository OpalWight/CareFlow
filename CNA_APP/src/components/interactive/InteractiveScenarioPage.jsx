import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import SupplyRoom from './SupplyRoom';
import PatientRoom from './PatientRoom';
import TaskList from './TaskList';
import DraggableItem from './DraggableItem';
import CNA_SKILL_SCENARIOS from '../../data/cnaSkillScenarios';
import progressService from '../../api/progressService';
import '../../styles/interactive/InteractiveScenarioPage.css';

const SCENARIO_STEPS = {
  GATHERING_SUPPLIES: 'GATHERING_SUPPLIES',
  PERFORMING_SKILL: 'PERFORMING_SKILL',
  SCENARIO_COMPLETE: 'SCENARIO_COMPLETE'
};

// Define skill-specific supply requirements based on Credentia 2024 skills
const SKILL_SUPPLIES = {
  'hand-hygiene': [
    { id: 'soap', name: 'Soap', found: false },
    { id: 'sink', name: 'Sink', found: false },
    { id: 'paper-towel', name: 'Paper Towel', found: false },
    { id: 'warm-water', name: 'Warm Water', found: false }
  ],
  'elastic-stocking': [
    { id: 'elastic-stocking', name: 'Elastic Stocking', found: false }
  ],
  'ambulate-transfer-belt': [
    { id: 'transfer-belt', name: 'Transfer Belt', found: false },
    { id: 'non-skid-socks', name: 'Non-skid Socks', found: false }
  ],
  'bedpan-use': [
    { id: 'bed-pan', name: 'Bed Pan', found: false },
    { id: 'disposable-bed-protector', name: 'Disposable Bed Protector', found: false },
    { id: 'paper-towel', name: 'Paper Towel (2 pieces)', found: false },
    { id: 'magazine', name: 'Magazine/TV Remote', found: false },
    { id: 'toilet-paper', name: 'Toilet Paper', found: false },
    { id: 'hand-wipe', name: 'Hand Wipe', found: false },
    { id: 'trashcan', name: 'Trashcan', found: false },
    { id: 'gloves', name: 'Gloves (4 pieces)', found: false }
  ],
  'denture-cleaning': [
    { id: 'denture-paste', name: 'Denture Paste', found: false },
    { id: 'denture-brush', name: 'Denture Brush', found: false },
    { id: 'emesis-basin', name: 'Emesis Basin', found: false },
    { id: 'liner-towel', name: 'Liner Towel', found: false },
    { id: 'barrier-paper-towel', name: 'Barrier Paper Towel', found: false },
    { id: 'denture-container', name: 'Denture Container with Lid', found: false },
    { id: 'gloves', name: 'Gloves', found: false }
  ],
  'radial-pulse': [
    { id: 'wall-clock', name: 'Wall Clock', found: false }
  ],
  'respirations': [
    { id: 'wall-clock', name: 'Wall Clock', found: false }
  ],
  'ppe-gown-gloves': [
    { id: 'gown', name: 'Gown', found: false },
    { id: 'gloves', name: 'Gloves (2 pieces)', found: false }
  ],
  'dressing-affected-arm': [
    { id: 'gown', name: 'Old Gown', found: false },
    { id: 'bath-towel', name: 'Bath Towel', found: false },
    { id: 'shirts', name: 'Front-buttoned Shirts (2 different colors)', found: false }
  ],
  'feeding-client': [
    { id: 'cloth-protector', name: 'Cloth Protector', found: false },
    { id: 'food-tray', name: 'Tray of Food with Drinks', found: false },
    { id: 'fork', name: 'Fork', found: false },
    { id: 'diet-card', name: 'Diet Card', found: false },
    { id: 'hand-wipe', name: 'Hand Wipes (2 pieces)', found: false }
  ],
  'modified-bed-bath': [
    { id: 'gown', name: 'Old Gown', found: false },
    { id: 'bath-towel', name: 'Bath Towels (3 pieces)', found: false },
    { id: 'washcloth', name: 'Wash Cloths (3 pieces)', found: false },
    { id: 'soap', name: 'Soap', found: false },
    { id: 'basin', name: 'Basin', found: false },
    { id: 'gloves', name: 'Gloves', found: false }
  ],
  'electronic-blood-pressure': [
    { id: 'bp-machine-electronic', name: 'Electronic Blood Pressure Machine', found: false }
  ],
  'urinary-output': [
    { id: 'graduated-cylinder', name: 'Graduated Cylinder', found: false },
    { id: 'bed-pan', name: 'Bed Pan', found: false },
    { id: 'gloves', name: 'Gloves', found: false },
    { id: 'paper-towel', name: 'Paper Towels (2 pieces)', found: false }
  ],
  'weight-measurement': [
    { id: 'standing-scale', name: 'Standing Scale', found: false },
    { id: 'non-skid-socks', name: 'Non-skid Socks', found: false }
  ],
  'prom-knee-ankle': [],
  'prom-shoulder': [],
  'position-on-side': [
    { id: 'pillows', name: 'Pillows (4 including head pillow)', found: false }
  ],
  'catheter-care-female': [
    { id: 'gloves', name: 'Gloves', found: false },
    { id: 'disposable-bed-pad', name: 'Disposable Bed Pad', found: false },
    { id: 'washcloth', name: 'Colored Wash Cloths (3 pieces)', found: false },
    { id: 'bath-towel', name: 'Bath Towel (table protector)', found: false },
    { id: 'bath-towel', name: 'Bath Towel (leg cover)', found: false },
    { id: 'soap', name: 'Soap', found: false },
    { id: 'basin', name: 'Basin', found: false }
  ],
  'foot-care': [
    { id: 'gloves', name: 'Gloves', found: false },
    { id: 'bath-towel', name: 'Bath Towels (2 pieces)', found: false },
    { id: 'lotion', name: 'Lotion', found: false },
    { id: 'soap', name: 'Soap', found: false },
    { id: 'basin', name: 'Basin with Water', found: false },
    { id: 'washcloth', name: 'Washcloth (2 pieces)', found: false }
  ],
  'mouth-care': [
    { id: 'gloves', name: 'Gloves', found: false },
    { id: 'bath-towel', name: 'Bath Towel', found: false },
    { id: 'wash-towel', name: 'Wash Towel', found: false },
    { id: 'toothpaste', name: 'Toothpaste', found: false },
    { id: 'denture-brush', name: 'Toothbrush', found: false },
    { id: 'cup-water', name: 'Cup of Water', found: false }
  ],
  'perineal-care-female': [
    { id: 'gloves', name: 'Gloves (2 pairs)', found: false },
    { id: 'washcloth', name: 'Colored Wash Cloths (4 pieces)', found: false },
    { id: 'soap', name: 'Soap', found: false },
    { id: 'basin', name: 'Basin', found: false },
    { id: 'disposable-bed-pad', name: 'Disposable Pad', found: false },
    { id: 'bath-towel', name: 'Bath Towel (2 pieces)', found: false }
  ],
  'transfer-bed-wheelchair': [
    { id: 'transfer-belt', name: 'Transfer Belt', found: false },
    { id: 'wheelchair', name: 'Wheelchair with Footrest', found: false }
  ],
  'manual-blood-pressure': [
    { id: 'alcohol-wipes', name: 'Alcohol Wipes (2 pieces)', found: false },
    { id: 'bp-machine-manual', name: 'Manual BP Machine', found: false },
    { id: 'stethoscope', name: 'Trainer Stethoscope with Two Earpieces', found: false }
  ]
};

// Default to hand hygiene skill for demo
const DEFAULT_SKILL = 'hand-hygiene';

function InteractiveScenarioPage({ skillId = DEFAULT_SKILL, onBackToHub }) {
  const [currentStep, setCurrentStep] = useState(SCENARIO_STEPS.GATHERING_SUPPLIES);
  const [supplies, setSupplies] = useState(SKILL_SUPPLIES[skillId] || SKILL_SUPPLIES[DEFAULT_SKILL]);
  const [collectedSupplies, setCollectedSupplies] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [skillScenario, setSkillScenario] = useState(null);
  const [completedSkillSteps, setCompletedSkillSteps] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [userProgress, setUserProgress] = useState(null);

  useEffect(() => {
    // Initialize skill scenario and progress tracking
    const scenario = CNA_SKILL_SCENARIOS[skillId] || CNA_SKILL_SCENARIOS[DEFAULT_SKILL];
    setSkillScenario(scenario);
    setStartTime(Date.now());
    
    // Initialize progress tracking
    const initializeProgress = async () => {
      try {
        if (scenario && scenario.steps) {
          await progressService.initializeSkillProgress(skillId, scenario.steps.length);
          const progress = await progressService.getSkillProgress(skillId);
          setUserProgress(progress);
        }
      } catch (error) {
        console.error('Error initializing progress:', error);
      }
    };
    
    initializeProgress();
    
    const handleSinkUsed = (event) => {
      const supplyId = event.detail.supplyId;
      if (supplyId === 'sink') {
        setSupplies(prev => prev.map(s => 
          s.id === 'sink' ? { ...s, found: true } : s
        ));
        setCollectedSupplies(prev => {
          const sinkSupply = supplies.find(s => s.id === 'sink');
          if (sinkSupply && !prev.some(p => p.id === 'sink')) {
            return [...prev, { ...sinkSupply, found: true }];
          }
          return prev;
        });
      }
    };

    window.addEventListener('sinkUsed', handleSinkUsed);
    return () => window.removeEventListener('sinkUsed', handleSinkUsed);
  }, [supplies, skillId]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (currentStep === SCENARIO_STEPS.GATHERING_SUPPLIES) {
      if (over.id === 'supply-collector') {
        const supplyId = active.id;
        // Only allow required supplies to be collected
        const requiredSupply = supplies.find(s => s.id === supplyId);
        
        if (requiredSupply && !requiredSupply.found) {
          setSupplies(prev => prev.map(s => 
            s.id === supplyId ? { ...s, found: true } : s
          ));
          setCollectedSupplies(prev => [...prev, requiredSupply]);
        }
      }
    } else if (currentStep === SCENARIO_STEPS.PERFORMING_SKILL) {
      // Handle skill performance with validation
      const supplyId = active.id;
      const dropZoneId = over.id;
      
      // Check if this is a valid drop for the current skill
      if (skillScenario) {
        const validStep = skillScenario.steps.find(step => 
          step.dropZone === dropZoneId && 
          (!step.requiredSupply || step.requiredSupply === supplyId)
        );
        
        if (validStep && !completedSkillSteps.includes(validStep.id)) {
          setCompletedSkillSteps(prev => [...prev, validStep.id]);
          console.log(`Step completed: ${validStep.name}`);
          
          // Call the drop zone's onDropSuccess callback if it exists
          if (over.data?.current?.onDropSuccess) {
            over.data.current.onDropSuccess(supplyId);
          }
        } else {
          console.log(`Invalid drop: ${supplyId} on ${dropZoneId}`);
        }
      }
    }
  };

  const proceedToNextStep = async () => {
    if (currentStep === SCENARIO_STEPS.GATHERING_SUPPLIES) {
      setCurrentStep(SCENARIO_STEPS.PERFORMING_SKILL);
      // Tasks are now generated dynamically via getCurrentTasks()
    } else if (currentStep === SCENARIO_STEPS.PERFORMING_SKILL) {
      setCurrentStep(SCENARIO_STEPS.SCENARIO_COMPLETE);
      
      // Save progress when scenario is completed
      const endTime = Date.now();
      const duration = startTime ? Math.floor((endTime - startTime) / 1000) : 0;
      setSessionDuration(duration);
      
      // Calculate score based on completed steps
      const totalSteps = skillScenario?.steps?.length || 1;
      const score = Math.min(100, Math.round((completedSkillSteps.length / totalSteps) * 100));
      
      // Update patient simulation progress
      const completedStepsData = completedSkillSteps.map(stepId => ({
        stepId,
        completedAt: new Date()
      }));
      
      try {
        await progressService.updatePatientSimProgress(skillId, totalSteps, completedStepsData, score, duration);
        
        // Award star for completing simulation
        await progressService.awardStar(skillId, 'simulation');
        
        console.log('Progress saved successfully', {
          skillId,
          totalSteps,
          completedSteps: completedStepsData.length,
          score,
          duration
        });
      } catch (error) {
        console.error('Error saving progress:', error);
        console.error('Progress save error details:', {
          skillId,
          totalSteps,
          completedSteps: completedStepsData,
          score,
          duration,
          errorMessage: error.message,
          errorResponse: error.response?.data
        });
      }
    }
  };

  const getTasksForSkill = (skill) => {
    // Return skill-specific tasks based on scenario steps
    if (skillScenario && skillScenario.steps) {
      return skillScenario.steps.map(step => ({
        id: step.id,
        name: step.name,
        completed: completedSkillSteps.includes(step.id)
      }));
    }
    
    // Fallback to basic tasks
    const basicTasks = [
      { id: 'sanitize', name: 'Sanitize hands/knock', completed: false },
      { id: 'explain', name: 'Explain procedure to client', completed: false },
      { id: 'privacy', name: 'Provide privacy with curtain/screen/door', completed: false },
      { id: 'perform', name: 'Perform skill according to protocol', completed: false },
      { id: 'safety', name: 'Ensure signaling device is within reach', completed: false },
      { id: 'wash', name: 'Wash hands after completing skill', completed: false }
    ];
    return basicTasks;
  };

  const getCurrentTasks = () => {
    switch (currentStep) {
      case SCENARIO_STEPS.GATHERING_SUPPLIES:
        return supplies.map(supply => ({
          id: supply.id,
          name: `Find ${supply.name}`,
          completed: supply.found
        }));
      case SCENARIO_STEPS.PERFORMING_SKILL:
        // Always return dynamically updated tasks based on completed steps
        return getTasksForSkill(skillId);
      default:
        return [];
    }
  };

  const allSuppliesFound = supplies.every(supply => supply.found);
  const allTasksCompleted = getCurrentTasks().every(task => task.completed);

  const getSkillTitle = (skill) => {
    const skillTitles = {
      'hand-hygiene': 'Hand Hygiene (Hand Washing)',
      'elastic-stocking': 'Applies One Knee-High Elastic Stocking',
      'ambulate-transfer-belt': 'Assists to Ambulate Using Transfer Belt',
      'bedpan-use': 'Assists with Use of Bedpan',
      'denture-cleaning': 'Cleans Upper or Lower Denture',
      'radial-pulse': 'Counts and Records Radial Pulse',
      'respirations': 'Counts and Records Respirations',
      'ppe-gown-gloves': 'Donning and Removing PPE (Gown and Gloves)',
      'dressing-affected-arm': 'Dresses Client with Affected (Weak) Right Arm',
      'feeding-client': 'Feeds Client Who Cannot Feed Self',
      'modified-bed-bath': 'Gives Modified Bed Bath',
      'electronic-blood-pressure': 'Measures and Records Electronic Blood Pressure',
      'urinary-output': 'Measures and Records Urinary Output',
      'weight-measurement': 'Measures and Records Weight of Ambulatory Client',
      'prom-knee-ankle': 'Performs Modified Passive Range of Motion (Knee and Ankle)',
      'prom-shoulder': 'Performs Modified Passive Range of Motion (Shoulder)',
      'position-on-side': 'Positions Resident on One Side',
      'catheter-care-female': 'Provides Catheter Care for Female',
      'foot-care': 'Provides Foot Care on One Foot',
      'mouth-care': 'Provides Mouth Care',
      'perineal-care-female': 'Provides Perineal Care for Female',
      'transfer-bed-wheelchair': 'Transfers from Bed to Wheelchair Using Transfer Belt',
      'manual-blood-pressure': 'Measures and Records Manual Blood Pressure'
    };
    return skillTitles[skill] || 'CNA Skill Practice';
  };

  const handleBackToHub = () => {
    if (onBackToHub) {
      onBackToHub();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case SCENARIO_STEPS.GATHERING_SUPPLIES:
        return <SupplyRoom supplies={supplies} selectedSkill={skillId} />;
      case SCENARIO_STEPS.PERFORMING_SKILL:
        return <PatientRoom 
          collectedSupplies={collectedSupplies} 
          skillId={skillId}
          completedSkillSteps={completedSkillSteps}
          onStepComplete={(stepId) => {
            if (!completedSkillSteps.includes(stepId)) {
              setCompletedSkillSteps(prev => [...prev, stepId]);
            }
          }}
        />;
      case SCENARIO_STEPS.SCENARIO_COMPLETE:
        const totalSteps = skillScenario?.steps?.length || 1;
        const score = Math.round((completedSkillSteps.length / totalSteps) * 100);
        const formattedDuration = sessionDuration > 0 ? 
          `${Math.floor(sessionDuration / 60)}:${String(sessionDuration % 60).padStart(2, '0')}` : 
          '0:00';
        
        return (
          <div className="scenario-complete-container">
            <h2 id="interactive-scenario-complete-h2">🎉 Scenario Complete!</h2>
            <p id="interactive-scenario-complete-p">Congratulations! You have successfully completed the {getSkillTitle(skillId)} scenario.</p>
            
            <div className="progress-summary">
              <h3>Your Performance:</h3>
              <div className="progress-stats">
                <div className="stat-item">
                  <span className="stat-label">Score:</span>
                  <span className="stat-value">{score}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Steps Completed:</span>
                  <span className="stat-value">{completedSkillSteps.length}/{totalSteps}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Time:</span>
                  <span className="stat-value">{formattedDuration}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleBackToHub}
              className="scenario-button"
            >
              Try Another Scenario
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="interactive-scenario-container">
        <button 
          onClick={handleBackToHub}
          className="exit-button"
          title="Exit Simulation"
        >
          ✕
        </button>
        <div className="scenario-main-content">
          <div className="scenario-header">
            <button 
              onClick={handleBackToHub}
              className="scenario-button back-button"
            >
              ← Back to Learning Hub
            </button>
            <h1 id="interactive-scenario-h1">CNA Skill: {getSkillTitle(skillId)}</h1>
          </div>
          <div className="scenario-step-info">
            <h3 id="interactive-scenario-h3">Current Step: {currentStep.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</h3>
            {currentStep === SCENARIO_STEPS.GATHERING_SUPPLIES && (
              <p id="interactive-scenario-gathering-supplies-p">Find all required supplies in the supply room before proceeding to perform the skill.</p>
            )}
            {currentStep === SCENARIO_STEPS.PERFORMING_SKILL && (
              <p id="interactive-scenario-performing-skill-p">Follow the proper sequence to perform the {getSkillTitle(skillId)} skill.</p>
            )}
          </div>
          
          {renderCurrentStep()}
          
          {currentStep === SCENARIO_STEPS.GATHERING_SUPPLIES && allSuppliesFound && (
            <button 
              onClick={proceedToNextStep}
              className="scenario-button success"
            >
              Proceed to Skill Performance
            </button>
          )}
          
          {currentStep === SCENARIO_STEPS.PERFORMING_SKILL && allTasksCompleted && (
            <button 
              onClick={proceedToNextStep}
              className="scenario-button success"
            >
              Complete Scenario
            </button>
          )}
        </div>
        
        <div className="scenario-sidebar">
          <TaskList tasks={getCurrentTasks()} />
          
          {collectedSupplies.length > 0 && (
            <div className="collected-supplies-container">
              <h3 id="interactive-scenario-collected-supplies-h3">Collected Supplies</h3>
              <div className="collected-supplies-grid">
                {collectedSupplies.map(supply => (
                  <DraggableItem 
                    key={`collected-${supply.id}`}
                    id={supply.id}
                    name={supply.name}
                    isCollected={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <DragOverlay>
        {activeId ? (
          <DraggableItem 
            id={activeId} 
            name={supplies.find(s => s.id === activeId)?.name || collectedSupplies.find(s => s.id === activeId)?.name || activeId}
            isDragging={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default InteractiveScenarioPage;