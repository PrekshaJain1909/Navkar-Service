import { type NextRequest, NextResponse } from "next/server"

// Mock data - in a real app, this would come from your database
const mockPayments = [
  {
    id: "1",
    studentId: "1",
    studentName: "Rahul Sharma",
    amount: 2500,
    date: "2024-01-15",
    mode: "UPI" as const,
    month: "January",
    year: 2024,
    status: "completed" as const,
  },
  {
    id: "2",
    studentId: "2",
    studentName: "Priya Patel",
    amount: 2200,
    date: "2024-01-14",
    mode: "Cash" as const,
    month: "December",
    year: 2023,
    status: "completed" as const,
  },
  {
    id: "3",
    studentId: "3",
    studentName: "Amit Kumar",
    amount: 2800,
    date: "2024-01-13",
    mode: "Bank Transfer" as const,
    month: "January",
    year: 2024,
    status: "completed" as const,
  },
  {
    id: "4",
    studentId: "4",
    studentName: "Sneha Gupta",
    amount: 2300,
    date: "2024-01-12",
    mode: "UPI" as const,
    month: "December",
    year: 2023,
    status: "completed" as const,
  },
  {
    id: "5",
    studentId: "5",
    studentName: "Vikash Singh",
    amount: 2600,
    date: "2024-01-11",
    mode: "Cash" as const,
    month: "January",
    year: 2024,
    status: "completed" as const,
  },
]

const mockStudents = [
  { id: "1", name: "Rahul Sharma", monthlyFee: 2500 },
  { id: "2", name: "Priya Patel", monthlyFee: 2200 },
  { id: "3", name: "Amit Kumar", monthlyFee: 2800 },
  { id: "4", name: "Sneha Gupta", monthlyFee: 2300 },
  { id: "5", name: "Vikash Singh", monthlyFee: 2600 },
]

export async function GET() {
  try {
    return NextResponse.json(mockPayments)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json()
    const student = mockStudents.find((s) => s.id === paymentData.studentId)

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const newPayment = {
      id: (mockPayments.length + 1).toString(),
      studentName: student.name,
      status: "completed" as const,
      ...paymentData,
    }

    mockPayments.push(newPayment)

    return NextResponse.json(newPayment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to add payment" }, { status: 500 })
  }
}
