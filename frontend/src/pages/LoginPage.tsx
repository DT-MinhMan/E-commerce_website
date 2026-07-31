import { type FormEvent, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useLogin } from "../hooks/useAuthQueries.js";
import { useAuthStore } from "../store/authStore.js";

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export const LoginPage = () => {
  const location = useLocation();
  const error = useAuthStore((state) => state.error);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  if (user) {
    const destination = (location.state as LocationState | null)?.from?.pathname ?? "/account";
    return <Navigate to={destination} replace />;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError(null);

    if (!email.trim() || !password) {
      setFieldError("Email and password are required.");
      return;
    }

    login.mutate({ email, password });
  };

  return (
    <section className="panel auth-panel">
      <h2>Log in</h2>
      <form className="auth-form" onSubmit={submit}>
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
            autoComplete="current-password"
          />
        </label>
        {(fieldError || error) && <p className="status-error">{fieldError ?? error}</p>}
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="auth-switch">
        Need an account? <Link to="/register">Register</Link>
      </p>
    </section>
  );
};
