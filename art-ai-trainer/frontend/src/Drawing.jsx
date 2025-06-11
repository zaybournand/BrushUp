import React, { useRef, useState, useEffect } from 'react';
import './Drawing.css';

const imageMap = {
  Shading: [
    '/images/shading-example.jpg',
    '/images/shading-example2.jpg',
    '/images/shading-example3.jpg',
    '/images/shading-example4.jpg',
    '/images/shading-example5.jpg',
    '/images/shading-example6.jpg',
    '/images/shading-example7.jpg',
    '/images/shading-example8.jpg',
    '/images/shading-example9.jpg',
    '/images/shading-example10.jpg',
    '/images/shading-example11.jpg',
    '/images/shading-example12.jpg',
  ],
  Structure: [
    '/images/structure-example.jpg',
    '/images/structure-example2.jpg',
    '/images/structure-example3.jpg',
    '/images/structure-example4.jpg',
    '/images/structure-example5.jpg',
  ],
  Perspective: [
    '/images/perspective-example1.jpg',
    '/images/perspective-example2.jpg',
    '/images/perspective-example3.jpg',
    '/images/perspective-example4.jpg',
    '/images/perspective-example5.jpg',
    '/images/perspective-example6.jpg',
    '/images/perspective-example7.jpg',
    '/images/perspective-example8.jpg',
    '/images/perspective-example9.jpg',
    '/images/perspective-example10.jpg',
    '/images/perspective-example11.jpg',
    ],
    Anatomy: [
      '/images/anatomy-example1.jpg',
      '/images/anatomy-example2.jpg',
      '/images/anatomy-example3.jpg',
      '/images/anatomy-example4.jpg',
      '/images/anatomy-example5.jpg',
      '/images/anatomy-example6.jpg',
      '/images/anatomy-example7.jpg',
      '/images/anatomy-example8.jpg',
      '/images/anatomy-example9.jpg',
      '/images/anatomy-example10.jpg',
    ],
    Composition: [
      '/images/composition-example1.jpg',
      '/images/composition-example2.jpg',
      '/images/composition-example3.jpg',
      '/images/composition-example4.jpg',
      '/images/composition-example5.jpg',

    ],
};

