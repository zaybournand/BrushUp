import React, { useState, useEffect, useCallback } from 'react';
import './artPost.css';

const API_BASE_URL = 'https://localhost:5001'; // Ensure this matches your Flask backend's address

const ArtPost = ({ goBackHome }) => {
  const [communityPosts, setCommunityPosts] = useState([]);
  const [myDrawings, setMyDrawings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [message, setMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  const [modalMode, setModalMode] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState('');
  const [selectedExistingDrawing, setSelectedExistingDrawing] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [sortBy, setSortBy] = useState('newest');

  // State for search query
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to handle fetch responses
  const handleFetchResponse = async (res) => {
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || res.statusText);
    }
    return res.json();
  };

  // Fetch current user ID on component mount
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
        console.error("Failed to fetch user ID:", error);
        setCurrentUserId(null);
      }
    };
    fetchWhoAmI();
  }, []);

  // Fetch all community posts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchCommunityPosts = useCallback(() => { // ESLint warning ignored here as sortBy is a valid dependency
    // Note: Search filtering is done client-side for now
    fetch(`${API_BASE_URL}/api/get_community_posts?sort_by=${sortBy}`, { credentials: 'include' })
      .then(handleFetchResponse)
      .then(data => setCommunityPosts(data))
      .catch(err => {
        console.error("Error fetching community posts:", err);
        setMessage(`Failed to load community posts: ${err.message}`);
      });
  }, [sortBy]); // sortBy is a necessary dependency here


  // Fetch user's drawings
  const fetchMyDrawings = useCallback(() => {
    fetch(`${API_BASE_URL}/my-drawings`, { credentials: 'include' })
      .then(handleFetchResponse)
      .then(data => setMyDrawings(data))
      .catch(err => {
        console.error("Error fetching my drawings:", err);
        setMessage(`Failed to load your drawings: ${err.message}. Please ensure you are logged in.`);
      });
  }, []);

  useEffect(() => {
    fetchCommunityPosts();
    if (currentUserId !== null) {
      fetchMyDrawings();
    }
  }, [currentUserId, fetchCommunityPosts, fetchMyDrawings]);

  // Filtered posts based on search query
  const filteredPosts = communityPosts.filter(post => {
    if (!searchQuery) return true;

    const lowerCaseQuery = searchQuery.toLowerCase();
    const matchesCaption = post.caption ? post.caption.toLowerCase().includes(lowerCaseQuery) : false;
    const matchesUsername = post.author_username ? post.author_username.toLowerCase().includes(lowerCaseQuery) : false;

    return matchesCaption || matchesUsername;
  });


  // Handle file input change for upload mode
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setUploadedFilePreview(URL.createObjectURL(file));
      setSelectedExistingDrawing(null);
      setMessage('');
    } else {
      setUploadedFile(null);
      setUploadedFilePreview('');
    }
  };

  // Handle selection of an existing drawing for selectExisting mode
  const handleSelectExistingDrawing = (drawing) => {
    setSelectedExistingDrawing(drawing);
    setUploadedFile(null);
    setUploadedFilePreview('');
    setMessage('');
  };

  // Function to open the modal in a specific mode (triggered by main page buttons)
  const openPostModal = (mode) => {
    if (!currentUserId) {
        setMessage("You must be logged in to create a post.");
        return;
    }
    setModalMode(mode);
    setShowModal(true);
    setNewPostCaption('');
    setUploadedFile(null);
    setUploadedFilePreview('');
    setSelectedExistingDrawing(null);
    setMessage('');
    setIsUploading(false);
  };

  // Handle the post submission
  const handlePost = async () => {
    let imageUrlToPost = '';

    if (modalMode === 'upload') {
      if (!uploadedFile) {
        setMessage('Please select an image file to upload.');
        return;
      }

      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', uploadedFile);

      try {
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload_file`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        const uploadResult = await handleFetchResponse(uploadRes);
        imageUrlToPost = uploadResult.public_url;
      } catch (uploadError) {
        console.error('File upload failed:', uploadError);
        setMessage(`Image upload failed: ${uploadError.message}. Please ensure you are logged in.`);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }

    } else if (modalMode === 'selectExisting') {
      if (!selectedExistingDrawing) {
        setMessage('Please select an existing drawing.');
        return;
      }
      imageUrlToPost = selectedExistingDrawing.image_url;
    }

    if (!imageUrlToPost) {
      setMessage('No image source provided for post.');
      return;
    }

    const postData = {
      image_url: imageUrlToPost,
      caption: newPostCaption.trim(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/create_post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
        credentials: 'include',
      });
      await handleFetchResponse(res);
      setShowModal(false);
      setNewPostCaption('');
      setUploadedFile(null);
      setUploadedFilePreview('');
      setSelectedExistingDrawing(null);
      fetchCommunityPosts();
    } catch (err) {
      console.error('Post failed:', err);
    }
  };

  const handleLike = (postId) => {
    if (!currentUserId) {
        setMessage("You must be logged in to like a post.");
        return;
    }
    fetch(`${API_BASE_URL}/api/like_post/${postId}`, { method: 'POST', credentials: 'include' })
      .then(handleFetchResponse)
      .then(data => {
        setCommunityPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId ? { ...post, likes_count: data.likes_count } : post
          )
        );
      })
      .catch(err => {
        console.error("Error liking post:", err);
        setMessage(`Failed to like post: ${err.message}`);
      });
  };

  const handleComment = (postId, commentText) => {
    if (!currentUserId) {
        setMessage("You must be logged in to comment on a post.");
        return;
    }
    if (!commentText.trim()) {
      setMessage('Comment cannot be empty.');
      return;
    }

    fetch(`${API_BASE_URL}/api/comment_post/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: commentText }),
      credentials: 'include',
    })
      .then(handleFetchResponse)
      .then(data => {
        fetchCommunityPosts();
        setMessage('Comment added!');
      })
      .catch(err => {
        console.error("Error commenting on post:", err);
        setMessage(`Failed to add comment: ${err.message}`);
      });
  };

  const handleDeletePost = async (postId) => {
    if (!currentUserId) {
        setMessage("You must be logged in to delete a post.");
        return;
    }
    if (window.confirm("Are you sure you want to delete this post?")) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/delete_post/${postId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            await handleFetchResponse(res);
            fetchCommunityPosts();
        } catch (err) {
            console.error("Error deleting post:", err);
            setMessage(`Failed to delete post: ${err.message}`);
        }
    }
  };

  const isPostButtonDisabled = isUploading ||
    (modalMode === 'upload' && !uploadedFile) ||
    (modalMode === 'selectExisting' && !selectedExistingDrawing);

  return (
    <div className="artpost-container">
      <h1 className="artpost-title">🖼️ Art Community</h1>
      <p className="artpost-subtitle">Post your drawing and get feedback from others!</p>

      <div className="new-post-actions">
        <button className="new-post-btn upload-new-btn" onClick={() => openPostModal('upload')}>
          + Upload New Image
        </button>
        <button className="new-post-btn select-existing-btn" onClick={() => openPostModal('selectExisting')}>
          Select From My Drawings
        </button>
      </div>

      <div className="back-button-container">
        <button onClick={goBackHome} className="back-button">
          ⬅ Home
        </button>
      </div>

      {/* Message display area */}
      {message && <div className="app-message">{message}</div>}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create a New Post</h2>

            {modalMode === 'upload' && (
              <div className="tab-content upload-tab">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
                {uploadedFilePreview && (
                  <div className="selected-preview">
                    <h4>Preview:</h4>
                    <img src={uploadedFilePreview} alt="Uploaded preview" className="selected-preview-img" />
                  </div>
                )}
                {!uploadedFilePreview && <p className="upload-hint">Select an image file from your computer.</p>}
              </div>
            )}

            {modalMode === 'selectExisting' && (
              <div className="tab-content select-existing-tab">
                {/* Conditionally render drawings or login message based on currentUserId */}
                {currentUserId !== null ? (
                  myDrawings.length > 0 ? (
                    <div className="drawing-grid">
                      {myDrawings.map((drawing) => (
                        <div
                          key={drawing.id}
                          className={`drawing-item ${selectedExistingDrawing && selectedExistingDrawing.id === drawing.id ? 'selected' : ''}`}
                          onClick={() => handleSelectExistingDrawing(drawing)}
                        >
                          <img src={drawing.image_url} alt={drawing.name} className="drawing-thumb" />
                          <p className="drawing-name">{drawing.name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-drawings-message">You have no drawings saved. Go to 'My Drawings' to create some!</p>
                  )
                ) : ( // If currentUserId is null (not logged in or still loading)
                  <p className="no-drawings-message">Loading your drawings... or Please log in.</p>
                )}
                {selectedExistingDrawing && (
                  <div className="selected-preview">
                    <h4>Selected Drawing:</h4>
                    <img src={selectedExistingDrawing.image_url} alt={selectedExistingDrawing.name} className="selected-preview-img" />
                    <p className="drawing-name">{selectedExistingDrawing.name}</p>
                  </div>
                )}
              </div>
            )}

            <textarea
              placeholder="Write a caption..."
              value={newPostCaption}
              onChange={(e) => setNewPostCaption(e.target.value)}
              className="caption-input"
              rows="3"
            />

            <div className="modal-actions">
              <button
                onClick={handlePost}
                className="submit-post-btn"
                disabled={isPostButtonDisabled}
              >
                {isUploading ? 'Uploading...' : 'Post'}
              </button>
              <button onClick={() => setShowModal(false)} className="cancel-post-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Community Posts Section */}
      <hr className="section-divider" />
      <h2 className="community-posts-title">Community Feed</h2>

      {/* Container for Search Bar and Sort Controls */}
      <div className="filter-and-search-row">
        {/* Search Bar */}
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Filter/Sort Controls */}
        <div className="sort-controls">
          <label htmlFor="sort-by">Sort by:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest</option>
            <option value="most_liked">Most Liked</option>
          </select>
        </div>
      </div>


      <div className="community-posts-grid">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <div key={post.id} className="community-post-card">
              <img src={post.image_url} alt={post.caption} className="post-image" />
              <p className="post-caption">{post.caption}</p>
              <p className="post-author">By: {post.author_username || 'Anonymous'}</p>

              <div className="post-interactions">
                <button onClick={() => handleLike(post.id)} className="like-btn">
                  ❤️ {post.likes_count || 0} Likes
                </button>
                <div className="comments-section">
                  {post.comments && post.comments.length > 0 ? (
                    post.comments.map((comment, idx) => (
                      <p key={idx} className="comment-text">
                        <strong>{comment.author_username || 'User'}:</strong> {comment.text}
                      </p>
                    ))
                  ) : (
                    <p className="no-comments-message">No comments yet.</p>
                  )}
                  <input
                    type="text"
                    
                    placeholder="Add a comment..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleComment(post.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="comment-input"
                  />
                </div>
                
                {currentUserId && currentUserId === post.user_id && (
                    <button
                        onClick={() => handleDeletePost(post.id)}
                        className="delete-post-btn"
                    >
                        Delete Post
                    </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No posts found matching your search or filters.</p>
        )}
      </div>
    </div>
  );
};

export default ArtPost;