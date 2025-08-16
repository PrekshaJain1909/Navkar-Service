"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, AlertCircle, TrendingUp, Download, Plus } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import AddStudentDialog from "../AddStudentDialog";

interface DashboardStats {
  totalStudents: number;
  totalFeesCollected: number;
  pendingDues: number;
  thisMonthCollection: number;
}

interface RecentPayment {
  id: string;
  studentName: string;
  amount: number;
  date: string;
  mode: string;
  dueAmount: number;
}

const swalBaseOptions = {
  background: "#ffffff",
  confirmButtonColor: "#2563eb",
  cancelButtonColor: "#6b7280",
  buttonsStyling: true,
  customClass: {
    popup: "rounded-xl shadow-lg",
    confirmButton: "px-4 py-2 rounded-lg text-white",
    cancelButton: "px-4 py-2 rounded-lg text-white",
  },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN');
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalFeesCollected: 0,
    pendingDues: 0,
    thisMonthCollection: 0,
  });
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("https://navkar-service-2.onrender.com/api/dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      
      const data = await response.json();
      
      setStats({
        totalStudents: data.stats.totalStudents || 0,
        totalFeesCollected: data.stats.totalFeesCollected || 0,
        pendingDues: data.stats.pendingDues || 0,
        thisMonthCollection: data.stats.thisMonthCollection || 0,
      });

      setRecentPayments(
        data.recentPayments.map((payment: any) => ({
          ...payment,
          dueAmount: payment.dueAmount || 0,
          date: payment.date ? formatDate(payment.date) : "",
          id: payment.id || Math.random().toString(36).substring(2, 9)
        }))
      );
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        ...swalBaseOptions,
        icon: "error",
        title: "Oops...",
        text: "Unable to load dashboard data. Please try again later!",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetTotal = async () => {
    const confirmReset = await Swal.fire({
      ...swalBaseOptions,
      title: "Reset Total?",
      text: "This will set the total collected amount back to 0.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Reset",
      cancelButtonText: "Cancel",
    });

    if (confirmReset.isConfirmed) {
      try {
        const response = await fetch("https://navkar-service-2.onrender.com/reset-total", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) throw new Error("Reset request failed");
        
        const data = await response.json();

        Swal.fire({
          ...swalBaseOptions,
          icon: "success",
          title: "Reset Successful",
          text: "Total collected amount has been reset to 0.",
        });
        fetchDashboardData();
      } catch (error) {
        console.error("Reset failed:", error);
        Swal.fire({
          ...swalBaseOptions,
          icon: "error",
          title: "Reset Failed",
          text: "Something went wrong while resetting the total.",
        });
      }
    }
  };

  const exportData = async () => {
    const confirmExport = await Swal.fire({
      ...swalBaseOptions,
      title: "Export Data?",
      text: "Do you want to export all student data to Excel?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Export",
      cancelButtonText: "Cancel",
    });

    if (confirmExport.isConfirmed) {
      try {
        const response = await fetch("https://navkar-service-2.onrender.com/api/students/export");
        if (!response.ok) throw new Error("Export request failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `students-data-${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();

        Swal.fire({
          ...swalBaseOptions,
          icon: "success",
          title: "Export Successful",
          text: "All student data has been exported to Excel.",
        });
      } catch (error) {
        console.error("Export failed:", error);
        Swal.fire({
          ...swalBaseOptions,
          icon: "error",
          title: "Export Failed",
          text: "Something went wrong while exporting the data.",
        });
      }
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6 bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800">Dashboard</h1>
            <p className="text-gray-500">School Bus Fee Management Overview</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={exportData} 
              variant="outline" 
              className="hover:bg-gray-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <AddStudentDialog onStudentAdded={fetchDashboardData} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Students
              </CardTitle>
              <Users className="h-6 w-6 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {stats.totalStudents}
              </div>
              <p className="text-xs text-gray-500">Active students registered</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Collected
              </CardTitle>
              <DollarSign className="h-6 w-6 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.totalFeesCollected)}
              </div>
              <p className="text-xs text-gray-500">All-time fee collection</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pending Dues
              </CardTitle>
              <AlertCircle className="h-6 w-6 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.pendingDues)}
              </div>
              <p className="text-xs text-gray-500">
                From {stats.totalStudents} students
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                This Month
              </CardTitle>
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.thisMonthCollection)}
              </div>
              <p className="text-xs text-gray-500">Current month collection</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments */}
        <Card className="rounded-xl shadow-md bg-white">
          <CardHeader>
            <CardTitle className="text-gray-800">Recent Payments</CardTitle>
            <CardDescription>
              {stats.pendingDues > 0 ? (
                <span className="text-red-500">
                  Total outstanding: {formatCurrency(stats.pendingDues)}
                </span>
              ) : (
                <span className="text-green-500">All dues cleared</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 transition-colors hover:bg-gray-100`}
                  >
                    <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{payment.studentName}</p>
                        <p className="text-sm text-gray-500">{payment.date}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800">
                          {formatCurrency(payment.amount)}
                        </p>
                        <Badge variant={payment.mode === "Cash" ? "secondary" : "default"}>
                          {payment.mode}
                        </Badge>
                      </div>
                      <p className={`text-xs mt-1 ${
                        payment.dueAmount > 0 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {payment.dueAmount > 0 ? (
                          `Due: ${formatCurrency(payment.dueAmount)}`
                        ) : (
                          'No dues'
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent payments found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Status */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-xl shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-gray-800">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: <Plus className="w-4 h-4 mr-2" />, label: "Add New Student" },
                { icon: <DollarSign className="w-4 h-4 mr-2" />, label: "Record Payment" },
                { icon: <AlertCircle className="w-4 h-4 mr-2" />, label: "Send Reminders" }
              ].map((action) => (
                <Button
                  key={action.label}
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() =>
                    Swal.fire({
                      ...swalBaseOptions,
                      icon: "info",
                      title: action.label,
                      text: `You clicked on "${action.label}". Add your function here.`,
                    })
                  }
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
              <Button
                className="w-full justify-start"
                variant="destructive"
                onClick={resetTotal}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Reset Total Collected
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-gray-800">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database Status</span>
                <Badge variant="default">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Backup</span>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">SMS Service</span>
                <Badge variant="default">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}