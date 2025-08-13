import { type NextRequest, NextResponse } from "next/server"

// This would be imported from the main students route in a real app
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
]

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const studentIndex = mockStudents.findIndex((student) => student.id === id)

    if (studentIndex === -1) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    mockStudents.splice(studentIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}
