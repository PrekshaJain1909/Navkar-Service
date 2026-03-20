import { NextResponse } from "next/server"

// Mock data - in a real app, this would come from your database
const mockStats = {
  totalStudents: 156,
  totalFeesCollected: 234500,
  pendingDues: 45600,
  thisMonthCollection: 67800,
}

const mockRecentPayments = [
  {
    id: "1",
    studentName: "Rahul Sharma",
    amount: 2500,
    date: "2024-01-15",
    mode: "UPI",
  },
  {
    id: "2",
    studentName: "Priya Patel",
    amount: 2200,
    date: "2024-01-14",
    mode: "Cash",
  },
  {
    id: "3",
    studentName: "Amit Kumar",
    amount: 2800,
    date: "2024-01-13",
    mode: "Bank Transfer",
  },
  {
    id: "4",
    studentName: "Sneha Gupta",
    amount: 2300,
    date: "2024-01-12",
    mode: "UPI",
  },
  {
    id: "5",
    studentName: "Vikash Singh",
    amount: 2600,
    date: "2024-01-11",
    mode: "Cash",
  },
]

export async function GET() {
  try {
    return NextResponse.json({
      stats: mockStats,
      recentPayments: mockRecentPayments,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
