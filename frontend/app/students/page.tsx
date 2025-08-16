"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Search, Phone } from "lucide-react";
import AddStudentDialog from "@/app/AddStudentDialog";

/* -------- Types -------- */
interface PaymentRecord {
  amount: number;
  date: string;
  mode: string;
  period?: string;
}

interface Student {
  _id: string;
  name: string;
  class: string;
  schoolName: string;
  pickupLocation: string;
  dropLocation: string;
  contactInfo: string;
  monthlyFee: number;
  status: "active" | "inactive";
  dueAmount: number; // Changed from totalDue to dueAmount
  totalCollected?: number;
  extraPaid?: number;
  paymentsReceived?: PaymentRecord[];
  lastPaymentAmount?: number;
  lastPaymentDate?: string;
  lastPaymentMode?: string;
  lastPaymentPeriod?: string;
  paymentStatus?: "completed" | "pending";
}

/* -------- PaymentDialog -------- */
function PaymentDialog({
  student,
  open,
  onOpenChange,
  onPaymentSuccess
}: {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess: () => void;
}) {
  const [amount, setAmount] = useState(student?.dueAmount || 0);
  const [mode, setMode] = useState("Cash");
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (student) {
      setAmount(student.dueAmount);
      // Set default period to current month-year
      const now = new Date();
      setPeriod(`${now.getMonth() + 1}-${now.getFullYear()}`);
    }
  }, [student]);

  const handlePay = async () => {
    if (!student || !amount) return;
    setLoading(true);
    setErrMsg("");
    
    try {
      const res = await fetch(
        `https://navkar-service-2.onrender.com/api/payments/${student._id}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(amount),
            mode,
            period
          }),
        }
      );
      
      if (res.ok) {
        onPaymentSuccess();
        onOpenChange(false);
      } else {
        const errorData = await res.json();
        setErrMsg(errorData.message || "Payment failed. Try again.");
      }
    } catch (err) {
      setErrMsg("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {student ? `Record a payment for ${student.name}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>Period (Month-Year)</Label>
            <Input
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g. 6-2023"
            />
          </div>
          
          {errMsg && <div className="text-red-600 text-sm">{errMsg}</div>}
          
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm">
              Current due: ₹{student?.dueAmount || 0}<br />
              Extra paid: ₹{student?.extraPaid || 0}
            </p>
            {amount > (student?.dueAmount || 0) && (
              <p className="text-sm text-blue-600 mt-1">
                Note: ₹{amount - (student?.dueAmount || 0)} will be added to extra paid.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button disabled={loading} onClick={handlePay}>
            {loading ? "Processing..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------- Main Students List Page -------- */
export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://navkar-service-2.onrender.com/api/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.schoolName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground">Manage student information</p>
          </div>
          <AddStudentDialog onStudentAdded={fetchStudents} />
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Students ({filteredStudents.length})</CardTitle>
            <CardDescription>Complete list of registered students</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Monthly Fee</TableHead>
                  <TableHead>Due Amount</TableHead>
                  <TableHead>Extra Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium text-blue-600 hover:underline">
                      <Link href={`/students/${student._id}`}>{student.name}</Link>
                    </TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.schoolName}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {student.contactInfo}
                      </div>
                    </TableCell>
                    <TableCell>₹{student.monthlyFee}</TableCell>
                    <TableCell>
                      <span
                        className={
                          student.dueAmount > 0
                            ? "text-red-600 font-medium"
                            : "text-green-600"
                        }
                      >
                        ₹{student.dueAmount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-blue-600 font-medium">
                        ₹{student.extraPaid || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          student.status === "active" ? "default" : "secondary"
                        }
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {student.lastPaymentAmount ? (
                        <div className="text-sm">
                          ₹{student.lastPaymentAmount} 
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No payments</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student);
                          setPayDialogOpen(true);
                        }}
                        disabled={student.status === "inactive"}
                      >
                        Pay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No students found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        student={selectedStudent}
        open={payDialogOpen}
        onOpenChange={(open) => {
          setPayDialogOpen(open);
          if (!open) setSelectedStudent(null);
        }}
        onPaymentSuccess={fetchStudents}
      />
    </DashboardLayout>
  );
}