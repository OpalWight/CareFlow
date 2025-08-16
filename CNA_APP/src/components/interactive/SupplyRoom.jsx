import React, { useState, useEffect } from 'react';
import DraggableItem from './DraggableItem';
import DropZone from './DropZone';
import DraggableSupplyCollection from './DraggableSupplyCollection';
import '../../styles/interactive/SupplyRoom.css';
import HygieneSvg from '../../assets/svg/Hygiene.svg';
import LinensSvg from '../../assets/svg/Linens.svg';
import MedicalSvg from '../../assets/svg/Medical.svg';
import MiscSvg from '../../assets/svg/misc.svg';
import PaperTowelSvg from '../../assets/svg/paperTowel.svg';
import SinkSvg from '../../assets/svg/sink.svg';

function SupplyRoom({ supplies, selectedSkill, collectedSupplies = [] }) {
  const [selectedCabinet, setSelectedCabinet] = useState(null);
  const [sinkUsed, setSinkUsed] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [pulsatingElement, setPulsatingElement] = useState(null);

  const cabinetCategories = {
    linens: {
      title: "Linens & Barriers",
      color: "#e3f2fd",
      svg: LinensSvg,
      supplies: [
        { id: 'bath-towel', name: 'Bath Towel' },
        { id: 'cloth-protector', name: 'Cloth Protector' },
        { id: 'disposable-bed-pad', name: 'Disposable Bed Pad' },
        { id: 'disposable-bed-protector', name: 'Disposable Bed Protector' },
        { id: 'gown', name: 'Gown' },
        { id: 'liner-towel', name: 'Liner Towel' },
        { id: 'pillows', name: 'Pillows' },
        { id: 'shirts', name: 'Shirts (front-buttoned)' },
        { id: 'wash-towel', name: 'Wash Towel' },
        { id: 'washcloth', name: 'Washcloth' },
        { id: 'barrier-paper-towel', name: 'Barrier Paper Towel' }
      ]
    },
    hygiene: {
      title: "Cleaning & Hygiene",
      color: "#e8f5e8",
      svg: HygieneSvg,
      supplies: [
        { id: 'alcohol-wipes', name: 'Alcohol Wipes' },
        { id: 'antiseptic', name: 'Antiseptic' },
        { id: 'denture-paste', name: 'Denture Paste' },
        { id: 'hand-wipe', name: 'Hand Wipe' },
        { id: 'lotion', name: 'Lotion' },
        { id: 'soap', name: 'Soap' },
        { id: 'toilet-paper', name: 'Toilet Paper' },
        { id: 'toothpaste', name: 'Toothpaste' },
        { id: 'warm-water', name: 'Warm Water' }
      ]
    },
    medical: {
      title: "Medical Equipment",
      color: "#fff3e0",
      svg: MedicalSvg,
      supplies: [
        { id: 'bandage', name: 'Bandage' },
        { id: 'bed-pan', name: 'Bed Pan' },
        { id: 'bp-machine-electronic', name: 'Blood Pressure Machine (Electronic)' },
        { id: 'bp-machine-manual', name: 'Blood Pressure Machine (Manual)' },
        { id: 'denture-brush', name: 'Denture Brush/Toothbrush' },
        { id: 'elastic-stocking', name: 'Elastic Stocking' },
        { id: 'emesis-basin', name: 'Emesis Basin' },
        { id: 'gauze', name: 'Gauze Pads' },
        { id: 'graduated-cylinder', name: 'Graduated Cylinder' },
        { id: 'standing-scale', name: 'Standing Scale' },
        { id: 'stethoscope', name: 'Stethoscope (Trainer)' },
        { id: 'transfer-belt', name: 'Transfer/Gait Belt' },
        { id: 'wheelchair', name: 'Wheelchair' },
        { id: 'gloves', name: 'Gloves' }
      ]
    },
    misc: {
      title: "Misc",
      color: "#f3e5f5",
      svg: MiscSvg,
      supplies: [
        { id: 'basin', name: 'Basin' },
        { id: 'cup-water', name: 'Cup of Water' },
        { id: 'denture-container', name: 'Denture Container with Lid' },
        { id: 'fork', name: 'Fork' },
        { id: 'food-tray', name: 'Tray (for food)' },
        { id: 'trashcan', name: 'Trashcan' },
        { id: 'diet-card', name: 'Diet Card' },
        { id: 'magazine', name: 'Magazine/TV Remote' },
        { id: 'non-skid-socks', name: 'Non-skid Socks' },
        { id: 'wall-clock', name: 'Wall Clock' }
      ]
    }
  };

  const handleCabinetClick = (cabinetKey) => {
    setSelectedCabinet(cabinetKey);
  };

  const handleBackToRoom = () => {
    setSelectedCabinet(null);
  };

  const handleSinkClick = () => {
    setSinkUsed(true);
    // Simulate marking sink as "found" for hand hygiene scenarios
    if (supplies.some(s => s.id === 'sink')) {
      // Dispatch a custom event to notify parent component
      const event = new CustomEvent('sinkUsed', { detail: { supplyId: 'sink' } });
      window.dispatchEvent(event);
    }
  };

  const handlePaperTowelClick = () => {
    // Dispatch a custom event to notify parent component that paper towel was found
    const event = new CustomEvent('supplyFound', { detail: { supplyId: 'paper-towel' } });
    window.dispatchEvent(event);
  };

  // Check if current skill requires sink
  const requiresSink = supplies.some(s => s.id === 'sink');

  useEffect(() => {
    const handleTaskItemClick = (event) => {
      const { taskId, taskName, task } = event.detail;
      
      // Map task to supply item and find which cabinet contains it
      let targetCabinetKey = null;
      let targetSupplyId = null;
      
      // Extract supply ID from task name (e.g., "Find Soap" -> "soap")
      if (taskName.startsWith('Find ')) {
        const supplyName = taskName.replace('Find ', '').toLowerCase();
        
        // Find which cabinet contains this supply
        for (const [cabinetKey, cabinet] of Object.entries(cabinetCategories)) {
          const supply = cabinet.supplies.find(s => 
            s.name.toLowerCase().includes(supplyName) || 
            s.id.toLowerCase().includes(supplyName) ||
            supplyName.includes(s.name.toLowerCase()) ||
            supplyName.includes(s.id.toLowerCase())
          );
          if (supply) {
            targetCabinetKey = cabinetKey;
            targetSupplyId = supply.id;
            break;
          }
        }
        
        // Special case for sink
        if (supplyName.includes('sink') || supplyName.includes('water')) {
          targetSupplyId = 'sink';
        }
        
        // Special case for standalone paper towel
        if (supplyName.includes('paper towel') || supplyName === 'paper-towel') {
          targetSupplyId = 'paper-towel';
        }
      }
      
      // Apply pulsating effect
      if (targetCabinetKey) {
        pulsateElement(`.svg-button.${targetCabinetKey}`);
      } else if (targetSupplyId === 'sink') {
        pulsateElement('.svg-button.sink');
      } else if (targetSupplyId === 'paper-towel') {
        pulsateElement('.svg-button.paper-towel-standalone');
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && selectedCabinet) {
        handleBackToRoom();
      }
    };

    window.addEventListener('taskItemClicked', handleTaskItemClick);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('taskItemClicked', handleTaskItemClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCabinet]);

  const pulsateElement = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
      // Remove existing pulsate class if present
      element.classList.remove('pulsate-highlight');
      
      // Force reflow
      element.offsetHeight;
      
      // Add pulsate class
      element.classList.add('pulsate-highlight');
      
      // Remove the class after animation completes
      setTimeout(() => {
        element.classList.remove('pulsate-highlight');
      }, 6000); // 2s * 3 iterations = 6s
    }
  };


  const renderCabinetModal = () => {
    if (!selectedCabinet) return null;
    
    const cabinet = cabinetCategories[selectedCabinet];
    return (
      <>
        {/* Dark overlay */}
        <div className="cabinet-overlay" onClick={handleBackToRoom}></div>
        
        {/* Modal window */}
        <div className="cabinet-modal">
          <div className="cabinet-modal-header">
            <h2 className="cabinet-modal-title">{cabinet.title}</h2>
            <button className="cabinet-close-button" onClick={handleBackToRoom}>
              ✕
            </button>
          </div>
          
          <div className="cabinet-modal-content" style={{ backgroundColor: cabinet.color }}>
            <div className="cabinet-supplies-grid">
              {cabinet.supplies.map((supply, index) => {
                const position = {
                  top: `${15 + (Math.floor(index / 4) * 20)}%`,
                  left: `${10 + ((index % 4) * 20)}%`
                };
                
                return (
                  <div
                    key={supply.id}
                    className="cabinet-supply-position"
                    style={position}
                  >
                    <DraggableItem 
                      id={supply.id}
                      name={supply.name}
                    />
                  </div>
                );
              })}
            </div>
            
            <div className="cabinet-instructions">
              <p>💡 Drag the supplies you need to the collection area</p>
            </div>
          </div>
        </div>
      </>
    );
  };


  return (
    <div>
      <div className="supply-room-container">
        {/* SVG Buttons arranged around sink */}
        {/* Top Row - Above sink */}
        <img 
          src={LinensSvg}
          className="svg-button linens"
          onClick={() => handleCabinetClick('linens')}
          title="Linens & Barriers"
          alt="Linens & Barriers"
          style={{ 
            top: 'calc(45% - 100px)',
            left: 'calc(50% - 120px)'
          }}
        />
        
        <img 
          src={HygieneSvg}
          className="svg-button hygiene"
          onClick={() => handleCabinetClick('hygiene')}
          title="Cleaning & Hygiene"
          alt="Cleaning & Hygiene"
          style={{ 
            top: 'calc(45% - 100px)',
            left: 'calc(50% - 40px)'
          }}
        />

        <img 
          src={MedicalSvg}
          className="svg-button medical"
          onClick={() => handleCabinetClick('medical')}
          title="Medical Equipment"
          alt="Medical Equipment"
          style={{ 
            top: 'calc(45% - 100px)',
            left: 'calc(50% + 40px)'
          }}
        />
        
        {/* Bottom Row - Below sink */}
        <img 
          src={MiscSvg}
          className="svg-button misc"
          onClick={() => handleCabinetClick('misc')}
          title="Misc"
          alt="Misc"
          style={{ 
            top: 'calc(45% + 80px)',
            left: 'calc(50% - 80px)'
          }}
        />

        {/* Standalone Paper Towel */}
        <img 
          src={PaperTowelSvg}
          className="svg-button paper-towel-standalone"
          onClick={handlePaperTowelClick}
          title="Paper Towel"
          alt="Paper Towel"
          style={{ 
            top: 'calc(45% + 80px)',
            left: 'calc(50% + 40px)'
          }}
        />

        {/* Sink */}
        {requiresSink && (
          <img 
            src={SinkSvg}
            className={`svg-button sink ${sinkUsed ? 'sink-used' : ''}`}
            onClick={handleSinkClick}
            title={sinkUsed ? "Sink (Used)" : "Click to use sink"}
            alt={sinkUsed ? "Sink (Used)" : "Sink"}
            style={{ 
              top: '45%', 
              left: 'calc(50% - 30px)'
            }}
          />
        )}

        <div className="room-title">
          🏥 Medical Supply Room - Click cabinets to explore
        </div>
        
        {showTip && (
          <div className="tip-window">
            <div className="tip-header">
              <span className="tip-icon">💡</span>
              <span className="tip-title">Tips</span>
              <button 
                className="tip-close-btn"
                onClick={() => setShowTip(false)}
                aria-label="Close tip"
              >
                ✕
              </button>
            </div>
            <div className="tip-content">
              Click on items in checklist for a hint!
              {requiresSink && <><br />🚿 Click the sink to use it</>}
            </div>
          </div>
        )}
      </div>

      <DraggableSupplyCollection collectedSupplies={collectedSupplies} />
      
      {/* Render cabinet modal if one is selected */}
      {renderCabinetModal()}
    </div>
  );
}

export default SupplyRoom;