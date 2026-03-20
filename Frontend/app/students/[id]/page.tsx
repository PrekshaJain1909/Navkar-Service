"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { authFetch } from "@/lib/auth";

interface Student {
  _id: string;
  name: string;
  class: string;
  schoolName: string;
  pickupLocation: string;
  dropLocation: string;
  contactInfo: string;
  fathersName?: string;
  mothersName?: string;
  fathersContactNumber?: string;
  gender?: string;
  dob?: string;
  address?: string;
  dateOfJoining?: string;
  status: string;
  monthlyFee: number;
  totalCollected?: number;
  dueAmount: number;
  totalDue?: number;
  extraPaid?: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: string;
  lastPaymentMode?: string;
  lastPaymentPeriod?: string;
  paymentStatus?: "completed" | "partial" | "pending";
  paymentsReceived?: PaymentRecord[];
}

interface PaymentRecord {
  _id?: string;
  amount?: number;
  date?: string;
  mode?: string;
  period?: string;
  extraPaid?: number;
}

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const getStatusMeta = (s: Student) => {
    if (s.dueAmount <= 0 || s.paymentStatus === "completed") {
      return {
        label: "Completed",
        className: "bg-green-100 text-green-800",
      };
    }

    if (
      s.paymentStatus === "partial" ||
      (s.totalCollected || 0) > 0 ||
      (s.paymentsReceived?.length || 0) > 0
    ) {
      return {
        label: "Partial Paid",
        className: "bg-amber-100 text-amber-800",
      };
    }

    return {
      label: "Pending",
      className: "bg-red-100 text-red-800",
    };
  };

  const paymentHistory = [...(student?.paymentsReceived || [])].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const fetchStudent = async () => {
    try {
      const res = await authFetch(`/api/students/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch student");
      const data = await res.json();
      setStudent(data);
    } catch (error) {
      Swal.fire("Error", "Failed to load student data", "error");
      router.back();
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: `Delete ${student?.name}?`,
      text: "This cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await authFetch(`/api/students/${params.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      Swal.fire("Deleted!", `${student?.name} has been deleted.`, "success");
      router.back();
    } catch (error) {
      Swal.fire("Error", "Failed to delete student", "error");
    }
  };

  useEffect(() => {
    fetchStudent();
  }, []);

  const formatPaymentDate = (rawDate?: string) => {
    if (!rawDate) return "-";
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const csvSafe = (value: string | number) => {
    const text = String(value ?? "").replace(/"/g, '""');
    return `"${text}"`;
  };

  const handleDownloadPayments = () => {
    if (!student || paymentHistory.length === 0) {
      Swal.fire("No Payments", "No payment records found for this student.", "info");
      return;
    }

    const header = ["Sr No", "Date", "Amount", "Mode", "Period", "Extra Paid"];
    const rows = paymentHistory.map((payment, index) => [
      index + 1,
      formatPaymentDate(payment.date),
      Number(payment.amount || 0).toFixed(2),
      payment.mode || "Cash",
      payment.period || "-",
      Number(payment.extraPaid || 0).toFixed(2),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => csvSafe(value)).join(","))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${student.name.replace(/\s+/g, "-").toLowerCase()}-payments.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  if (!student) return <div className="p-6 text-center">Loading...</div>;

  const paymentStatusMeta = getStatusMeta(student);

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{student.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => router.back()} className="rounded-full px-5">
            ← Back
          </Button>
          <Button variant="secondary" onClick={() => setEditOpen(true)} className="rounded-full px-5">
            ✏️ Edit
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-5" 
            onClick={() => setPayOpen(true)}
          >
            💰 Pay
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white rounded-full px-5" 
            onClick={handleDelete}
          >
            🗑 Delete
          </Button>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <InfoField label="Class" value={student.class} />
          <InfoField label="School" value={student.schoolName} />
          <InfoField label="Pickup Location" value={student.pickupLocation} />
          <InfoField label="Drop Location" value={student.dropLocation} />
          <InfoField label="Contact" value={student.contactInfo} />
          <InfoField label="Father's Name" value={student.fathersName} />
          <InfoField label="Mother's Name" value={student.mothersName} />
          <InfoField label="Father's Contact" value={student.fathersContactNumber} />
          <InfoField label="Gender" value={student.gender} />
          <InfoField label="DOB" value={student.dob} />
          <InfoField label="Address" value={student.address} />
          <InfoField label="Joining Date" value={student.dateOfJoining} />
          <InfoField label="Status" value={student.status} />
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">Payment Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <InfoField label="Monthly Fee" value={`₹${student.monthlyFee}`} />
          <InfoField label="Due Amount" value={`₹${student.dueAmount || student.totalDue || 0}`} />
          <InfoField label="Total Collected" value={`₹${student.totalCollected || 0}`} />
          <InfoField label="Extra Paid" value={`₹${student.extraPaid || 0}`} />
          <InfoField label="Last Payment Amount" value={`₹${student.lastPaymentAmount || 0}`} />
          <InfoField label="Last Payment Date" value={student.lastPaymentDate} />
          <InfoField label="Last Payment Mode" value={student.lastPaymentMode} />
          <InfoField label="Last Payment Period" value={student.lastPaymentPeriod} />
          <InfoField 
            label="Payment Status" 
            value={
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusMeta.className}`}>
                {paymentStatusMeta.label}
              </span>
            } 
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mt-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-2 border-b">
          <h2 className="text-xl font-semibold text-gray-700">Payment History</h2>
          <Button
            variant="secondary"
            onClick={handleDownloadPayments}
            className="rounded-full px-5"
          >
            Download CSV
          </Button>
        </div>

        {paymentHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No payment records available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 border-b">#</th>
                  <th className="text-left p-3 border-b">Date</th>
                  <th className="text-left p-3 border-b">Amount</th>
                  <th className="text-left p-3 border-b">Mode</th>
                  <th className="text-left p-3 border-b">Period</th>
                  <th className="text-left p-3 border-b">Extra Paid</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment, index) => (
                  <tr key={payment._id || `${payment.date}-${index}`} className="hover:bg-gray-50">
                    <td className="p-3 border-b">{index + 1}</td>
                    <td className="p-3 border-b">{formatPaymentDate(payment.date)}</td>
                    <td className="p-3 border-b">₹{Number(payment.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="p-3 border-b">{payment.mode || "Cash"}</td>
                    <td className="p-3 border-b">{payment.period || "-"}</td>
                    <td className="p-3 border-b">₹{Number(payment.extraPaid || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EditStudentDialog 
        student={student} 
        open={editOpen} 
        onOpenChange={setEditOpen} 
        onStudentUpdated={fetchStudent} 
      />
      <PaymentDialog 
        student={student} 
        open={payOpen} 
        onOpenChange={setPayOpen} 
        onPaymentSuccess={fetchStudent} 
      />
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | number | React.ReactNode }) {
  const isDateField = label.toLowerCase().includes("date") || label.toLowerCase() === "dob";
  let displayValue = value || "-";

  if (isDateField && typeof value === "string" && value.trim() !== "") {
    const dateObj = new Date(value);
    if (!isNaN(dateObj.getTime())) {
      displayValue = dateObj.toLocaleDateString();
    }
  }

  return (
    <div className="bg-gray-50 hover:bg-gray-100 transition rounded-lg p-3 border border-gray-200">
      <p className="text-xs uppercase font-medium text-gray-500 mb-1">{label}</p>
      <div className="text-sm font-semibold text-gray-800">
        {typeof displayValue === 'string' || typeof displayValue === 'number' ? displayValue : value}
      </div>
    </div>
  );
}

function EditStudentDialog({
  student,
  open,
  onOpenChange,
  onStudentUpdated,
}: {
  student: Student;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onStudentUpdated: () => Promise<void>;
}) {
  const [form, setForm] = useState<Student>({ ...student });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({ ...student });
  }, [student]);

  const handleChange = (key: keyof Student, value: string | number) => {
    const newForm = { ...form, [key]: value };
    
    // When monthly fee changes, recalculate due amount and extra paid
    if (key === 'monthlyFee') {
      const newMonthlyFee = Number(value);
      const newDueAmount = Math.max(0, newMonthlyFee - (form.extraPaid || 0));
      
      newForm.dueAmount = newDueAmount;
      if (newDueAmount <= 0) {
        newForm.paymentStatus = "completed";
      } else if ((form.totalCollected || 0) > 0 || (form.paymentsReceived?.length || 0) > 0) {
        newForm.paymentStatus = "partial";
      } else {
        newForm.paymentStatus = "pending";
      }
      newForm.totalDue = newDueAmount;
    }
    
    // When due amount changes, adjust extra paid
    if (key === 'dueAmount') {
      const newDueAmount = Number(value);
      const newExtraPaid = form.monthlyFee - newDueAmount;
      
      newForm.extraPaid = Math.max(0, newExtraPaid);
      if (newDueAmount <= 0) {
        newForm.paymentStatus = "completed";
      } else if ((form.totalCollected || 0) > 0 || (form.paymentsReceived?.length || 0) > 0) {
        newForm.paymentStatus = "partial";
      } else {
        newForm.paymentStatus = "pending";
      }
      newForm.totalDue = newDueAmount;
    }
    
    // When extra paid changes, recalculate due amount
    if (key === 'extraPaid') {
      const newExtraPaid = Number(value);
      const newDueAmount = Math.max(0, form.monthlyFee - newExtraPaid);
      
      newForm.dueAmount = newDueAmount;
      if (newDueAmount <= 0) {
        newForm.paymentStatus = "completed";
      } else if ((form.totalCollected || 0) > 0 || (form.paymentsReceived?.length || 0) > 0) {
        newForm.paymentStatus = "partial";
      } else {
        newForm.paymentStatus = "pending";
      }
      newForm.totalDue = newDueAmount;
    }
    
    setForm(newForm);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/students/${student._id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          dueAmount: form.dueAmount,
          paymentStatus: form.paymentStatus || 'pending',
          totalDue: form.dueAmount
        }),
      });
      
      if (!res.ok) throw new Error("Update failed");
      
      Swal.fire("Updated!", "Student details have been updated.", "success");
      onOpenChange(false);
      await onStudentUpdated();
    } catch (error) {
      Swal.fire("Error", "Failed to update student details.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">Edit Student</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {/* Personal Info Fields */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Class</Label>
            <Input value={form.class} onChange={(e) => handleChange('class', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>School</Label>
            <Input value={form.schoolName} onChange={(e) => handleChange('schoolName', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Pickup Location</Label>
            <Input value={form.pickupLocation} onChange={(e) => handleChange('pickupLocation', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Drop Location</Label>
            <Input value={form.dropLocation} onChange={(e) => handleChange('dropLocation', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Contact</Label>
            <Input value={form.contactInfo} onChange={(e) => handleChange('contactInfo', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Father's Name</Label>
            <Input value={form.fathersName || ''} onChange={(e) => handleChange('fathersName', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Mother's Name</Label>
            <Input value={form.mothersName || ''} onChange={(e) => handleChange('mothersName', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Father's Contact</Label>
            <Input value={form.fathersContactNumber || ''} onChange={(e) => handleChange('fathersContactNumber', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Gender</Label>
            <Input value={form.gender || ''} onChange={(e) => handleChange('gender', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>DOB</Label>
            <Input type="date" value={form.dob || ''} onChange={(e) => handleChange('dob', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={form.address || ''} onChange={(e) => handleChange('address', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Joining Date</Label>
            <Input type="date" value={form.dateOfJoining || ''} onChange={(e) => handleChange('dateOfJoining', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full border rounded-md p-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Payment Info Fields */}
          <div className="space-y-2">
            <Label>Monthly Fee (₹)</Label>
            <Input 
              type="number" 
              value={form.monthlyFee} 
              onChange={(e) => handleChange('monthlyFee', Number(e.target.value))} 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Due Amount (₹)</Label>
            <Input 
              type="number" 
              value={form.dueAmount} 
              onChange={(e) => handleChange('dueAmount', Number(e.target.value))} 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Extra Paid (₹)</Label>
            <Input 
              type="number" 
              value={form.extraPaid || 0} 
              onChange={(e) => handleChange('extraPaid', Number(e.target.value))} 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Payment Status</Label>
            <select
              value={form.paymentStatus || 'pending'}
              onChange={(e) => handleChange('paymentStatus', e.target.value as "completed" | "partial" | "pending")}
              className="w-full border rounded-md p-2"
            >
              <option value="pending">Pending</option>
              <option value="partial">Partial Paid</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  student,
  open,
  onOpenChange,
  onPaymentSuccess,
}: {
  student: Student;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPaymentSuccess: () => Promise<void>;
}) {
  const [amount, setAmount] = useState<string>(student.dueAmount?.toString() || "0");
  const [mode, setMode] = useState<string>(student.lastPaymentMode || "Cash");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!amount || Number(amount) <= 0) {
      Swal.fire("Error", "Please enter a valid payment amount", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(`/api/payments/${student._id}/pay`, {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
          mode,
          date: new Date().toISOString()
        }),
      });

      if (!res.ok) throw new Error("Payment failed");

      Swal.fire("Success", "Payment recorded successfully", "success");
      onOpenChange(false);
      await onPaymentSuccess();
    } catch (error) {
      Swal.fire("Error", "Failed to record payment", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Current due: ₹{student.dueAmount || student.totalDue || 0}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full border rounded-md p-2"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={loading}>
            {loading ? "Processing..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}