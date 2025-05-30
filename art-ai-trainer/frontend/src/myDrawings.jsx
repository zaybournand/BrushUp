import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './myDrawings.css';
import { useUser } from './UserContext'; // Path to UserContext

const API_BASE_URL = 'https://localhost:5000';

const MyDrawings = ({ onSelectDrawing, onBack }) => {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedName, setEditedName] = useState('');

  const { currentUser } = useUser(); // Access context here
  const navigate = useNavigate();

  const fetchDrawings = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      setDrawings([]);
      setError("Please log in to view your drawings.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${API_BASE_URL}/my-drawings`, { withCredentials: true });

      if (Array.isArray(res.data)) {
        setDrawings(res.data);
      } else {
        console.error("Received non-array data for drawings:", res.data);
        setDrawings([]);
        setError("Unexpected data format from server.");
      }
    } catch (err) {
      console.error("Error fetching drawings:", err);
      if (err.response && err.response.status === 401) {
        setError("Your session has expired. Redirecting to login...");
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError("Failed to load drawings. Please try again.");
      }
      setDrawings([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchDrawings();
  }, [fetchDrawings]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setLoading(true); // Indicate loading for upload

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        try {
          await axios.post(`${API_BASE_URL}/upload-drawing`, {
            name: file.name,
            image_url: base64
          }, { withCredentials: true });
          fetchDrawings(); // Re-fetch all drawings after successful upload
        } catch (err) {
          console.error('Upload failed:', err);
          alert(`Failed to upload ${file.name}. Please ensure you are logged in.`);
          if (err.response && err.response.status === 401) {
            navigate('/login');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteDrawing = async (drawingId) => {
    if (!window.confirm("Are you sure you want to delete this drawing?")) {
        return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/delete-drawing/${drawingId}`, { withCredentials: true });
      fetchDrawings();
    } catch (err) {
      console.error('Delete failed:', err);
      alert("Failed to delete drawing. Please ensure you are logged in.");
      if (err.response && err.response.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleRenameDrawing = async (index, newName) => {
    const drawing = drawings[index];
    if (!drawing) {
      console.error("Drawing not found at index:", index);
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/rename-drawing`, {
        id: drawing.id,
        name: newName
      }, { withCredentials: true });
      fetchDrawings();
    } catch (err) {
      console.error('Rename failed:', err);
      alert("Failed to rename drawing. Please ensure you are logged in.");
      if (err.response && err.response.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleDrawingClick = (drawing) => {
    if (onSelectDrawing) {
      onSelectDrawing(drawing);
    }
  };

  const startEditing = (index, currentName) => {
    setEditingIndex(index);
    setEditedName(currentName);
  };

  const saveEditedName = (index) => {
    if (editedName.trim() === '') {
      alert("Drawing name cannot be empty.");
      setEditingIndex(null);
      return;
    }
    handleRenameDrawing(index, editedName);
    setEditingIndex(null);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="my-drawings-container">
        <h2 className="title">MyDrawings</h2>
        <p className="loading-msg">Loading drawings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-drawings-container">
        <h2 className="title">MyDrawings</h2>
        <p className="error-msg">{error}</p>
        <button onClick={handleBackClick} className="back-btn">⬅ Back</button>
      </div>
    );
  }

  return (
    <div className="my-drawings-container">
      <h2 className="title">MyDrawings</h2>

      <div className="controls">
        <button onClick={handleBackClick} className="back-btn">⬅ Back</button>
        <label className="upload-btn">
          📤 Upload Drawing
          <input
            type="file"
            accept="image/png"
            onChange={handleUpload}
            multiple
            hidden
          />
        </label>

      </div>

      {drawings.length === 0 ? (
        <p className="empty-msg">No drawings yet. Upload one to get started!</p>
      ) : (
        <div className="drawing-grid">
          {drawings.map((drawing, index) => (
            <div key={drawing.id} className="drawing-card">
              <img
                src={drawing.image_url}
                alt={drawing.name}
                onClick={() => handleDrawingClick(drawing)}
              />
              <div className="drawing-footer">
                {editingIndex === index ? (
                  <input
                    className="edit-input"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={() => saveEditedName(index)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEditedName(index)}
                    autoFocus
                  />
                ) : (
                  <p>{drawing.name}</p>
                )}
                <button
                  className="edit-btn"
                  onClick={() => startEditing(index, drawing.name)}
                  title="Edit Name"
                >
                  ✏️
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteDrawing(drawing.id)}
                  title="Delete Drawing"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDrawings;