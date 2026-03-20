"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Loader2, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { authFetch, getApiMessage } from "@/lib/auth";

type MonthStatus = "Pending" | "Paid" | "Partial" | "Future" | "NA";

interface PaymentRecord {
  amount?: number;
  date?: string;
  period?: string;
}

interface StudentApi {
  _id: string;
  name: string;
  dateOfJoining?: string;
  monthlyFee?: number;
  paymentsReceived?: PaymentRecord[];
}

interface Student {
  id: string;
  name: string;
  monthlyTotals: number[];
  payments: MonthStatus[];
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PaymentTracker() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentMonthIndex = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const parsePeriod = (period?: string): { monthIndex: number; year: number } | null => {
    if (!period) return null;
    const match = period.trim().match(/^(\d{1,2})\s*[-\/]\s*(\d{4})$/);
    if (!match) return null;

    const month = Number(match[1]);
    const year = Number(match[2]);
    if (!Number.isInteger(month) || month < 1 || month > 12) return null;

    return { monthIndex: month - 1, year };
  };

  const resolvePaymentMonth = (payment: PaymentRecord): { monthIndex: number; year: number } | null => {
    const fromPeriod = parsePeriod(payment.period);
    if (fromPeriod) return fromPeriod;

    if (!payment.date) return null;
    const date = new Date(payment.date);
    if (Number.isNaN(date.getTime())) return null;

    return {
      monthIndex: date.getMonth(),
      year: date.getFullYear(),
    };
  };

  const buildMonthlyStatus = (student: StudentApi): Student => {
    const monthlyFee = Number(student.monthlyFee || 0);
    const monthlyTotals = Array(12).fill(0) as number[];

    (student.paymentsReceived || []).forEach((payment) => {
      const resolved = resolvePaymentMonth(payment);
      if (!resolved || resolved.year !== currentYear) return;
      monthlyTotals[resolved.monthIndex] += Number(payment.amount || 0);
    });

    const joinDate = student.dateOfJoining ? new Date(student.dateOfJoining) : null;
    const validJoinDate = joinDate && !Number.isNaN(joinDate.getTime()) ? joinDate : null;

    const payments: MonthStatus[] = months.map((_, monthIndex) => {
      if (validJoinDate) {
        const joinYear = validJoinDate.getFullYear();
        const joinMonth = validJoinDate.getMonth();

        if (joinYear > currentYear) {
          return "NA";
        }

        if (joinYear === currentYear && monthIndex < joinMonth) {
          return "NA";
        }
      }

      if (monthIndex > currentMonthIndex) return "Future";

      const paidInMonth = monthlyTotals[monthIndex];
      if (paidInMonth <= 0) return "Pending";
      if (monthlyFee > 0 && paidInMonth < monthlyFee) return "Partial";
      return "Paid";
    });

    return {
      id: student._id,
      name: student.name,
      monthlyTotals,
      payments,
    };
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await authFetch("/api/students");
      if (!res.ok) {
        const message = await getApiMessage(res, "Failed to fetch students");
        throw new Error(message);
      }

      const data: StudentApi[] = await res.json();
      const studentsWithPayments = data.map(buildMonthlyStatus);

      setStudents(studentsWithPayments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

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
      case "NA":
        return "bg-slate-300 text-slate-700";
      default:
        return "";
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

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={fetchStudents}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

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
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-100 transition">
                <td className="px-4 py-3 font-medium text-gray-800 bg-white rounded-l-xl shadow-sm">
                  <button
                    type="button"
                    onClick={() => router.push(`/students/${student.id}`)}
                    className="text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    {student.name}
                  </button>
                </td>
                {student.payments.map((status, idx) => (
                  <td
                    key={idx}
                    className={`px-4 py-3 text-center ${
                      status !== "Future"
                        ? ""
                        : "cursor-not-allowed"
                    }`}
                  >
                    <span
                      className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getColor(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                    {status !== "Future" && status !== "NA" && (
                      <div className="text-xs text-gray-500 mt-1">
                        ₹{student.monthlyTotals[idx].toLocaleString("en-IN")}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-gray-600 text-center">
        <p>Status is fully backend-driven from recorded payments.</p>
        <p>NA = before joining date, Paid = full monthly fee received, Partial = some amount received, Pending = no payment, Future = month not reached.</p>
      </div>
    </div>
  );
}