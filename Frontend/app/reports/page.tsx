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
import { authFetch } from "@/lib/auth";

type AnnualStatus = "Completed" | "Partial Paid" | "Pending" | "NA";

interface AnnualRow {
  id: string;
  name: string;
  class: string;
  schoolName: string;
  contactInfo: string;
  monthlyFee: number;
  activeMonths: number;
  expectedAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: AnnualStatus;
}

interface AnnualSummary {
  totalExpected: number;
  totalPaid: number;
  totalDue: number;
  completed: number;
  partial: number;
  pending: number;
  na: number;
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [annualLoading, setAnnualLoading] = useState(false);
  const [annualRows, setAnnualRows] = useState<AnnualRow[]>([]);
  const [annualSummary, setAnnualSummary] = useState<AnnualSummary | null>(null);
  const [annualStatusFilter, setAnnualStatusFilter] = useState<"All" | "Completed" | "Partial Paid" | "Pending">("All");

  const monthOptions = [
    { value: 1, label: "Jan" },
    { value: 2, label: "Feb" },
    { value: 3, label: "Mar" },
    { value: 4, label: "Apr" },
    { value: 5, label: "May" },
    { value: 6, label: "Jun" },
    { value: 7, label: "Jul" },
    { value: 8, label: "Aug" },
    { value: 9, label: "Sep" },
    { value: 10, label: "Oct" },
    { value: 11, label: "Nov" },
    { value: 12, label: "Dec" },
  ];

  const yearOptions = Array.from({ length: 6 }, (_, index) => currentDate.getFullYear() - index);

  useEffect(() => {
    fetchReport();
  }, []);

  useEffect(() => {
    fetchAnnualTable();
  }, [selectedYear]);

  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const res = await authFetch("/api/reports");
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

  const fetchAnnualTable = async () => {
    setAnnualLoading(true);
    try {
      const res = await authFetch(`/api/reports/annual-table?year=${selectedYear}`);
      if (!res.ok) throw new Error("Failed to load annual table");

      const data = await res.json();
      setAnnualRows(data.rows || []);
      setAnnualSummary(data.summary || null);
    } catch (error) {
      setAnnualRows([]);
      setAnnualSummary(null);
      Swal.fire({
        title: "Annual Data Error",
        text: "Unable to load annual student table.",
        icon: "error",
        confirmButtonColor: "#d33"
      });
    } finally {
      setAnnualLoading(false);
    }
  };

