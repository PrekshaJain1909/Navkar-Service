"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Search, DollarSign, Calendar, CreditCard } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import AddStudentDialog from "../AddStudentDialog"
import Swal from "sweetalert2"

interface Student {
  _id: string
  name: string
  monthlyFee?: number
  dueAmount?: number
  lastPaymentAmount?: number
  lastPaymentDate?: string | Date
  lastPaymentMode?: string
  lastPaymentPeriod?: string
  paymentStatus?: "completed" | "pending"
  totalCollected?: number
  totalDue?: number
}

export default function PaymentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recordPaymentStudent, setRecordPaymentStudent] = useState<Student | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [paymentMode, setPaymentMode] = useState<string>("Cash")
  const [paymentPeriod, setPaymentPeriod] = useState<string>("")
  const [paymentStatus, setPaymentStatus] = useState<"completed" | "pending">("completed")
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("http://localhost:5000/api/students")
      if (!response.ok) throw new Error(`Server error ${response.status}`)
      const data: Student[] = await response.json()
      setStudents(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch students")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.lastPaymentMode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.lastPaymentPeriod || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCollected = students.reduce((sum, s) => sum + (s.totalCollected || 0), 0)
  const thisMonthPayments = students.filter(s => {
    if (!s.lastPaymentDate) return false
    const d = new Date(s.lastPaymentDate)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const recordPayment = async () => {
    if (!recordPaymentStudent) return
    if (paymentAmount <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Amount",
        text: "Please enter a valid payment amount",
      })
      return
    }

    const dateObj = new Date(paymentDate)

    setIsSubmittingPayment(true)
    try {
      const res = await fetch(
        `http://localhost:5000/api/payments/${recordPaymentStudent._id}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: paymentAmount,
            mode: paymentMode,
            month: dateObj.getMonth() + 1,
            year: dateObj.getFullYear()
          })
        }
      )

      if (!res.ok) throw new Error(`Failed to record payment: ${res.statusText}`)

      await fetchStudents()
      setRecordPaymentStudent(null)
      setPaymentAmount(0)
      setPaymentDate(new Date().toISOString().slice(0, 10))
      setPaymentMode("Cash")
      setPaymentPeriod("")
      setPaymentStatus("completed")

      Swal.fire({
        icon: "success",
        title: "Payment Recorded",
        text: "The payment was successfully recorded.",
        confirmButtonColor: "#3085d6"
      })
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Error recording payment"
      })
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 bg-gray-50 p-4 sm:p-8 rounded-xl shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Payments</h1>
            <p className="text-gray-500">Track and manage student fee payments</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AddStudentDialog onStudentAdded={fetchStudents} />
            <Button onClick={fetchStudents} variant="outline" className="border-gray-300 hover:bg-gray-100">
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
          {[{
            title: "Total Collected",
            value: `₹${totalCollected.toLocaleString()}`,
            icon: <DollarSign className="h-6 w-6 text-gray-600" />,
            subtitle: "All-time collection"
          }, {
            title: "This Month",
            value: `₹${thisMonthPayments.reduce((sum, s) => sum + (s.lastPaymentAmount || 0), 0).toLocaleString()}`,
            icon: <Calendar className="h-6 w-6 text-gray-600" />,
            subtitle: `${thisMonthPayments.length} payments`
          }, {
            title: "Average Payment",
            value: `₹${thisMonthPayments.length > 0 ? Math.round(totalCollected / thisMonthPayments.length).toLocaleString() : 0}`,
            icon: <CreditCard className="h-6 w-6 text-gray-600" />,
            subtitle: "Per transaction"
          }].map((stat, idx) => (
            <Card key={idx} className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div className="bg-gray-100 p-2 rounded-full">{stat.icon}</div>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <Search className="w-5 h-5 text-gray-500" />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-full sm:max-w-sm border-0 focus:ring-0 text-gray-800"
          />
        </div>

        {error && <div className="text-red-600 font-medium">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <Card className="border border-gray-200 shadow-md bg-white min-w-[600px] sm:min-w-0">
            <CardHeader>
              <CardTitle className="text-gray-800 font-medium">Payment History ({filteredStudents.length})</CardTitle>
              <CardDescription className="text-gray-500">
                Latest payment status of each student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Student</TableHead>
                    <TableHead>Due Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s, i) => (
                    <TableRow key={s._id} className={`${i % 2 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100 transition`}>
                      <TableCell className="font-medium text-gray-800">{s.name}</TableCell>
                      <TableCell>
                        <span className={
                          (s.dueAmount || s.totalDue || 0) > 0 
                            ? "text-red-600 font-medium" 
                            : "text-green-600"
                        }>
                          ₹{s.dueAmount || s.totalDue || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {s.lastPaymentDate ? new Date(s.lastPaymentDate).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        {s.lastPaymentMode ? (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-800">{s.lastPaymentMode}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{s.lastPaymentPeriod || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={s.paymentStatus === "completed" ? "default" : "secondary"}>
                          {s.paymentStatus || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-200"
                          onClick={() => {
                            setRecordPaymentStudent(s)
                            setPaymentAmount(s.dueAmount || s.totalDue || 0)
                            setPaymentDate(new Date().toISOString().slice(0, 10))
                            setPaymentMode("Cash")
                            setPaymentPeriod("")
                            setPaymentStatus("completed")
                          }}
                        >
                          Record Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Modal */}
        {recordPaymentStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg border border-gray-200 animate-fadeIn">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                Record Payment for {recordPaymentStudent.name}
              </h2>
              <div className="space-y-4">
                <label className="block text-sm text-gray-600">
                  Amount
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-300"
                    min={0}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current due: ₹{recordPaymentStudent.dueAmount || recordPaymentStudent.totalDue || 0}
                  </p>
                </label>
                <label className="block text-sm text-gray-600">
                  Date
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-300"
                  />
                </label>
                <label className="block text-sm text-gray-600">
                  Mode
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-300"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                  onClick={() => setRecordPaymentStudent(null)}
                  disabled={isSubmittingPayment}
                >
                  Cancel
                </Button>
                <Button
                  onClick={recordPayment}
                  disabled={isSubmittingPayment || paymentAmount <= 0}
                  className="bg-gray-800 hover:bg-gray-900 text-white"
                >
                  {isSubmittingPayment ? "Saving..." : "Save Payment"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}