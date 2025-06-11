import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';


const UserContext = createContext(null);


export const UserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null); // This will now store the full user object: { id, email, username }
    const [loadingUser, setLoadingUser] = useState(true);

    // Effect to check user status on app load
    useEffect(() => {
        const checkUser = async () => {
            try {
                // Call your whoami endpoint to check session status
                const response = await axios.get('https://localhost:5001/whoami', { withCredentials: true });
                if (response.data && response.data.user_id) {
                    // Store the entire user data object from the backend response
                    setCurrentUser({
                        id: response.data.user_id,
                        email: response.data.email || 'User', // Fallback for email if not provided
                        username: response.data.username || 'Anonymous' // Fallback for username if not provided
                    });
                } else {
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error("Failed to fetch user status:", error);
                setCurrentUser(null);
            } finally {
                setLoadingUser(false);
            }
        };
        checkUser();
    }, []); // Empty dependency array means this runs once on component mount

    // Function to update user state upon login
    // It now expects the full user data object as an argument
    const login = (userData) => {
        setCurrentUser(userData);
    };

    // Function to handle logout
    const logout = async () => {
        try {
            await axios.post('https://localhost:5001/logout', {}, { withCredentials: true });
            setCurrentUser(null); // Clear user data on logout
        } catch (error) {
            console.error("Logout failed:", error);
            // Optionally, set a message to the user here
        }
    };

    // Provide the context value to children components
    return (
        <UserContext.Provider value={{ currentUser, loadingUser, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook to easily consume the UserContext
export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};