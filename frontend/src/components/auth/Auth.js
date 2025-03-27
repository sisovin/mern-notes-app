import { useState } from "react";
import axios from "../../api/axios";

const Auth = ({ type }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = type === "login" ? "/auth/login" : "/auth/register";
    try {
      await axios.post(endpoint, { email, password });
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">{type === "login" ? "Login" : "Register"}</button>
    </form>
  );
};

export default Auth;
