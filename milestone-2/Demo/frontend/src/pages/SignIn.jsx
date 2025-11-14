import React, { useState } from "react";
import { useUserContext } from "../lib/AuthProvider";
import { Link } from "react-router-dom";

const SignIn = () => {
    const { login } = useUserContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        await login(email, password);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
            <div className="w-full max-w-md p-10 bg-gray-900 rounded-xl shadow-xl">
                <h1 className="text-3xl font-bold text-rose-400 text-center mb-8">Sign In</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
                        required
                    />
                    <button
                        type="submit"
                        className="p-3 rounded-lg bg-rose-400 hover:bg-rose-600 font-semibold text-black shadow-md transition cursor-pointer"
                    >
                        Login
                    </button>
                </form>
                <p className="text-gray-400 text-sm text-center mt-4">
                    Don't have an account? <Link to="/sign-up" className="text-rose-400 cursor-pointer hover:underline">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default SignIn;
