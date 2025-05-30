import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create a Context
const UserContext = createContext(null);

// Create a Provider component
export const UserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null); // Stores user_id or null
    const [loadingUser, setLoadingUser] = useState(true); // Tracks if user status is being checked

    // Effect to check user status on app load
    useEffect(() => {
        const checkUser = async () => {
            try {
                // Call your /whoami endpoint to check session status
                const response = await axios.get('https://localhost:5000/whoami', { withCredentials: true });
                if (response.data && response.data.user_id) {
                    setCurrentUser(response.data.user_id);
                } else {
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error("Failed to fetch user status:", error);
                setCurrentUser(null); // Ensure user is null on any error
            } finally {
                setLoadingUser(false); // Finished checking user status
            }
        };
        checkUser();
    }, []); // Run only once on component mount

    // Functions to update user state
    const login = (userId) => setCurrentUser(userId);
    const logout = async () => {
        try {
            await axios.post('https://localhost:5000/logout', {}, { withCredentials: true });
            setCurrentUser(null); // Clear user state on successful logout
        } catch (error) {
            console.error("Logout failed:", error);
            // Optionally, handle error or still clear user on client if server logout is not critical
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