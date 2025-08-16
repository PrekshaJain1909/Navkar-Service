import { type NextRequest, NextResponse } from "next/server"

// Mock data - in a real app, this would come from your database
const mockStudents = [
  {
    id: "1",
    name: "Rahul Sharma",
    class: "10th Grade",
    schoolName: "Delhi Public School",
    pickupLocation: "Sector 15, Noida",
    dropLocation: "DPS Campus",
    contactInfo: "+91-9876543210",
    monthlyFee: 2500,
    status: "active" as const,
    totalDue: 0,
  },
  {
    id: "2",
    name: "Priya Patel",
    class: "8th Grade",
    schoolName: "Ryan International",
    pickupLocation: "Indirapuram",
    dropLocation: "Ryan Campus",
    contactInfo: "+91-9876543211",
    monthlyFee: 2200,
    status: "active" as const,
    totalDue: 2200,
  },
  {
    id: "3",
    name: "Amit Kumar",
    class: "12th Grade",
    schoolName: "Modern School",
    pickupLocation: "Vasundhara",
    dropLocation: "Modern Campus",
    contactInfo: "+91-9876543212",
    monthlyFee: 2800,
    status: "active" as const,
    totalDue: 0,
  },
  {
    id: "4",
    name: "Sneha Gupta",
    class: "9th Grade",
    schoolName: "Delhi Public School",
    pickupLocation: "Sector 22, Noida",
    dropLocation: "DPS Campus",
    contactInfo: "+91-9876543213",
    monthlyFee: 2300,
    status: "active" as const,
    totalDue: 4600,
  },
  {
    id: "5",
    name: "Vikash Singh",
    class: "11th Grade",
    schoolName: "Amity International",
    pickupLocation: "Sector 44, Noida",
    dropLocation: "Amity Campus",
    contactInfo: "+91-9876543214",
    monthlyFee: 2600,
    status: "active" as const,
    totalDue: 0,
  },
]

export async function GET() {
  try {
    return NextResponse.json(mockStudents)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const studentData = await request.json()

    const newStudent = {
      id: (mockStudents.length + 1).toString(),
      ...studentData,
      status: "active" as const,
      totalDue: 0,
    }

    mockStudents.push(newStudent)

    return NextResponse.json(newStudent, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to add student" }, { status: 500 })
  }
}
