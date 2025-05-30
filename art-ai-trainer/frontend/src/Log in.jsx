import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { useUser } from './UserContext'; // <-- IMPORT THIS! Adjust path if needed

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { login } = useUser(); // <-- Use the custom hook to get the login function

    const logInUser = async () => {
        if (!email.trim()) {
            alert("Email has been left blank!");
            return;
        }

        if (!password.trim()) {
            alert("Password has been left blank!");
            return;
        }

        try {
            const response = await axios.post(
                'https://localhost:5000/login',
                { email, password },
                { withCredentials: true } // ✅ Must include this for session cookie
            );

            console.log("Login successful:", response.data);

            // *** IMPORTANT CHANGE: Update global user state via context ***
            // Assuming your Flask /login endpoint returns user_id in response.data
            if (response.data && response.data.id) {
                login(response.data.id); // Call the context's login function with the user's ID
            } else {
                // Handle case where login endpoint doesn't return ID (though it should)
                console.warn("Login response did not contain user ID.");
                // You might still call login() with a generic true if ID isn't strictly needed for auth status
                // Or make another /whoami call to refresh context if necessary
                const sessionCheck = await axios.get(
                    'https://localhost:5000/whoami',
                    { withCredentials: true }
                );
                console.log("Session after login:", sessionCheck.data);
                if (sessionCheck.data && sessionCheck.data.user_id) {
                    login(sessionCheck.data.user_id);
                }
            }


            // The optional sessionCheck call here is less critical now that `UserContext` does it on load
            // and we're explicitly setting the user via `login(id)`.
            // You can remove this block if you're confident in `login(response.data.id)`
            // const sessionCheck = await axios.get(
            //     'http://localhost:5000/whoami',
            //     { withCredentials: true }
            // );
            // console.log("Session:", sessionCheck.data);

            // Redirect after successful login
            navigate("/"); // Navigate to the home page or dashboard
        } catch (error) {
            console.error("Login failed:", error);
            if (error.response?.status === 401) {
                alert("Invalid credentials");
            } else {
                alert("Login failed. Please try again.");
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
                            placeholder="Enter a valid email address"
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