import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { RequestError } from "../api/client";
import { Button, ErrorBanner, Input, Label } from "../components/ui/Field";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  return <AuthForm mode="login" />;
}

export function RegisterPage() {
  return <AuthForm mode="register" />;
}

function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const [email, setEmail] = useState(mode === "login" ? "demo@nourish.local" : "");
  const [password, setPassword] = useState(mode === "login" ? "DemoPass123!" : "");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, displayName);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof RequestError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-mist bg-paper p-8 shadow-card">
        <p className="font-display text-3xl text-forest">Nourish</p>
        <h1 className="mt-2 font-display text-2xl">
          {mode === "login" ? "Welcome back" : "Create your kitchen ledger"}
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Track meals, versioned goals, and nutrient trends — one day at a time.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {mode === "register" && (
            <div>
              <Label>Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <ErrorBanner message={error} />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <p className="mt-5 text-sm text-ink/60">
          {mode === "login" ? (
            <>
              New here? <Link className="text-forest underline" to="/register">Create an account</Link>
            </>
          ) : (
            <>
              Already have one? <Link className="text-forest underline" to="/login">Sign in</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
