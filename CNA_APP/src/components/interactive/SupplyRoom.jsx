import React, { useState } from 'react';
import DraggableItem from './DraggableItem';
import DropZone from './DropZone';
import DraggableSupplyCollection from './DraggableSupplyCollection';
import '../../styles/interactive/SupplyRoom.css';

function SupplyRoom({ supplies, selectedSkill, collectedSupplies = [] }) {
  const [selectedCabinet, setSelectedCabinet] = useState(null);
  const [sinkUsed, setSinkUsed] = useState(false);
  const [showTip, setShowTip] = useState(true);

  const cabinetCategories = {
    linens: {
      title: "Linens & Barriers",
      color: "#e3f2fd",
      supplies: [
        { id: 'bath-towel', name: 'Bath Towel' },
        { id: 'cloth-protector', name: 'Cloth Protector' },
        { id: 'disposable-bed-pad', name: 'Disposable Bed Pad' },
        { id: 'disposable-bed-protector', name: 'Disposable Bed Protector' },
        { id: 'gown', name: 'Gown' },
        { id: 'liner-towel', name: 'Liner Towel' },
        { id: 'paper-towel', name: 'Paper Towel' },
        { id: 'pillows', name: 'Pillows' },
        { id: 'shirts', name: 'Shirts (front-buttoned)' },
        { id: 'wash-towel', name: 'Wash Towel' },
        { id: 'washcloth', name: 'Washcloth' },
        { id: 'barrier-paper-towel', name: 'Barrier Paper Towel' }
      ]
    },
    cleaning: {
      title: "Cleaning & Hygiene Products",
      color: "#e8f5e8",
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
      title: "Medical Devices & Equipment",
      color: "#fff3e0",
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
        { id: 'wheelchair', name: 'Wheelchair' }
      ]
    },
    containers: {
      title: "Containers & Utensils",
      color: "#f3e5f5",
      supplies: [
        { id: 'basin', name: 'Basin' },
        { id: 'cup-water', name: 'Cup of Water' },
        { id: 'denture-container', name: 'Denture Container with Lid' },
        { id: 'fork', name: 'Fork' },
        { id: 'food-tray', name: 'Tray (for food)' },
        { id: 'trashcan', name: 'Trashcan' }
      ]
    },
    ppe: {
      title: "Personal Protective Equipment (PPE)",
      color: "#ffebee",
      supplies: [
        { id: 'gloves', name: 'Gloves' }
      ]
    },
    misc: {
      title: "Miscellaneous",
      color: "#fafafa",
      supplies: [
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

  // Check if current skill requires sink
  const requiresSink = supplies.some(s => s.id === 'sink');


  if (selectedCabinet) {
    const cabinet = cabinetCategories[selectedCabinet];
    return (
      <div className="cabinet-interior-view">
        <div className="cabinet-header">
          <button className="cabinet-back-button" onClick={handleBackToRoom}>
            ← Back to Supply Room
          </button>
          <h2 className="cabinet-title">{cabinet.title}</h2>
        </div>
        
        <div className="cabinet-supplies-grid" style={{ backgroundColor: cabinet.color }}>
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
    );
  }


  return (
    <div>
      <h2>Supply Room</h2>
      <p>Click on cabinets and shelves to explore their contents. Find and collect all required supplies.</p>
      
      <div className="supply-room-container">
        {/* Cabinets arranged around sink with 10px gaps */}
        {/* Top Row - Above sink */}
        <div 
          className="cabinet linens"
          onClick={() => handleCabinetClick('linens')}
          title="Linens & Barriers"
          style={{ 
            top: 'calc(45% - 80px)', // Sink top minus 60px height minus 10px gap minus 70px cabinet height
            left: 'calc(50% - 140px)' // Left of sink with gap
          }}
        >
          <div className="cabinet-label">Linens & Barriers</div>
          <div className="cabinet-icon">🛏️</div>
        </div>
        
        <div 
          className="cabinet cleaning"
          onClick={() => handleCabinetClick('cleaning')}
          title="Cleaning & Hygiene Products"
          style={{ 
            top: 'calc(45% - 80px)', // Above sink
            left: 'calc(50% - 45px)' // Center aligned with sink
          }}
        >
          <div className="cabinet-label">Cleaning & Hygiene</div>
          <div className="cabinet-icon">🧼</div>
        </div>

        <div 
          className="cabinet medical"
          onClick={() => handleCabinetClick('medical')}
          title="Medical Devices & Equipment"
          style={{ 
            top: 'calc(45% - 80px)', // Above sink
            left: 'calc(50% + 50px)' // Right of sink with gap
          }}
        >
          <div className="cabinet-label">Medical Equipment</div>
          <div className="cabinet-icon">🩺</div>
        </div>
        
        {/* Bottom Row - Below sink */}
        <div 
          className="cabinet containers"
          onClick={() => handleCabinetClick('containers')}
          title="Containers & Utensils"
          style={{ 
            top: 'calc(45% + 70px)', // Sink bottom plus 60px height plus 10px gap
            left: 'calc(50% - 140px)' // Left of sink with gap
          }}
        >
          <div className="cabinet-label">Containers & Utensils</div>
          <div className="cabinet-icon">🍽️</div>
        </div>
        
        <div 
          className="cabinet ppe"
          onClick={() => handleCabinetClick('ppe')}
          title="Personal Protective Equipment"
          style={{ 
            top: 'calc(45% + 70px)', // Below sink
            left: 'calc(50% - 45px)' // Center aligned with sink
          }}
        >
          <div className="cabinet-label">PPE</div>
          <div className="cabinet-icon">🧤</div>
        </div>
        
        <div 
          className="cabinet misc"
          onClick={() => handleCabinetClick('misc')}
          title="Miscellaneous"
          style={{ 
            top: 'calc(45% + 70px)', // Below sink
            left: 'calc(50% + 50px)' // Right of sink with gap
          }}
        >
          <div className="cabinet-label">Miscellaneous</div>
          <div className="cabinet-icon">📋</div>
        </div>

        {/* Sink */}
        {requiresSink && (
          <div 
            className={`sink ${sinkUsed ? 'sink-used' : ''}`}
            onClick={handleSinkClick}
            title="Click to use sink"
            style={{ 
              top: '45%', 
              left: 'calc(50% - 40px)',
              width: '80px', 
              height: '60px'
            }}
          >
            <div>{sinkUsed ? '✅ Sink Used' : '🚿 Sink'}</div>
          </div>
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
              Click on any cabinet or shelf to see what's inside
              {requiresSink && <><br />🚿 Click the sink to use it</>}
            </div>
          </div>
        )}
      </div>

      <DraggableSupplyCollection collectedSupplies={collectedSupplies} />
    </div>
  );
}

export default SupplyRoom;