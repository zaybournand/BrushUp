import React, { useState } from 'react';
import './Reference.css';

const referenceImages = {
  Shading: [
    '/images/shading-example.jpg',
    '/images/shading-example2.jpg',
  ],
  Eyes: [
    '/images/eyes-example.jpg',
    '/images/eyes-example2.jpg',
  ],
  Structure: [
    '/images/structure-example.jpg',
    '/images/structure-example2.jpg',
  ],
};

const referenceTips = {
  Shading: [
    "Start with light pencil strokes and build up gradually.",
    "Understand your light source before you begin.",
    "Use a blending stump or tissue for smooth shading."
  ],
  Eyes: [
    "Always draw the eyelid and eye socket—not just the iris.",
    "Add reflections for realism, but don’t overdo it.",
    "Use reference photos to study subtle anatomy differences."
  ],
  Structure: [
    "Break objects down into basic shapes like cubes and cylinders.",
    "Use perspective lines to keep proportions accurate.",
    "Sketch lightly and revise structure before adding detail."
  ]
};

const Reference = ({ goBackHome }) => {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleSkillChange = (skill) => {
    setSelectedSkill(skill);
    setCurrentImageIndex(0);
  };

  const handleNewImage = () => {
    if (!selectedSkill) return;
    const total = referenceImages[selectedSkill].length;
    setCurrentImageIndex((prev) => (prev + 1) % total);
  };

  const getCurrentImageUrl = () => {
    return selectedSkill ? referenceImages[selectedSkill][currentImageIndex] : '';
  };

  return (
    <div className="reference-container">
      {/* Back Button */}
      <div className="back-button-container">
        <button onClick={goBackHome} className="back-button">
          ⬅ Home
        </button>
      </div>

      <h1 className="reference-title">Reference Library</h1>
      <p className="reference-subtitle">
        Choose a skill to explore drawing references and get helpful tips!
      </p>

      <div className="reference-toolbar">
        <label htmlFor="skill-select">Select Skill:</label>
        <select
          id="skill-select"
          value={selectedSkill}
          onChange={(e) => handleSkillChange(e.target.value)}
        >
          <option value="">-- Select --</option>
          <option value="Shading">Shading</option>
          <option value="Eyes">Eyes</option>
          <option value="Structure">Structure</option>
        </select>
        
        <button onClick={handleNewImage} disabled={!selectedSkill}>
          New
        </button>
      </div>

      {selectedSkill && (
        <>
          {/* Only this will print */}
          <div className="print-area">
            <img
              src={getCurrentImageUrl()}
              alt={`Reference ${selectedSkill}`}
              className="reference-preview"
            />
          </div>

          <div className="download-buttons">
            <a
              href={getCurrentImageUrl()}
              download={`BrushUp-${selectedSkill}.jpg`}
              className="download-button"
            >
              Download
            </a>
            <button
              className="download-button"
              onClick={() => window.print()}
            >
              Print
            </button>
          </div>

          <div className="reference-tips">
            <h2>Tips for {selectedSkill}</h2>
            <ul>
              {referenceTips[selectedSkill].map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Reference;
