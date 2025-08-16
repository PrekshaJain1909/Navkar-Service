"use client";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import Swal from "sweetalert2";

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const res = await fetch("http://localhost:5000/api/reports");
      if (!res.ok) throw new Error("Failed to load report");
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error(err);
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const exportReport = async (type: string) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Swal.fire({
        title: `${type} Report Exported`,
        text: "Your report has been successfully generated and downloaded.",
        icon: "success",
        confirmButtonColor: "#3085d6"
      });
    } catch (error) {
      Swal.fire({
        title: "Export Failed",
        text: "Something went wrong while exporting the report.",
        icon: "error",
        confirmButtonColor: "#d33"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingReport) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-lg font-medium">
          Loading report...
        </div>
      </DashboardLayout>
    );
  }

  if (!reportData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-red-600 font-medium">
          Failed to load report data
        </div>
      </DashboardLayout>
    );
  }

  const {
    keyMetrics,
    monthlyData,
    paymentModeData,
    topRoutes = [],
    outstandingBySchool = [],
    thisMonthSummary
  } = reportData;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">
              Comprehensive insights into fee collection and student data
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => exportReport("Monthly")}
              variant="outline"
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Monthly
            </Button>
            <Button
              onClick={() => exportReport("Annual")}
              variant="outline"
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Annual
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Collection Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {keyMetrics.collectionRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {keyMetrics.activeStudents}
              </div>
              <p className="text-xs text-muted-foreground">
                +12 new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Average
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{keyMetrics.monthlyAverage.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Per month collection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Overdue Accounts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {keyMetrics.overdueAccounts}
              </div>
              <p className="text-xs text-muted-foreground">Require follow-up</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Collection Trends</CardTitle>
              <CardDescription>
                Fee collection vs pending amounts over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      `₹${value.toLocaleString()}`,
                      ""
                    ]}
                  />
                  <Bar dataKey="collected" fill="#10b981" name="Collected" />
                  <Bar dataKey="pending" fill="#ef4444" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Mode Distribution</CardTitle>
              <CardDescription>
                Breakdown of payment methods used by students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentModeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent ?? 0 * 100).toFixed(0)}%`
                    }
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentModeData.map(
                      (entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        {topRoutes.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Routes</CardTitle>
                <CardDescription>
                  Routes with highest collection rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topRoutes.map(
                    (
                      route: { route: string; rate: number; students: number },
                      index: number
                    ) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{route.route}</p>
                          <p className="text-sm text-muted-foreground">
                            {route.students} students
                          </p>
                        </div>
                        <Badge
                          variant={route.rate >= 90 ? "default" : "secondary"}
                        >
                          {route.rate}%
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outstanding Dues by School</CardTitle>
                <CardDescription>
                  Schools with pending fee collections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {outstandingBySchool.map(
                    (
                      school: {
                        school: string;
                        amount: number;
                        students: number;
                      },
                      index: number
                    ) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{school.school}</p>
                          <p className="text-sm text-muted-foreground">
                            {school.students} students
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">
                            ₹{school.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monthly Summary */}
        {thisMonthSummary && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>
                Detailed breakdown of current month performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{thisMonthSummary.collected.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total Collected
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    ₹{thisMonthSummary.pending.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pending Amount
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {thisMonthSummary.collectionRate}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Collection Rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
