import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from './UserContext'; // Adjust path as needed

const PrivateRoute = ({ children }) => {
    const { currentUser, loadingUser } = useUser();

    if (loadingUser) {
        // Show a loading indicator while checking authentication status
        return <div>Checking authentication...</div>;
    }

    if (!currentUser) {
        // If not logged in, redirect to the login page
        return <Navigate to="/login" replace />;
    }

    // If logged in, render the child components (the protected route)
    return children;
};

export default PrivateRoute;