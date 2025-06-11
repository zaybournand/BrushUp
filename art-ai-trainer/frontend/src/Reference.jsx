import React, { useState, useEffect } from 'react';
import './Reference.css';

const API_BASE_URL = 'https://localhost:5001'; // Ensure this matches your Flask backend's address

const referenceImages = {
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
  ],
  Perspective: [
    "Start with a horizon line and vanishing points to guide your drawing.",
    "Use 1-point or 2-point perspective based on your scene’s depth and angle.",
    "Draw through shapes—even hidden edges—to understand full 3D structure."
  ],
  Anatomy: [
    "Learn basic skeletal structure before jumping into muscles.",
    "Use gesture drawing to capture movement and flow first.",
    "Focus on proportions—heads, limbs, and joints should relate logically."
  ],
  Composition: [
    "Use the rule of thirds to place your subject off-center for interest.",
    "Balance positive and negative space to avoid clutter.",
    "Guide the viewer’s eye using visual flow—lines, shapes, or lighting."
  ],
  
};

const Reference = ({ goBackHome }) => {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // State for the AI Image Generator
  const [showGenerator, setShowGenerator] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorMessage, setGeneratorMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null); // To check if user is logged in

  // Helper function to handle fetch responses
  const handleFetchResponse = async (res) => {
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || res.statusText);
    }
    return res.json();
  };

  // Fetch current user ID on component mount (to enable/disable generator)
  useEffect(() => {
    const fetchWhoAmI = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/whoami`, { credentials: 'include' });
        const data = await response.json();
        if (data.user_id) {
          setCurrentUserId(data.user_id);
        } else {
          setCurrentUserId(null);
        }
      } catch (error) {
        console.error("Failed to fetch user ID for generator access:", error);
        setCurrentUserId(null);
      }
    };
    fetchWhoAmI();
  }, []); // Run only once on mount


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

  // Function to handle printing a specific image URL
  const handlePrintImage = (imageUrl) => {
    if (!imageUrl) return;

    // Create a new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups for printing.");
      return;
    }

    // Write the image into the new window's document
    printWindow.document.write(`
      <html>
      <head>
        <title>Print Image</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          img { max-width: 100%; max-height: 100vh; display: block; object-fit: contain; }
          @media print {
            body { margin: 0; }
            img { page-break-after: always; max-width: 100%; max-height: 100%; display: block; object-fit: contain; }
          }
        </style>
      </head>
      <body>
        <img src="${imageUrl}" alt="Print Image">
      </body>
      </html>
    `);
    printWindow.document.close(); // Close the document to ensure content is parsed

    // Wait for the image to load before printing
    const imgElement = printWindow.document.querySelector('img');
    if (imgElement.complete) {
      // Image already loaded, print immediately
      printWindow.print();
      printWindow.close(); // Close the new window after printing
    } else {
      // Wait for image to load
      imgElement.onload = () => {
        printWindow.print();
        printWindow.close();
      };
      imgElement.onerror = () => {
        alert("Failed to load image for printing.");
        printWindow.close();
      };
    }
  };


  // Function to handle AI image generation
  const handleGenerateImage = async () => {
    if (!currentUserId) {
      setGeneratorMessage("You must be logged in to generate images.");
      return;
    }
    if (!prompt.trim()) {
      setGeneratorMessage("Please enter a prompt to generate an image.");
      return;
    }

    setIsGenerating(true);
    setGeneratorMessage("Generating your AI reference image... This may take a moment.");
    setGeneratedImageUrl(''); // Clear previous image

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate_reference_image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, negative_prompt: negativePrompt }),
        credentials: 'include',
      });

      const data = await handleFetchResponse(response);
      setGeneratedImageUrl(data.image_url);
      setGeneratorMessage("Image generated successfully!");
      setPrompt(''); // Clear prompt after generation
      setNegativePrompt(''); // Clear negative prompt
    } catch (error) {
      console.error("Error generating image:", error);
      setGeneratorMessage(`Failed to generate image: ${error.message}. Please try again.`);
      setGeneratedImageUrl('');
    } finally {
      setIsGenerating(false);
    }
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
      Choose a skill to explore drawing references and get helpful tips or generate your own reference using AI!
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
            <option value="Structure">Structure</option>
            <option value="Anatomy">Anatomy</option>
            <option value="Perspective">Perspective</option>
            <option value="Composition">Composition</option>
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
              onClick={() => handlePrintImage(getCurrentImageUrl())}
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

      {/* AI Image Generator Section */}
      <hr className="section-divider" />
      <h2 className="generator-title">
        AI Reference Generator
        <button className="toggle-generator-btn" onClick={() => setShowGenerator(!showGenerator)}>
          {showGenerator ? 'Hide' : 'Show'}
        </button>
      </h2>
      
      {showGenerator && (
        <div className="ai-generator-section">
          <p className="generator-description">Describe an image you'd like to use as a reference. The AI will generate it for you!</p>
          {!currentUserId && (
            <p className="generator-login-message">Please log in to use the AI Image Generator.</p>
          )}

          <div className="generator-inputs">
            <textarea
              placeholder="Enter your prompt (e.g., 'A dynamic pose of a superhero flying through a city')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating || !currentUserId}
              rows="4"
              className="prompt-textarea"
            />
            <input
              type="text"
              placeholder="Negative prompt (e.g., 'blurry, bad quality, ugly, deformed')"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              disabled={isGenerating || !currentUserId}
              className="negative-prompt-input"
            />
            <button onClick={handleGenerateImage} disabled={isGenerating || !currentUserId || !prompt.trim()} className="generate-btn">
              {isGenerating ? 'Generating...' : 'Generate Image'}
            </button>
          </div>

          {generatorMessage && <div className={`generator-message ${generatorMessage.includes('Error') ? 'error' : ''}`}>{generatorMessage}</div>}

          {isGenerating && (
            <div className="loading-spinner-container">
                <div className="loading-spinner"></div>
                <p>Generating...</p>
            </div>
          )}

          {generatedImageUrl && (
            <div className="generated-image-display">
              <h3>Your AI Generated Reference:</h3>
              <img src={generatedImageUrl} alt="AI Generated Reference" className="generated-preview-image" />
              <div className="download-buttons">
                <a
                  href={`<span class="math-inline">\{API\_BASE\_URL\}/download/uploads/</span>{generatedImageUrl.split('/').pop()}`} // Ensure correct download URL for AI images
                  download={`BrushUp-AI-Reference.png`}
                  className="download-button"
                >
                  Download
                </a>
                <button
                  className="download-button"
                  onClick={() => handlePrintImage(generatedImageUrl)}
                >
                  Print
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reference; 