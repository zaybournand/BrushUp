import React, { useRef, useState, useEffect } from 'react';
import './Drawing.css';

const imageMap = {
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

const Drawing = ({ skill: initialSkill, onBack, uploadedImage, selectedExistingDrawing, onAddToMyDrawings }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false); // State to track if drawing is active
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [brushOpacity, setBrushOpacity] = useState(0.1);
  const [isEraser, setIsEraser] = useState(false); // State to track if eraser is active

  const [skill, setSkill] = useState(initialSkill || 'Shading');
  const [imageIndex, setImageIndex] = useState(0);

  // Determine the reference image source based on priority
  const referenceImage = selectedExistingDrawing
    ? selectedExistingDrawing.image_url // Use the image_url from the selected drawing
    : uploadedImage
    ? uploadedImage.src // Assuming uploadedImage also has a src property (for direct upload case, if still used)
    : imageMap[skill][imageIndex % imageMap[skill].length];

  // If a drawing was selected from MyDrawings, its name should be displayed as well
  const initialDrawingName = selectedExistingDrawing ? selectedExistingDrawing.name : `drawing-${Date.now()}.png`;
  const [drawingName] = useState(initialDrawingName); // State for the drawing's name

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Ensure canvas exists
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.src = referenceImage;

    img.onload = () => {
      canvas.width = 800; // Set canvas dimensions (adjust as needed)
      canvas.height = 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    // If the image fails to load (e.g., corrupted base64, broken URL)
    img.onerror = () => {
        console.error("Failed to load reference image:", referenceImage);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'red';
        ctx.fillText('Image failed to load. Please try another.', canvas.width / 2, canvas.height / 2);
    };

    ctx.lineCap = 'round';
  }, [referenceImage]); // Dependency on referenceImage ensures canvas updates when image changes

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
    // Optional: e.pressure for stylus support, default to 0.5 if not available
    const pressure = e.pressure || 0.5;
    ctx.lineWidth = brushSize * pressure;
    ctx.globalAlpha = isEraser ? 1 : brushOpacity; // Eraser is always opaque
    ctx.strokeStyle = isEraser ? '#ffffff' : brushColor; // Eraser uses white color

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.globalAlpha = 1; // Reset globalAlpha after stroke to avoid affecting subsequent elements
  };

  const endDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = referenceImage; // Load the current reference image again

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.onerror = () => {
        console.error("Failed to reload reference image for clearCanvas:", referenceImage);
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Just clear if image fails
    };
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${drawingName}.png`; // Use the drawingName
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const toggleEraser = () => setIsEraser(prev => !prev); // Toggle the eraser state

  const handleNewImage = () => {
    // This is for cycling through the default skill-based reference images
    if (!selectedExistingDrawing) { // Only allow if not using an existing drawing
        setImageIndex(prev => prev + 1);
    }
  };

  const handleSkillChange = (e) => {
    // This is for changing the default skill-based reference images
    if (!selectedExistingDrawing) { // Only allow if not using an existing drawing
        setSkill(e.target.value);
        setImageIndex(0); // reset to first image when switching skill
    }
  };

  // --- Adding a drawing to MyDrawings ---
  const addToMyDrawings = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const drawingData = {
      name: drawingName,
      image_url: canvas.toDataURL('image/png'),
    };
    if (onAddToMyDrawings) onAddToMyDrawings(drawingData);
  };

  return (
    <div className="drawing-container">
      <h2>Drawing Practice</h2>

      {/* Skill Selector */}
      <div className="skill-selector">
        <label>
          Skill:
          <select
            value={skill}
            onChange={handleSkillChange}
            disabled={!!selectedExistingDrawing} // Disable if an existing drawing is loaded
          >
            <option value="Shading">Shading</option>
            <option value="Eyes">Eyes</option>
            <option value="Structure">Structure</option>
          </select>
        </label>
        {/* Only show "New" button if not practicing an existing drawing */}
        {!selectedExistingDrawing && <button onClick={handleNewImage}>🔁 New</button>}
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