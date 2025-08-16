"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

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
  paymentStatus?: "completed" | "pending";
}

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const fetchStudent = async () => {
    try {
      const res = await fetch(`https://navkar-service-2.onrender.com/api/students/${params.id}`);
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
      const res = await fetch(`https://navkar-service-2.onrender.com/api/students/${params.id}`, {
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

  if (!student) return <div className="p-6 text-center">Loading...</div>;

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
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                (student.dueAmount <= 0 || student.paymentStatus === "completed") 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"
              }`}
              >
                {(student.dueAmount <= 0 || student.paymentStatus === "completed") ? "Completed" : "Pending"}
              </span>
            } 
          />
        </div>
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
      newForm.paymentStatus = newDueAmount <= 0 ? 'completed' : 'pending';
      newForm.totalDue = newDueAmount;
    }
    
    // When due amount changes, adjust extra paid
    if (key === 'dueAmount') {
      const newDueAmount = Number(value);
      const newExtraPaid = form.monthlyFee - newDueAmount;
      
      newForm.extraPaid = Math.max(0, newExtraPaid);
      newForm.paymentStatus = newDueAmount <= 0 ? 'completed' : 'pending';
      newForm.totalDue = newDueAmount;
    }
    
    // When extra paid changes, recalculate due amount
    if (key === 'extraPaid') {
      const newExtraPaid = Number(value);
      const newDueAmount = Math.max(0, form.monthlyFee - newExtraPaid);
      
      newForm.dueAmount = newDueAmount;
      newForm.paymentStatus = newDueAmount <= 0 ? 'completed' : 'pending';
      newForm.totalDue = newDueAmount;
    }
    
    setForm(newForm);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://navkar-service-2.onrender.com/api/students/${student._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
              onChange={(e) => handleChange('paymentStatus', e.target.value as "completed" | "pending")}
              className="w-full border rounded-md p-2"
            >
              <option value="pending">Pending</option>
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
      const res = await fetch(`https://navkar-service-2.onrender.com/api/payments/${student._id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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