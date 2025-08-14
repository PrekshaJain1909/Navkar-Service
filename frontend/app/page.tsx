"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Bus } from "lucide-react"

const MySwal = withReactContent(Swal)

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })

      if (response.ok) {
        await MySwal.fire({
          icon: "success",
          title: "Welcome!",
          text: "You have successfully signed in.",
          showConfirmButton: false,
          timer: 1500,
          background: "#f5f5f7",
          color: "#374151", // cool dark gray
        })
        router.push("/dashboard")
      } else {
        await MySwal.fire({
          icon: "error",
          title: "Invalid credentials",
          text: "Please check your username and password and try again.",
          confirmButtonColor: "#6b7280", // medium gray
          background: "#fafafa",
          color: "#6b7280",
        })
      }
    } catch (error) {
      await MySwal.fire({
        icon: "error",
        title: "Login failed",
        text: "Something went wrong. Please try again later.",
        confirmButtonColor: "#6b7280",
        background: "#fafafa",
        color: "#6b7280",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center px-4 py-12 sm:py-20">
      <Card className="w-full max-w-md sm:max-w-lg shadow-lg border border-gray-300 rounded-xl bg-white">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto mb-5 w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center shadow-sm">
            <Bus className="w-7 h-7 text-gray-600" />
          </div>
          <CardTitle className="text-3xl font-extrabold text-gray-900">
            Navkar Service
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            Sign in to manage student transportation fees
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="username" className="font-semibold text-gray-800">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials((prev) => ({ ...prev, username: e.target.value }))
                }
                required
                className="focus:ring-gray-400 focus:border-gray-400"
                autoComplete="username"
              />
            </div>
            <div className="space-y-1 relative">
              <Label htmlFor="password" className="font-semibold text-gray-800">
                Password
              </Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials((prev) => ({ ...prev, password: e.target.value }))
                }
                required
                className="pr-12 focus:ring-gray-400 focus:border-gray-400"
                autoComplete="current-password"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <Button
              type="submit"
              className="w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold shadow-md hover:shadow-lg transition"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600 font-medium select-none">
            Demo credentials: <br />
            <span className="font-semibold text-gray-800">Username:</span> Ashish <br />
            <span className="font-semibold text-gray-800">Password:</span> Ashish123
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
