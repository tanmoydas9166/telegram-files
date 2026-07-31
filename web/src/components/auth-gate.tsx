"use client";

import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { AUTH_UNAUTHORIZED_EVENT, request } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthState = "loading" | "authenticated" | "unauthenticated" | "error";

interface AuthStatus {
  authenticated: boolean;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkAuthentication = useCallback(async () => {
    setState("loading");
    setMessage("");
    try {
      const status = await request<AuthStatus>("/auth/status", {
        cache: "no-store",
      });
      setState(status.authenticated ? "authenticated" : "unauthenticated");
    } catch {
      setMessage("Unable to reach the server. Please try again.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void checkAuthentication();
  }, [checkAuthentication]);

  useEffect(() => {
    const handleUnauthorized = () => setState("unauthenticated");
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () =>
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      await request<AuthStatus>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      setState("authenticated");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Authentication failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state === "authenticated") {
    return children;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.08),_transparent_45%)]" />
      <Card className="relative w-full max-w-sm shadow-lg">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {state === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LockKeyhole className="h-5 w-5" />
            )}
          </div>
          <CardTitle>Telegram Files</CardTitle>
          <CardDescription>
            {state === "loading"
              ? "Checking access…"
              : "Enter the site password to continue."}
          </CardDescription>
        </CardHeader>
        {state !== "loading" && (
          <CardContent>
            {state === "error" ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-destructive" role="alert">
                  {message}
                </p>
                <Button className="w-full" onClick={checkAuthentication}>
                  Try again
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="sr-only" htmlFor="site-password">
                    Password
                  </label>
                  <Input
                    id="site-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    autoFocus
                    required
                    disabled={isSubmitting}
                  />
                  {message && (
                    <p className="text-sm text-destructive" role="alert">
                      {message}
                    </p>
                  )}
                </div>
                <Button
                  className="w-full"
                  type="submit"
                  disabled={isSubmitting || password.length === 0}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ShieldCheck />
                  )}
                  {isSubmitting ? "Checking…" : "Continue"}
                </Button>
              </form>
            )}
          </CardContent>
        )}
      </Card>
    </main>
  );
}
