import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios here

// Import your page components
import Home from './Home';
import Drawing from './Drawing';
import MyDrawings from './myDrawings';
import Reference from './Reference';
import Login from './Log in';
import RegisterPage from './Signup';

// Import the new authentication components
import { UserProvider } from './UserContext'; // Adjust path if needed
import PrivateRoute from './PrivateRoute'; // Adjust path if needed

const API_BASE_URL = 'https://localhost:5000'; // Define your API base URL here

const App = () => {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedExistingDrawing, setSelectedExistingDrawing] = useState(null);

  const navigate = useNavigate();

  const handleStartDrawing = (skill) => {
    setSelectedSkill(skill);
    setSelectedExistingDrawing(null);
    navigate('/drawing');
  };

  const handleGoToMyDrawings = () => {
    setSelectedExistingDrawing(null);
    navigate('/mydrawings');
  };

  const handleGoToReference = () => {
    setSelectedExistingDrawing(null);
    navigate('/reference');
  };

  const handleSelectDrawingForPractice = (drawing) => {
    setSelectedExistingDrawing(drawing);
    setSelectedSkill('');
    navigate('/drawing');
  };

  // --- CRUCIAL CHANGE HERE: handleAddToMyDrawings ---
  const handleAddToMyDrawings = async (drawingData) => { // Make it async and accept drawingData
    try {
      // Send the drawing data to your Flask backend's upload endpoint
      const response = await axios.post(`${API_BASE_URL}/upload-drawing`, {
        name: drawingData.name,
        image_url: drawingData.image_url // Use image_url as expected by backend
      }, {
        withCredentials: true // Important for sending the session cookie
      });
      console.log('Drawing successfully added to backend:', response.data);
      // After successful upload, navigate to MyDrawings to see the updated list
      navigate('/mydrawings');
    } catch (error) {
      console.error('Failed to add drawing to MyDrawings:', error);
      alert(`Failed to save drawing: ${error.message}. Please ensure you are logged in.`);
      if (error.response && error.response.status === 401) {
        navigate('/login'); // Redirect to login if unauthorized
      }
    }
  };
  // --- END CRUCIAL CHANGE ---

  return (
    <UserProvider>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              onStartDrawing={handleStartDrawing}
              onGoToMyDrawings={handleGoToMyDrawings}
              onGoToReference={handleGoToReference}
            />
          }
        />
        <Route
          path="/drawing"
          element={
            <Drawing
              skill={selectedSkill}
              selectedExistingDrawing={selectedExistingDrawing}
              onBack={() => navigate('/')}
              onAddToMyDrawings={handleAddToMyDrawings} // Pass the updated handler
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