  const exportMonthlyReport = async (format: "csv" | "xlsx") => {
    setIsLoading(true);
    try {
      const res = await authFetch(
        `/api/reports/monthly-export?month=${selectedMonth}&year=${selectedYear}&format=${format}`,
        { method: "GET" }
      );

      if (!res.ok) throw new Error("Failed to export monthly report");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `monthly-report-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        title: `Monthly ${format.toUpperCase()} Exported`,
        text: `Monthly student report downloaded as ${format.toUpperCase()}.`,
        icon: "success",
        confirmButtonColor: "#3085d6"
      });
    } catch (error) {
      Swal.fire({
        title: "Export Failed",
        text: "Something went wrong while exporting the monthly report.",
        icon: "error",
        confirmButtonColor: "#d33"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnnualReport = async (format: "csv" | "xlsx") => {
    setIsLoading(true);
    try {
      const res = await authFetch(
        `/api/reports/annual-export?year=${selectedYear}&format=${format}`,
        { method: "GET" }
      );

      if (!res.ok) throw new Error("Failed to export annual report");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `annual-report-${selectedYear}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        title: `Annual ${format.toUpperCase()} Exported`,
        text: `Annual student report downloaded as ${format.toUpperCase()}.`,
        icon: "success",
        confirmButtonColor: "#3085d6"
      });
    } catch (error) {
      Swal.fire({
        title: "Export Failed",
        text: "Something went wrong while exporting the annual report.",
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

  const getAnnualStatusClass = (status: AnnualStatus) => {
    if (status === "Completed") return "bg-green-100 text-green-800";
    if (status === "Partial Paid") return "bg-amber-100 text-amber-800";
    if (status === "Pending") return "bg-red-100 text-red-800";
    return "bg-slate-200 text-slate-700";
  };

  const filteredAnnualRows = annualRows.filter((row) => {
    if (annualStatusFilter === "All") return true;
    return row.status === annualStatusFilter;
  });

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
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <Button
              onClick={() => exportMonthlyReport("csv")}
              variant="outline"
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Monthly CSV
            </Button>
            <Button
              onClick={() => exportMonthlyReport("xlsx")}
              variant="outline"
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Monthly Excel
            </Button>
            <Button
              onClick={() => exportAnnualReport("csv")}
              variant="outline"
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Annual CSV
            </Button>
            <Button
              onClick={() => exportAnnualReport("xlsx")}
              variant="outline"
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Annual Excel
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

        <Card>
          <CardHeader>
            <CardTitle>Annual Student Report ({selectedYear})</CardTitle>
            <CardDescription>
              Yearly student-wise status and collection overview with filter controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            {annualSummary && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Expected</p>
                  <p className="text-lg font-semibold">₹{annualSummary.totalExpected.toLocaleString()}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-lg font-semibold text-green-700">₹{annualSummary.totalPaid.toLocaleString()}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="text-lg font-semibold text-red-700">₹{annualSummary.totalDue.toLocaleString()}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Students</p>
                  <p className="text-lg font-semibold">{annualRows.length}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                size="sm"
                variant={annualStatusFilter === "All" ? "default" : "outline"}
                onClick={() => setAnnualStatusFilter("All")}
              >
                All ({annualRows.length})
              </Button>
              <Button
                size="sm"
                variant={annualStatusFilter === "Completed" ? "default" : "outline"}
                onClick={() => setAnnualStatusFilter("Completed")}
              >
                Completed ({annualSummary?.completed || 0})
              </Button>
              <Button
                size="sm"
                variant={annualStatusFilter === "Partial Paid" ? "default" : "outline"}
                onClick={() => setAnnualStatusFilter("Partial Paid")}
              >
                Partial ({annualSummary?.partial || 0})
              </Button>
              <Button
                size="sm"
                variant={annualStatusFilter === "Pending" ? "default" : "outline"}
                onClick={() => setAnnualStatusFilter("Pending")}
              >
                Pending ({annualSummary?.pending || 0})
              </Button>
            </div>

            {annualLoading ? (
              <div className="py-10 text-center text-muted-foreground">Loading annual table...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 border-b">Student</th>
                      <th className="text-left p-3 border-b">Class</th>
                      <th className="text-left p-3 border-b">School</th>
                      <th className="text-left p-3 border-b">Monthly Fee</th>
                      <th className="text-left p-3 border-b">Active Months</th>
                      <th className="text-left p-3 border-b">Expected</th>
                      <th className="text-left p-3 border-b">Paid</th>
                      <th className="text-left p-3 border-b">Due</th>
                      <th className="text-left p-3 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnnualRows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="p-3 border-b font-medium">{row.name}</td>
                        <td className="p-3 border-b">{row.class || "-"}</td>
                        <td className="p-3 border-b">{row.schoolName || "-"}</td>
                        <td className="p-3 border-b">₹{row.monthlyFee.toLocaleString()}</td>
                        <td className="p-3 border-b">{row.activeMonths}</td>
                        <td className="p-3 border-b">₹{row.expectedAmount.toLocaleString()}</td>
                        <td className="p-3 border-b text-green-700">₹{row.paidAmount.toLocaleString()}</td>
                        <td className="p-3 border-b text-red-700">₹{row.dueAmount.toLocaleString()}</td>
                        <td className="p-3 border-b">
                          <Badge variant="secondary" className={getAnnualStatusClass(row.status)}>
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAnnualRows.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">No students found for selected filter.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