const Drawing = ({ skill: initialSkill, onBack, aiGeneratedImageURL, selectedExistingDrawing, onAddToMyDrawings, initialImageIndex, shouldStartBlankCanvas }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [brushOpacity, setBrushOpacity] = useState(0.1);
  const [isEraser, setIsEraser] = useState(false);

  const [skill, setSkill] = useState(initialSkill || '');
  const [imageIndex, setImageIndex] = useState(initialImageIndex || 0);

  // Initialize isCanvasBlankMode from prop, but allow local state changes
  // MODIFIED: Use shouldStartBlankCanvas to initialize
  const [isCanvasBlankMode, setIsCanvasBlankMode] = useState(shouldStartBlankCanvas);

  // Determine the reference image URL based on priority:
  // Blank Mode > AI generated > Existing Drawing > Skill-based
  const referenceImage = isCanvasBlankMode // If in blank mode, always return empty
    ? ''
    : aiGeneratedImageURL
    ? aiGeneratedImageURL
    : selectedExistingDrawing
    ? selectedExistingDrawing.image_url
    : (skill && imageMap[skill])
      ? imageMap[skill][imageIndex % imageMap[skill].length]
      : ''; // Fallback to empty string if no image source


  const initialDrawingName = isCanvasBlankMode // Name for blank canvas
    ? `blank-drawing-${Date.now()}.png`
    : selectedExistingDrawing
    ? selectedExistingDrawing.name
    : aiGeneratedImageURL
    ? `ai-drawing-${Date.now()}.png`
    : `drawing-${Date.now()}.png`;
  const [drawingName] = useState(initialDrawingName);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.crossOrigin = "Anonymous";

    canvas.width = 800;
    canvas.height = 1000;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (referenceImage) {
      img.src = referenceImage;
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.width / aspectRatio;

        if (drawHeight > canvas.height) {
          drawHeight = canvas.height;
          drawWidth = canvas.height * aspectRatio;
        }

        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;

        ctx.drawImage(img, x, y, drawWidth, drawHeight);
      };

      img.onerror = () => {
        console.error("Failed to load reference image:", referenceImage);
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'red';
        ctx.fillText('Image failed to load. Check console.', canvas.width / 2, canvas.height / 2); // Shorter error message
      };
    } 

    ctx.lineCap = 'round';
  }, [referenceImage]);

  // --- Drawing and Tool Functions ---

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const pressure = e.pressure || 0.5;
    ctx.lineWidth = brushSize * pressure;
    ctx.globalAlpha = isEraser ? 1 : brushOpacity;
    ctx.strokeStyle = isEraser ? '#ffffff' : brushColor;

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.globalAlpha = 1;
  };

  const endDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Always clear first

    if (referenceImage && !isCanvasBlankMode) { // Only redraw reference if not in blank mode
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = referenceImage;
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.width / aspectRatio;

        if (drawHeight > canvas.height) {
          drawHeight = canvas.height;
          drawWidth = canvas.height * aspectRatio;
        }

        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
      };
      img.onerror = () => {
        console.error("Failed to reload reference image for clearCanvas:", referenceImage);
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'red';
        ctx.fillText('Failed to reload reference image for clear.', canvas.width / 2, canvas.height / 2);
      };
    }
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${drawingName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const toggleEraser = () => setIsEraser(prev => !prev);

  const handleNewImage = () => {

    if (!selectedExistingDrawing && !aiGeneratedImageURL && !isCanvasBlankMode) {
      setImageIndex(prev => prev + 1);
    }
  };

  const handleSkillChange = (e) => {
    const newSkill = e.target.value;
    // If skill is selected, exit blank mode
    if (newSkill && newSkill !== '') {
      setIsCanvasBlankMode(false); // Exit blank mode
      setSkill(newSkill);
      setImageIndex(0); // Reset index for new skill
    } else {
      // If user selects "-- Select --" or empty, optionally revert to blank mode
      // MODIFIED: If no skill is selected, go into blank mode.
      setIsCanvasBlankMode(true); // Default to blank if skill is empty
      setSkill('');
      setImageIndex(0);
    }
  };

  // Function to switch to Blank Canvas mode (now handled locally in Drawing.jsx)
  const switchToBlankCanvas = () => {
    setIsCanvasBlankMode(true);
    setSkill(''); // Clear skill selection (this will trigger referenceImage to become blank)
    setImageIndex(0); // Ensure index is reset
    // No need to call clearCanvas() explicitly here, useEffect will handle it
  };


  const addToMyDrawings = () => {
    console.log("Add button clicked: Attempting to save drawing."); // ADD THIS LINE
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log("Canvas reference not found."); // ADD THIS LINE
      return;
    }
    const drawingData = {
      name: drawingName,
      image_url: canvas.toDataURL('image/png'),
    };
    if (onAddToMyDrawings) {
      console.log("Calling onAddToMyDrawings prop..."); // ADD THIS LINE
      onAddToMyDrawings(drawingData);
    } else {
      console.log("onAddToMyDrawings prop is not defined."); // ADD THIS LINE
    }
  };

  return (
    <div className="drawing-container">
      <h2>Drawing Practice</h2>

      {/* Skill Selector (disabled if AI image or existing drawing is loaded, but NOT if currently in blank mode but selecting a new skill) */}
      <div className="skill-selector">
        <label>
          Skill:
          <select
            value={skill}
            onChange={handleSkillChange}
            // MODIFIED: Disable only if an existing drawing or AI image is loaded
            // Blank mode itself doesn't disable skill selection, as you can switch out of it.
            disabled={!!selectedExistingDrawing || !!aiGeneratedImageURL}
          >
              <option value="">-- Select --</option>
              <option value="Shading">Shading</option>
              <option value="Structure">Structure</option>
              <option value="Anatomy">Anatomy</option>
              <option value="Perspective">Perspective</option>
              <option value="Composition">Composition</option>
          </select>
        </label>

        {/* Hide New button if AI, existing, or in BlankCanvas mode */}
        {!selectedExistingDrawing && !aiGeneratedImageURL && !isCanvasBlankMode && <button onClick={handleNewImage}>🔁 New</button>}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <label>
          Color:
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            disabled={isEraser}
          />
        </label>

        <label>
          Size:
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </label>

        <label>
          Softness:
          <input
            type="range"
            min="0.02"
            max="1"
            step="0.01"
            value={brushOpacity}
            onChange={(e) => setBrushOpacity(Number(e.target.value))}
            disabled={isEraser}
          />
        </label>

        <button onClick={toggleEraser}>
          {isEraser ? '✏️ Pen' : '🧽 Eraser'}
        </button>

        <button onClick={clearCanvas}>🧹 Clear</button>

        {/* NEW: Blank Canvas Button in Toolbar (only show if not already in blank mode AND no other image source is selected) */}
        {!isCanvasBlankMode && !selectedExistingDrawing && !aiGeneratedImageURL && (
          <button onClick={switchToBlankCanvas} className="blank-canvas-drawing-btn">
            ⬜ Blank Canvas
          </button>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={endDrawing}
        onPointerLeave={endDrawing}
        className="drawing-canvas"
      />

      {/* Action Buttons */}
      <div className="button-row">
        <button className="back-button" onClick={onBack}>⬅ Home</button>
        <div className="right-buttons">
          <button className="download" onClick={downloadDrawing}>⬇️ Download</button>
          <button className="add" onClick={addToMyDrawings}>+ Add</button>
        </div>
      </div>
    </div>
  );
};

export default Drawing;