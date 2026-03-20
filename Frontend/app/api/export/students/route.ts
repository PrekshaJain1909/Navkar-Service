import { NextResponse } from "next/server"

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
    status: "active",
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
    status: "active",
    totalDue: 2200,
  },
]

export async function GET() {
  try {
    // Create CSV content
    const headers = [
      "ID",
      "Name",
      "Class",
      "School",
      "Pickup Location",
      "Drop Location",
      "Contact",
      "Monthly Fee",
      "Status",
      "Total Due",
    ]
    const csvContent = [
      headers.join(","),
      ...mockStudents.map((student) =>
        [
          student.id,
          `"${student.name}"`,
          `"${student.class}"`,
          `"${student.schoolName}"`,
          `"${student.pickupLocation}"`,
          `"${student.dropLocation}"`,
          student.contactInfo,
          student.monthlyFee,
          student.status,
          student.totalDue,
        ].join(","),
      ),
    ].join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="students-data.csv"',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
