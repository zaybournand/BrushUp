import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { useUser } from './UserContext';

const API_BASE_URL = 'https://localhost:5001';

const Home = ({ onStartDrawing, onGoToMyDrawings, onGoToReference, onGoToArtPost, onAICreateDrawing, onStartBlankDrawing }) => { // ADDED onStartBlankDrawing prop
  const [skill, setSkill] = useState('');
  const navigate = useNavigate();

  const { currentUser, logout } = useUser();

  // State for AI Image Generation on Home page
  const [showAIGeneratorModal, setShowAIGeneratorModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiNegativePrompt, setAiNegativePrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGeneratorMessage, setAiGeneratorMessage] = useState('');
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState(null);

  const [showAIPreviewModal, setShowAIPreviewModal] = useState(false);


  // Image map with arrays of images (BlankCanvas removed as it's now a button)
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

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const referenceImage = skill ? imageMap[skill]?.[currentImageIndex] : null;


  // Helper function to handle fetch responses
  const handleFetchResponse = async (res) => {
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || res.statusText);
    }
    return res.json();
  };

  const handleSkillChange = (selectedSkill) => {
    setSkill(selectedSkill);
    setCurrentImageIndex(0);
  };

  const handleNextReferenceImage = () => {
    if (!skill || !imageMap[skill]) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageMap[skill].length);
  };

  const handlePrevReferenceImage = () => {
    if (!skill || !imageMap[skill]) return;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + imageMap[skill].length) % imageMap[skill].length);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/register');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAICreateImage = async () => {
    if (!currentUser) {
      setAiGeneratorMessage("You must be logged in to create AI images.");
      return;
    }
    if (!aiPrompt.trim()) {
      setAiGeneratorMessage("Please enter a prompt to generate an image.");
      return;
    }

    setIsGeneratingAI(true);
    setAiGeneratorMessage("Generating your AI image... This may take a moment.");
    setAiGeneratedImageUrl(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate_reference_image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, negative_prompt: aiNegativePrompt }),
        credentials: 'include',
      });

      const data = await handleFetchResponse(response);
      const newGeneratedImageUrl = data.image_url;

      setAiGeneratedImageUrl(newGeneratedImageUrl);
      setShowAIGeneratorModal(false);
      setShowAIPreviewModal(true);

      setAiGeneratorMessage('');

    } catch (error) {
      console.error("Error generating AI image:", error);
      setAiGeneratorMessage(`Failed to generate image: ${error.message}. Please try again.`);
      setAiGeneratedImageUrl(null);
    } finally {
      setIsGeneratingAI(false);
    }
  };


  return (
    <div className="home-container">
      <div className="top-buttons">
        <div className="top-left-buttons">
          <button onClick={onGoToMyDrawings}>MyDrawings</button>
          <button onClick={onGoToReference}>Reference</button>
          <button onClick={onGoToArtPost}>ArtPost</button>
        </div>
        <div className="top-right-buttons">
          {currentUser ? (
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          ) : (
            <>
              <button onClick={handleSignup} className="signup-btn">Sign up</button>
              <button onClick={handleLogin} className="login-btn">Login</button>
            </>
          )}
        </div>
      </div>
          
      <h1 className="home-title">BrushUp</h1>
      <p className="instruction-text">
        Select a skill to practice and view a reference image or create your own image with AI. Then click "Start Drawing" to begin!
      </p>

      <div className="art-image-row">
        <img src="/images/art image.jpg" alt="Art Example 1" />
        <img src="/images/moreimage.jpg" alt="Art Example 2" />
        <img src="/images/pimage.jpg" alt="Art Example 3" />
      </div>

      {/* NEW CONTAINER FOR TWO-COLUMN LAYOUT */}
      <div className="practice-options-row">
        {/* Left Column: Skill Selection and Start Drawing */}
        <div className="skill-practice-section">
          <h3 className="section-heading">Practice with References:</h3>
          <div className="skill-selector">
            <label>Choose a Skill: </label>
            <select value={skill} onChange={(event) => handleSkillChange(event.target.value)}>
              <option value="">-- Select --</option>
              <option value="Shading">Shading</option>
              <option value="Structure">Structure</option>
              <option value="Anatomy">Anatomy</option>
              <option value="Perspective">Perspective</option>
              <option value="Composition">Composition</option>
            </select>
          </div>

          {/* Reference Image Display and Navigation Arrows */}
          <div className="reference-preview-container">
            {referenceImage ? (
              <>
                <img src={referenceImage} alt={`Reference for ${skill}`} className="reference-image" />
                <div className="image-navigation-buttons">
                  <button
                    className="arrow-button"
                    onClick={handlePrevReferenceImage}
                    disabled={!skill || (imageMap[skill] && imageMap[skill].length <= 1)}
                  >
                    &lt; Previous
                  </button>
                  <button
                    className="arrow-button"
                    onClick={handleNextReferenceImage}
                    disabled={!skill || (imageMap[skill] && imageMap[skill].length <= 1)}
                  >
                    Next &gt;
                  </button>
                </div>
              </>
            ) : (
              <p>Select a skill to view a reference image.</p>
            )}
          </div>

          <button
            onClick={() => onStartDrawing(skill, currentImageIndex)}
            disabled={!skill}
            className="start-button"
          >
            Start Drawing
          </button>
        </div>

        {/* Right Column: AI Create Image Option */}
        <div className="ai-creation-section">
          <div className="ai-text-content">
            <h3 className="section-heading ai-section-title">Create Your Own with AI:</h3>
            <p className="ai-section-description">Generate a unique image tailored to your prompt.</p>
          </div>
          <button
            onClick={() => {
              if (!currentUser) {
                setAiGeneratorMessage("You must be logged in to create AI images.");
                return;
              }
              setShowAIGeneratorModal(true);
              setAiGeneratorMessage('');
              setAiPrompt('');
              setAiNegativePrompt('');
            }}
            className="ai-create-button"
            disabled={!currentUser}
          >
            AI Create Image
          </button>
          {!currentUser && (
            <p className="ai-login-message">Log in to use AI image creation.</p>
          )}

          {/* NEW: Start Blank Drawing Button */}
          <h3 className="section-heading blank-canvas-title">Start a Blank Drawing:</h3>
          <p className="blank-canvas-description">Begin a free drawing session without any reference.</p>
          <button
            onClick={() => {
              if (onStartBlankDrawing) { // Call the new prop function
                onStartBlankDrawing();
              } else {
                console.error("onStartBlankDrawing prop is not provided to Home component.");
              }
            }}
            className="start-blank-button"
            disabled={!currentUser} // Disable if not logged in
          >
            Start Blank Drawing
          </button>
          {!currentUser && (
            <p className="blank-canvas-login-message">Log in to draw on a blank canvas.</p>
          )}
        </div>
      </div> {/* END practice-options-row */}


      <div className="footer-paths">
        <p><strong>Digital:</strong> ✏️ Start Drawing → 🎨 <span onClick={onGoToMyDrawings}>MyDrawings</span> → 📚 <span onClick={onGoToReference}>Reference</span> → 🌟 <span onClick={onGoToArtPost}>ArtPost</span></p>
        <p><strong>Paper:</strong> 📚 <span onClick={onGoToReference}>Reference</span> → 🌟 <span onClick={onGoToArtPost}>ArtPost</span></p>
      </div>

      {/* AI Image Generator Modal (for inputting prompt) */}
      {showAIGeneratorModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Generate AI Image for Drawing</h2>
            <p className="modal-description">Enter a prompt to create your custom reference image.</p>
            
            <div className="generator-inputs">
              <textarea
                placeholder="Enter your prompt (e.g., 'A manga character with a determined expression, side view')"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isGeneratingAI}
                rows="4"
                className="prompt-textarea"
              />
              <input
                type="text"
                placeholder="Negative prompt (e.g., 'blurry, bad quality, ugly, deformed')"
                value={aiNegativePrompt}
                onChange={(e) => setAiNegativePrompt(e.target.value)}
                disabled={isGeneratingAI}
                className="negative-prompt-input"
              />
            </div>

            {aiGeneratorMessage && <div className={`generator-message ${aiGeneratorMessage.includes('Error') ? 'error' : ''}`}>{aiGeneratorMessage}</div>}

            <div className="modal-actions">
              <button
                onClick={handleAICreateImage}
                disabled={isGeneratingAI || !aiPrompt.trim()}
                className="generate-btn"
              >
                {isGeneratingAI ? 'Generating...' : 'Generate Image'}
              </button>
              <button onClick={() => setShowAIGeneratorModal(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
            
            {isGeneratingAI && (
                <div className="loading-spinner-container">
                    <div className="loading-spinner"></div>
                    <p>Generating...</p>
                </div>
            )}
          </div>
        </div>
      )}

      {/* AI Image Preview Modal */}
      {showAIPreviewModal && aiGeneratedImageUrl && (
        <div className="modal-overlay">
          <div className="modal-content preview-modal-content">
            <h2>AI Generated Image Preview</h2>
            <p className="modal-description">Review your generated image before starting to draw.</p>
            
            <div className="preview-image-container">
              <img src={aiGeneratedImageUrl} alt="Generated AI Reference" className="preview-image" />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  if (onAICreateDrawing) {
                    onAICreateDrawing(aiGeneratedImageUrl);
                  } else {
                    console.error("onAICreateDrawing prop is not provided.");
                  }
                  setShowAIPreviewModal(false);
                  setAiGeneratedImageUrl(null);
                }}
                className="generate-btn"
              >
                Start Drawing
              </button>
              <button
                onClick={() => {
                  setShowAIPreviewModal(false);
                  setShowAIGeneratorModal(true);
                  setAiGeneratedImageUrl(null);
                  setAiGeneratorMessage('');
                }}
                className="cancel-btn"
              >
                Generate New Image
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;