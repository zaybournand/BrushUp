import React, { useState } from 'react'; // Keep useEffect if you decide to use it later, though not strictly needed for this current change
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { useUser } from './UserContext'; // Import useUser from your UserContext

const Home = ({ onStartDrawing, onGoToMyDrawings, onGoToReference }) => {
  const [skill, setSkill] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const navigate = useNavigate();

  const { currentUser, logout } = useUser(); // Get currentUser and logout function from context

  const handleSkillChange = (selectedSkill) => {
    setSkill(selectedSkill);
    const imageMap = {
      Shading: '/images/shading-example.jpg',
      Eyes: '/images/eyes-example.jpg',
      Structure: '/images/structure-example.jpg',
    };
    setReferenceImage(imageMap[selectedSkill]);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/register');
  };

  const handleLogout = async () => {
    await logout(); // Call the logout function from your context
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <div className="home-container">
      <div className="top-buttons">
        <div className="top-left-buttons">
          <button onClick={onGoToMyDrawings}>MyDrawings</button>
          <button onClick={onGoToReference}>Reference</button>
        </div>
        <div className="top-right-buttons">
          {currentUser ? ( // Conditionally render based on currentUser
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
        Select a skill to practice and view a reference image. Then click "Start Drawing" to begin!
      </p>

      <div className="art-image-row">
        <img src="/images/art image.jpg" alt="Art Example 1" />
        <img src="/images/moreimage.jpg" alt="Art Example 2" />
        <img src="/images/pimage.jpg" alt="Art Example 3" />
      </div>

      <div className="skill-selector">
        <label>Choose a Skill: </label>
        <select value={skill} onChange={(event) => handleSkillChange(event.target.value)}>
          <option value="">-- Select --</option>
          <option value="Shading">Shading</option>
          <option value="Eyes">Eyes</option>
          <option value="Structure">Structure</option>
        </select>
      </div>

      <div>
        {referenceImage ? (
          <img src={referenceImage} alt={`Reference for ${skill}`} className="reference-image" />
        ) : (
          <p>Select a skill to view a reference image.</p>
        )}
      </div>

      <button
        onClick={() => onStartDrawing(skill)}
        disabled={!skill}
        className="start-button"
      >
        Start Drawing
      </button>

      <p className="instruction-text">
        Already have a drawing? Click 'MyDrawings'!
      </p>
      <p className="reference-footer">
        Want a paper reference or helpful tips? Tap <strong>Reference</strong> above!
      </p>
    </div>
  );
};

export default Home;