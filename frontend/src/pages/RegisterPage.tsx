import { type FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useRegister } from "../hooks/useAuthQueries.js";
import { useAuthStore } from "../store/authStore.js";

export const RegisterPage = () => {
  const error = useAuthStore((state) => state.error);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const register = useRegister();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/account" replace />;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError(null);

    if (fullName.trim().length < 2) {
      setFieldError("Full name must be at least 2 characters.");
      return;
    }

    if (!email.trim()) {
      setFieldError("Email is required.");
      return;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setFieldError("Password must be at least 8 characters and include letters and numbers.");
      return;
    }

    register.mutate({ fullName, email, password });
  };

  return (
    <section className="panel auth-panel">
      <h2>Create account</h2>
      <form className="auth-form" onSubmit={submit}>
        <label>
          Full name
          <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        {(fieldError || error) && <p className="status-error">{fieldError ?? error}</p>}
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="auth-switch">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
};
