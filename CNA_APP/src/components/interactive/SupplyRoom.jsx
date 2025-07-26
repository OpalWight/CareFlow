import React, { useState } from 'react';
import DraggableItem from './DraggableItem';
import DropZone from './DropZone';
import '../../styles/interactive/SupplyRoom.css';

function SupplyRoom({ supplies, selectedSkill }) {
  const [selectedCabinet, setSelectedCabinet] = useState(null);
  const [sinkUsed, setSinkUsed] = useState(false);

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

  const getSupplyIcon = (supplyId) => {
    const iconMap = {
      // Linens & Barriers
      'bath-towel': '🛁', 'cloth-protector': '🛡️', 'disposable-bed-pad': '🛏️',
      'disposable-bed-protector': '🛏️', 'gown': '👘', 'liner-towel': '🧻',
      'paper-towel': '🧻', 'pillows': '🛏️', 'shirts': '👔', 'wash-towel': '🧽',
      'washcloth': '🧽', 'barrier-paper-towel': '🧻',
      // Cleaning & Hygiene
      'alcohol-wipes': '🧼', 'denture-paste': '🦷', 'hand-wipe': '🧼',
      'lotion': '🧴', 'soap': '🧼', 'toilet-paper': '🧻', 'toothpaste': '🦷',
      'warm-water': '💧',
      // Medical Equipment
      'bed-pan': '🚽', 'bp-machine-electronic': '🩺', 'bp-machine-manual': '🩺',
      'denture-brush': '🦷', 'elastic-stocking': '🧦', 'emesis-basin': '🥣',
      'graduated-cylinder': '🧪', 'standing-scale': '⚖️', 'stethoscope': '🩺',
      'transfer-belt': '🔗', 'wheelchair': '♿',
      // Containers & Utensils
      'basin': '🥣', 'cup-water': '🥤', 'denture-container': '📦',
      'fork': '🍴', 'food-tray': '🍽️', 'trashcan': '🗑️',
      // PPE
      'gloves': '🧤',
      // Miscellaneous
      'diet-card': '📋', 'magazine': '📺', 'non-skid-socks': '🧦',
      'sink': '🚿', 'wall-clock': '🕐',
      // Original supplies
      'bandage': '🩹', 'antiseptic': '🧴', 'gauze': '🏥'
    };
    return iconMap[supplyId] || '📦';
  };

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
          <p id="cabinet-instructions-p">💡 Drag the supplies you need to the collection area below</p>
        </div>
        
        {/* Collection area in cabinet view */}
        <div className="cabinet-collection-area">
          <DropZone 
            id="supply-collector"
            label="Supply Collection Area - Drop supplies here"
            style={{
              minHeight: '80px',
              backgroundColor: '#fff3cd',
              borderColor: '#ffc107'
            }}
          >
            <div className="collection-icon">📦</div>
            <div className="collection-text">
              Drop collected supplies here
            </div>
          </DropZone>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 id="supply-room-h2">Supply Room</h2>
      <p id="supply-room-p">Click on cabinets and shelves to explore their contents. Find and collect all required supplies.</p>
      
      <div className="supply-room-container">
        {/* Clickable Cabinets */}
        <div 
          className="supply-room-cabinet clickable-cabinet linens"
          onClick={() => handleCabinetClick('linens')}
          title="Linens & Barriers"
          style={{ top: '20px', right: '20px' }}
        >
          <div className="cabinet-label">Linens & Barriers</div>
          <div className="cabinet-icon">🛏️</div>
        </div>
        
        <div 
          className="supply-room-cabinet clickable-cabinet cleaning"
          onClick={() => handleCabinetClick('cleaning')}
          title="Cleaning & Hygiene Products"
          style={{ top: '15%', right: '20px' }}
        >
          <div className="cabinet-label">Cleaning & Hygiene</div>
          <div className="cabinet-icon">🧼</div>
        </div>

        <div 
          className="supply-room-shelf clickable-cabinet medical"
          onClick={() => handleCabinetClick('medical')}
          title="Medical Devices & Equipment"
          style={{ top: '50%', right: '20px' }}
        >
          <div className="cabinet-label">Medical Equipment</div>
          <div className="cabinet-icon">🩺</div>
        </div>
        
        <div 
          className="supply-room-cabinet clickable-cabinet containers"
          onClick={() => handleCabinetClick('containers')}
          title="Containers & Utensils"
          style={{ top: '65%', right: '20px', width: '100px', height: '70px' }}
        >
          <div className="cabinet-label">Containers & Utensils</div>
          <div className="cabinet-icon">🍽️</div>
        </div>
        
        <div 
          className="supply-room-counter clickable-cabinet ppe"
          onClick={() => handleCabinetClick('ppe')}
          title="Personal Protective Equipment"
          style={{ bottom: '20px', left: '20px' }}
        >
          <div className="cabinet-label">PPE</div>
          <div className="cabinet-icon">🧤</div>
        </div>
        
        <div 
          className="supply-room-cabinet clickable-cabinet misc"
          onClick={() => handleCabinetClick('misc')}
          title="Miscellaneous"
          style={{ top: '40%', left: '20px', width: '90px', height: '80px' }}
        >
          <div className="cabinet-label">Miscellaneous</div>
          <div className="cabinet-icon">📋</div>
        </div>

        {/* Sink - clickable element for hand hygiene */}
        {requiresSink && (
          <div 
            className={`supply-room-sink ${sinkUsed ? 'sink-used' : ''}`}
            onClick={handleSinkClick}
            title="Click to use sink"
            style={{ bottom: '30%', right: '30%', width: '80px', height: '60px' }}
          >
            <div className="sink-label">{sinkUsed ? '✅ Sink Used' : '🚿 Sink'}</div>
          </div>
        )}

        {/* Room decoration */}
        <div className="supply-room-title">
          🏥 Medical Supply Room - Click cabinets to explore
        </div>
        
        {/* Click instruction */}
        <div className="room-click-instruction">
          💡 Click on any cabinet or shelf to see what's inside
          {requiresSink && <><br />🚿 Click the sink to use it</>}
        </div>
      </div>

      {/* Collection area */}
      <div className="supply-collection-area">
        <DropZone 
          id="supply-collector"
          label="Supply Collection Area - Drop supplies here"
          style={{
            minHeight: '100px',
            backgroundColor: '#fff3cd',
            borderColor: '#ffc107'
          }}
        >
          <div className="collection-icon">📦</div>
          <div className="collection-text">
            Drop collected supplies here
          </div>
        </DropZone>
      </div>
    </div>
  );
}

export default SupplyRoom;