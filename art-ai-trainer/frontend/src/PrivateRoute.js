import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from './UserContext'; 

const PrivateRoute = ({ children }) => {
    const { currentUser, loadingUser } = useUser();

    if (loadingUser) {
        // Show a loading indicator while checking authentication status
        return <div>Checking authentication...</div>;
    }

    if (!currentUser) {
        
        return <Navigate to="/login" replace />;
    }

   
    return children;
};

export default PrivateRoute;