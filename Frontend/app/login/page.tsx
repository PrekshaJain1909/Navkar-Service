"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authFetch, getApiMessage, setAuthToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        setError(await getApiMessage(response, "Invalid credentials"));
        return;
      }

      const data = await response.json();
      if (data?.token) {
        setAuthToken(data.token);
      }

      const nextPath = new URLSearchParams(window.location.search).get("next") || "/dashboard";
      router.replace(nextPath);
      router.refresh();
    } catch (requestError) {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Access your dashboard with your account credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-gray-600 space-y-2">
            <p>
              No account? <Link href="/signup" className="text-blue-600 hover:underline">Create one</Link>
            </p>
            <p>
              Forgot password? <Link href="/forgot-password" className="text-blue-600 hover:underline">Reset it</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
