"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast"; // Added for notifications
import { Loader2 } from "lucide-react"; // Better loading spinner

type PaymentStatus = "Pending" | "Paid" | "Partial";
type MonthStatus = PaymentStatus | "Future";

interface Student {
  id: string;
  name: string;
  dateOfJoining: string;
  payments: MonthStatus[];
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PaymentTracker() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentMonthIndex = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const APRIL_INDEX = 3;

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        toast.loading("Loading students...");

        const res = await fetch("http://localhost:5000/api/students");
        if (!res.ok) throw new Error("Failed to fetch students");
        const data = await res.json();

        const studentsWithPayments: Student[] = data.map((student: any) => {
          const payments: MonthStatus[] = Array(12).fill("Future");
          for (let month = APRIL_INDEX; month <= currentMonthIndex; month++) {
            payments[month] = "Pending";
          }
          return {
            id: student._id,
            name: student.name,
            dateOfJoining: student.dateOfJoining,
            payments
          };
        });

        setStudents(studentsWithPayments);
        toast.success("Students loaded successfully");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load data";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        toast.dismiss();
        setLoading(false);
      }
    };

    fetchStudents();
  }, [currentMonthIndex]);

  const getColor = (status: MonthStatus) => {
    switch (status) {
      case "Paid":
        return "bg-green-500 text-white hover:bg-green-600";
      case "Pending":
        return "bg-red-500 text-white hover:bg-red-600";
      case "Partial":
        return "bg-yellow-400 text-gray-900 hover:bg-yellow-500";
      case "Future":
        return "bg-gray-200 text-gray-500";
      default:
        return "";
    }
  };

  const cycleStatus = (current: PaymentStatus): PaymentStatus => {
    const order: PaymentStatus[] = ["Pending", "Paid", "Partial"];
    return order[(order.indexOf(current) + 1) % order.length];
  };

  const handleCellClick = async (studentId: string, monthIndex: number) => {
    if (monthIndex > currentMonthIndex) return;

    try {
      // Optimistic update
      setStudents(prev =>
        prev.map(student =>
          student.id === studentId
            ? {
                ...student,
                payments: student.payments.map((status, idx) =>
                  idx === monthIndex ? cycleStatus(status as PaymentStatus) : status
                ),
              }
            : student
        )
      );

      // Here you would typically update the backend
      // await updatePaymentStatus(studentId, monthIndex, newStatus);
      toast.success("Payment status updated");
    } catch (err) {
      toast.error("Failed to update payment status");
      // Revert optimistic update on error
      setStudents(prev => [...prev]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="bg-gray-200 border border-gray-400 text-gray-800 px-4 py-3 rounded-lg shadow">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gradient-to-b from-gray-100 via-gray-50 to-gray-200">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
        📅 Student Payment Tracker - {currentYear}
      </h1>

      <div className="overflow-x-auto bg-gray-50 border border-gray-300 rounded-2xl shadow-lg p-6">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-gray-700 text-gray-100 shadow">
              <th className="px-4 py-3 text-left rounded-tl-xl">Student Name</th>
              {months.map((month, idx) => (
                <th
                  key={month}
                  className={`px-4 py-3 text-center font-medium ${
                    idx === months.length - 1 ? "rounded-tr-xl" : ""
                  }`}
                >
                  {month}
                  {idx === currentMonthIndex && (
                    <span className="block text-xs opacity-80">(Current)</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student, rowIndex) => (
              <tr key={student.id} className="hover:bg-gray-100 transition">
                <td className="px-4 py-3 font-medium text-gray-800 bg-white rounded-l-xl shadow-sm">
                  {student.name}
                </td>
                {student.payments.map((status, idx) => (
                  <td
                    key={idx}
                    onClick={() => handleCellClick(student.id, idx)}
                    className={`px-4 py-3 text-center ${
                      status !== "Future"
                        ? "cursor-pointer hover:scale-105 transition-transform"
                        : "cursor-not-allowed"
                    }`}
                  >
                    <span
                      className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getColor(
                        status
                      )}`}
                    >
                      {status === "Future" ? "..." : status}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-gray-600 text-center">
        <p>Click on a month to toggle: <span className="font-semibold">Pending → Paid → Partial</span></p>
        <p>Future months are locked and shown as "..."</p>
      </div>
    </div>
  );
}