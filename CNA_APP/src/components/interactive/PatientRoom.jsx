import React from 'react';
import DropZone from './DropZone';
import '../../styles/interactive/PatientRoom.css';

function PatientRoom({ collectedSupplies }) {

  return (
    <div>
      <h2>Patient Room</h2>
      <p>Perform the wound care procedure by dragging supplies to the appropriate locations on the patient.</p>
      
      <div className="patient-room-container">
        {/* Hospital bed */}
        <div className="hospital-bed">
          {/* Patient representation */}
          <div className="patient-representation">
            {/* Patient head */}
            <div className="patient-head" />
            
            {/* Patient body */}
            <div className="patient-body">
              🏥
            </div>
            
            {/* Wound area on arm */}
            <div className="patient-wound" />
          </div>
        </div>

        {/* Drop zones around patient */}
        <div className="drop-zone-hands">
          <DropZone 
            id="patient-hands"
            label="Wash Hands Area"
            style={{ minHeight: '60px', backgroundColor: '#e3f2fd' }}
          >
            🚿 Sink
          </DropZone>
        </div>

        <div className="drop-zone-gloves">
          <DropZone 
            id="patient-gloves"
            label="Put on Gloves"
            style={{ minHeight: '60px', backgroundColor: '#f3e5f5' }}
          >
            🧤
          </DropZone>
        </div>

        <div className="drop-zone-wound">
          <DropZone 
            id="patient-wound"
            label="Clean Wound"
            style={{ minHeight: '60px', backgroundColor: '#ffebee' }}
          >
            🩸 Wound
          </DropZone>
        </div>

        <div className="drop-zone-gauze">
          <DropZone 
            id="patient-gauze"
            label="Apply Gauze"
            style={{ minHeight: '60px', backgroundColor: '#e8f5e8' }}
          >
            🏥 Apply Here
          </DropZone>
        </div>

        <div className="drop-zone-bandage">
          <DropZone 
            id="patient-bandage"
            label="Secure Bandage"
            style={{ minHeight: '60px', backgroundColor: '#fff3e0' }}
          >
            🩹 Secure
          </DropZone>
        </div>

        {/* Bedside table */}
        <div className="bedside-table">
          Bedside Table
        </div>

        {/* Room label */}
        <div className="room-title">
          🏥 Patient Room - Wound Care Station
        </div>

        {/* Instructions */}
        <div className="room-instructions">
          Follow proper procedure: Wash hands → Put on gloves → Clean wound → Apply gauze → Secure bandage
        </div>
      </div>
    </div>
  );
}

export default PatientRoom;