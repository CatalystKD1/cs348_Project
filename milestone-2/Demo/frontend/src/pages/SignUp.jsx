import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUserContext } from "../lib/AuthProvider";

const SignUp = () => {
  const { login } = useUserContext();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => 
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Sign-up failed");

      // ✅ Automatically log them in using your existing login()
      await login(form.email, form.password);

      // ✅ Redirect to main page (example: /f1)
      navigate("/f1");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="w-full max-w-md p-10 bg-gray-900 rounded-xl shadow-xl">
        <img src="/DatafyLogo.png" className="mb-5"/>  
        <h1 className="text-xl font-bold text-white text-center mb-8">Sign Up</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
            required
          />
          {error && <p className="text-red-400 text-center">{error}</p>}
          <button
            type="submit"
            className="p-3 rounded-lg bg-rose-400 hover:bg-rose-600 font-semibold text-black shadow-md transition cursor-pointer"
          >
            Create Account
          </button>
        </form>
        <p className="text-gray-400 text-sm text-center mt-4">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-rose-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
