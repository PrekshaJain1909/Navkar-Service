"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Settings,
  LogOut,
  FileText,
  Bus,
  Bell,
  Menu,
  CalendarCheck
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Payments", href: "/payments", icon: DollarSign },
  { name: "Reports", href: "/reports", icon: FileText },
  
  { name: "Tracker", href: "/tracker", icon: CalendarCheck },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    // Add logout logic here
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex flex-col text-gray-800">
      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100 shadow-xl sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-6 max-w-7xl mx-auto">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center shadow-md">
              <Bus className="w-6 h-6 text-gray-700" />
            </div>
            <span className="text-2xl font-extrabold tracking-wide select-none">
              Navkar Service
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-gray-100 text-gray-900 shadow-lg border-2 border-gray-300"
                      : "hover:bg-gray-300 hover:shadow-md hover:text-gray-900"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4 ms-3">
            {/* <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-300 hover:text-gray-700 text-gray-200 p-2 rounded-full"
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6" />
              <span className="sr-only">Notifications</span>
            </Button> */}

            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-800 text-white font-semibold shadow-md"
            >
              <LogOut className="mr-2 h-5 w-5" /> Logout
            </Button>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-300 transition-colors"
              aria-label="Toggle Menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-6 w-6 text-gray-200" />
              <span className="sr-only">Toggle menu</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Links */}
        <div
          className={cn(
            "md:hidden bg-gray-600 overflow-hidden transition-[max-height] duration-300 ease-in-out",
            menuOpen ? "max-h-screen" : "max-h-0"
          )}
          aria-hidden={!menuOpen}
        >
          <nav className="flex flex-col p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md text-base font-semibold transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "hover:bg-gray-500 hover:text-gray-200 text-gray-300"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-700 text-gray-300 py-4">
        <div className="container max-w-7xl mx-auto px-6 text-center text-sm">
          © {new Date().getFullYear()} Navkar Service. All rights reserved.
        </div>
      </footer>
    </div>
  );
}