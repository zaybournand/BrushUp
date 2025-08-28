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
  // State to manage the drawing skill level
  const [selectedSkill, setSelectedSkill] = useState('');
  // State to hold a drawing selected from MyDrawings
  const [selectedExistingDrawing, setSelectedExistingDrawing] = useState(null);
  // State to store the URL of an AI-generated reference image
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState(null);
  // State for a selected image index from a set of images
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // State to determine if the drawing canvas should be blank
  const [shouldStartBlankCanvas, setShouldStartBlankCanvas] = useState(false); 

  const navigate = useNavigate();

  // Function to handle starting a new drawing session
  const handleStartDrawing = (skill, imageIndex) => {
    setSelectedSkill(skill);
    setSelectedImageIndex(imageIndex);
    setSelectedExistingDrawing(null);
    setAiGeneratedImageUrl(null);
    setShouldStartBlankCanvas(false); 
    navigate('/drawing');
  };

  // Function to handle starting a drawing with an AI-generated image
  const handleAICreateDrawing = (imageUrl) => {
    setAiGeneratedImageUrl(imageUrl);
    setSelectedSkill('');
    setSelectedExistingDrawing(null);
    setSelectedImageIndex(0);
    setShouldStartBlankCanvas(false); 
    navigate('/drawing');
  };

  // Function to start a drawing on a blank canvas
  const handleStartBlankDrawing = () => {
    setShouldStartBlankCanvas(true); 
    setSelectedSkill('');
    setSelectedExistingDrawing(null); 
    setAiGeneratedImageUrl(null);
    setSelectedImageIndex(0); 
    navigate('/drawing');
  };

  // Function to navigate to MyDrawings page
  const handleGoToMyDrawings = () => {
    setSelectedExistingDrawing(null);
    setAiGeneratedImageUrl(null);
    setSelectedSkill('');
    setSelectedImageIndex(0);
    setShouldStartBlankCanvas(false); 
    navigate('/mydrawings');
  };

  // Function to navigate to the Reference page
  const handleGoToReference = () => {
    setSelectedExistingDrawing(null);
    setAiGeneratedImageUrl(null);
    setSelectedSkill('');
    setSelectedImageIndex(0);
    setShouldStartBlankCanvas(false);
    navigate('/reference');
  };

  // Function to navigate to the ArtPost community page
  const handleGoToArtPost = () => {
    setSelectedExistingDrawing(null);
    setAiGeneratedImageUrl(null);
    setSelectedSkill('');
    setSelectedImageIndex(0);
    setShouldStartBlankCanvas(false);
    navigate('/artpost');
  };

  // Function to select an existing drawing for practice
  const handleSelectDrawingForPractice = (drawing) => {
    setSelectedExistingDrawing(drawing);
    setSelectedSkill('');
    setAiGeneratedImageUrl(null);
    setSelectedImageIndex(0);
    setShouldStartBlankCanvas(false); 
    navigate('/drawing');
  };

  // Function to save a drawing to the user's account via API
  const handleAddToMyDrawings = async (drawingData) => {
    console.log("handleAddToMyDrawings called with data:", drawingData.name); 
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
      console.error('Failed to add drawing to MyDrawings:', error);
      alert(`Failed to save drawing: ${error.message}. Please ensure you are logged in.`); 
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
    }
  };

  return (
    // UserProvider provides authentication context to all components
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
              onStartBlankDrawing={handleStartBlankDrawing} 
            />
          }
        />
        <Route
            path="/drawing"
            element={
              // Pass state and handlers as props to the Drawing component
              <Drawing
                skill={selectedSkill}
                initialImageIndex={selectedImageIndex}
                selectedExistingDrawing={selectedExistingDrawing}
                aiGeneratedImageURL={aiGeneratedImageUrl}
                shouldStartBlankCanvas={shouldStartBlankCanvas} 
                onBack={() => navigate('/')}
                onAddToMyDrawings={handleAddToMyDrawings}
              />
            }
        />
        <Route
          path="/mydrawings"
          element={
            // PrivateRoute protects this route, ensuring only logged-in users can access it
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
            // PrivateRoute protects this route
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
