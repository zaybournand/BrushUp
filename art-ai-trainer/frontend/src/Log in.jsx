

import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { useUser } from './UserContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(''); // New state for displaying messages
    const navigate = useNavigate();
    const { login } = useUser();

    const logInUser = async () => {
        setMessage(''); // Clear previous messages

        if (!email.trim()) {
            setMessage("Email has been left blank!");
            return;
        }

        if (!password.trim()) {
            setMessage("Password has been left blank!");
            return;
        }

        try {
            const response = await axios.post(
                'https://localhost:5001/login',
                { email, password },
                { withCredentials: true }
            );

            console.log("Login successful:", response.data);

            // IMPORTANT: Pass the entire user data object, which now includes id, email, and username
            if (response.data && response.data.id) {
                login({ // Pass an object with id, email, and username
                    id: response.data.id,
                    email: response.data.email,
                    username: response.data.username // Include username
                });
                setMessage('Login successful!');
                navigate("/");
            } else {
                console.warn("Login response did not contain expected user data. Attempting /whoami fallback.");
                const sessionCheck = await axios.get(
                    'https://localhost:5001/whoami',
                    { withCredentials: true }
                );
                console.log("Session after login fallback:", sessionCheck.data);
                if (sessionCheck.data && sessionCheck.data.user_id) {
                    login({ // Fallback also needs to pass the full object if available
                        id: sessionCheck.data.user_id,
                        email: sessionCheck.data.email, // Assuming whoami also returns email and username
                        username: sessionCheck.data.username
                    });
                    setMessage('Login successful via session check!');
                    navigate("/");
                } else {
                    setMessage('Login failed: Could not retrieve user session.');
                }
            }

        } catch (error) {
            console.error("Login failed:", error);
            if (error.response?.status === 401) {
                setMessage("Invalid credentials. Please check your email and password.");
            } else {
                setMessage("Login failed. An unexpected error occurred. Please try again.");
            }
        }
    };

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            backgroundColor: "#f5f5f5",
        }}>
            <div style={{
                background: "white",
                padding: "2rem",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                width: "100%",
                maxWidth: "400px",
            }}>
                <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Log Into Your Account</h2>
                <form>
                    <div style={{ marginBottom: "1rem" }}>
                        <label htmlFor="email" style={{ display: "block", marginBottom: "0.5rem" }}>Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                            }}
                            placeholder="Enter your email address"
                        />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <label htmlFor="password" style={{ display: "block", marginBottom: "0.5rem" }}>Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                            }}
                            placeholder="Enter password"
                        />
                    </div>
                    {/* Message display area */}
                    {message && (
                        <div style={{
                            color: message.includes('successful') ? 'green' : 'red',
                            marginBottom: "1rem",
                            textAlign: "center"
                        }}>
                            {message}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={logInUser}
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            cursor: "pointer",
                        }}
                    >
                        Login
                    </button>
                    <p style={{
                        textAlign: "center",
                        marginTop: "1rem",
                        fontSize: "0.9rem",
                        color: "#555",
                    }}>
                        Don't have an account? <a href="/register" style={{ color: "#007bff" }}>Register</a>
                    </p>
                </form>
            </div>
        </div>
    );
}