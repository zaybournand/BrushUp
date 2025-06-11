import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';

import Home from './Home';
import Drawing from './Drawing';
import MyDrawings from './myDrawings';
import Reference from './Reference';
import ArtPost from './artPost';
import Login from './Log in';
import RegisterPage from './Signup';

import { UserProvider } from './UserContext';
import PrivateRoute from './PrivateRoute';

const API_BASE_URL = 'https://localhost:5001';

const App = () => {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedExistingDrawing, setSelectedExistingDrawing] = useState(null);
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // NEW STATE: To indicate if the Drawing page should start with a blank canvas
  const [shouldStartBlankCanvas, setShouldStartBlankCanvas] = useState(false); // Renamed for clarity

  const navigate = useNavigate();

  // MODIFIED: handleStartDrawing now ensures blank mode is off
  const handleStartDrawing = (skill, imageIndex) => {
    setSelectedSkill(skill);
    setSelectedImageIndex(imageIndex);
    setSelectedExistingDrawing(null);
    setAiGeneratedImageUrl(null);
    setShouldStartBlankCanvas(false); // Ensure blank mode is off
    navigate('/drawing');
  };

  // MODIFIED: handleAICreateDrawing now ensures blank mode is off
  const handleAICreateDrawing = (imageUrl) => {
    setAiGeneratedImageUrl(imageUrl);
    setSelectedSkill('');
    setSelectedExistingDrawing(null);
    setSelectedImageIndex(0);
    setShouldStartBlankCanvas(false); // Ensure blank mode is off
    navigate('/drawing');
  };

  // NEW HANDLER: To start a blank drawing session
  const handleStartBlankDrawing = () => {
    setShouldStartBlankCanvas(true); // Activate blank mode
    setSelectedSkill(''); // Clear any skill
    setSelectedExistingDrawing(null); // Clear any existing drawing
    setAiGeneratedImageUrl(null); // Clear any AI image
    setSelectedImageIndex(0); // Clear any image index
    navigate('/drawing');
  };

  // MODIFIED: Reset states when navigating to other main pages
  const handleGoToMyDrawings = () => {
    setSelectedExistingDrawing(null);
    setAiGeneratedImageUrl(null);
    setSelectedSkill('');
    setSelectedImageIndex(0);
    setShouldStartBlankCanvas(false); // Ensure blank mode is off
    navigate('/mydrawings');
  };

  // MODIFIED: Reset states when navigating to other main pages
  const handleGoToReference = () => {
    setSelectedExistingDrawing(null);
    setAiGeneratedImageUrl(null);
    setSelectedSkill('');
    setSelectedImageIndex(0);
    setShouldStartBlankCanvas(false); // Ensure blank mode is off
    navigate('/reference');
  };

  // MODIFIED: Reset states when navigating to other main pages
  const handleGoToArtPost = () => {
    setSelectedExistingDrawing(null);
    setAiGeneratedImageUrl(null);
    setSelectedSkill('');
    setSelectedImageIndex(0);
    setShouldStartBlankCanvas(false); // Ensure blank mode is off
    navigate('/artpost');
  };

  // MODIFIED: Reset states when selecting an existing drawing
  const handleSelectDrawingForPractice = (drawing) => {
    setSelectedExistingDrawing(drawing);
    setSelectedSkill('');
    setAiGeneratedImageUrl(null);
    setSelectedImageIndex(0);
    setShouldStartBlankCanvas(false); // Ensure blank mode is off
    navigate('/drawing');
  };

  const handleAddToMyDrawings = async (drawingData) => {
    console.log("handleAddToMyDrawings called with data:", drawingData.name); // ADD THIS LINE
    try {
      const response = await axios.post(
        `${API_BASE_URL}/upload-drawing`,
        {
          name: drawingData.name,
          image_url: drawingData.image_url,
        },
        {
          withCredentials: true,
        }
      );
      console.log('Drawing successfully added to backend:', response.data);
      navigate('/mydrawings');
    } catch (error) {
      console.error('Failed to add drawing to MyDrawings:', error); // Keep this
      alert(`Failed to save drawing: ${error.message}. Please ensure you are logged in.`); // Keep this
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
    }
  };

  return (
    <UserProvider>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              onStartDrawing={handleStartDrawing}
              onAICreateDrawing={handleAICreateDrawing}
              onGoToMyDrawings={handleGoToMyDrawings}
              onGoToReference={handleGoToReference}
              onGoToArtPost={handleGoToArtPost}
              onStartBlankDrawing={handleStartBlankDrawing} // Passed new handler
            />
          }
        />
        <Route
            path="/drawing"
            element={
              <Drawing
                skill={selectedSkill}
                initialImageIndex={selectedImageIndex}
                selectedExistingDrawing={selectedExistingDrawing}
                aiGeneratedImageURL={aiGeneratedImageUrl}
                shouldStartBlankCanvas={shouldStartBlankCanvas} // NEW PROP
                onBack={() => navigate('/')}
                onAddToMyDrawings={handleAddToMyDrawings}
              />
            }
        />
        <Route
          path="/mydrawings"
          element={
            <PrivateRoute>
              <MyDrawings
                onSelectDrawing={handleSelectDrawingForPractice}
                onBack={() => navigate('/')}
                onGoToArtPost={handleGoToArtPost}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/artpost"
          element={
            <PrivateRoute>
              <ArtPost
                goBackHome={() => navigate('/')}
              />
            </PrivateRoute>
          }
        />
        <Route path="/reference" element={<Reference goBackHome={() => navigate('/')} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </UserProvider>
  );
};

export default App;