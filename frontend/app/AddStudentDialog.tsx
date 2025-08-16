"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudentFormData {
  name: string;
  class: string;
  schoolName: string;
  pickupLocation: string;
  dropLocation: string;
  contactInfo: string;
  monthlyFee: string;
  fathersName: string;
  mothersName: string;
  gender: string;
  dob: string;
  address: string;
  dateOfJoining: string;
  fathersContactNumber: string;
  extraPaid: string;
}

export default function AddStudentDialog({
  onStudentAdded,
}: {
  onStudentAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    name: "",
    class: "",
    schoolName: "",
    pickupLocation: "",
    dropLocation: "",
    contactInfo: "",
    monthlyFee: "",
    fathersName: "",
    mothersName: "",
    gender: "",
    dob: "",
    address: "",
    dateOfJoining: "",
    fathersContactNumber: "",
    extraPaid: "0", // Default to 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<StudentFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<StudentFormData> = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.class.trim()) newErrors.class = "Class is required";
    if (!formData.schoolName.trim()) newErrors.schoolName = "School name is required";
    if (!formData.contactInfo.trim()) newErrors.contactInfo = "Contact info is required";
    if (!formData.monthlyFee.trim() || isNaN(Number(formData.monthlyFee))) 
      newErrors.monthlyFee = "Valid monthly fee is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name as keyof StudentFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name as keyof StudentFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        name: formData.name,
        class: formData.class,
        schoolName: formData.schoolName,
        pickupLocation: formData.pickupLocation,
        dropLocation: formData.dropLocation,
        contactInfo: formData.contactInfo,
        monthlyFee: Number(formData.monthlyFee),
        fathersName: formData.fathersName,
        mothersName: formData.mothersName,
        gender: formData.gender,
        dob: formData.dob || null,
        address: formData.address,
        dateOfJoining: formData.dateOfJoining || null,
        fathersContactNumber: formData.fathersContactNumber,
        extraPaid: Number(formData.extraPaid) || 0,
      };

      const response = await fetch("https://navkar-service-2.onrender.com/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add student");
      }

      toast({
        title: "Success",
        description: "Student added successfully",
      });

      onStudentAdded();
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding student:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add student",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      class: "",
      schoolName: "",
      pickupLocation: "",
      dropLocation: "",
      contactInfo: "",
      monthlyFee: "",
      fathersName: "",
      mothersName: "",
      gender: "",
      dob: "",
      address: "",
      dateOfJoining: "",
      fathersContactNumber: "",
      extraPaid: "0",
    });
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gray-700 hover:bg-gray-800 text-white shadow">
          ➕ Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Add New Student
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {/* Required Fields */}
          <div>
            <Label className="text-gray-700">Name*</Label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className={`bg-white ${errors.name ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <Label className="text-gray-700">Class*</Label>
            <Input
              name="class"
              value={formData.class}
              onChange={handleChange}
              placeholder="Class"
              className={`bg-white ${errors.class ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.class && <p className="text-red-500 text-xs mt-1">{errors.class}</p>}
          </div>
          
          <div>
            <Label className="text-gray-700">School Name*</Label>
            <Input
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              placeholder="School Name"
              className={`bg-white ${errors.schoolName ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.schoolName && <p className="text-red-500 text-xs mt-1">{errors.schoolName}</p>}
          </div>
          
          <div>
            <Label className="text-gray-700">Contact Info*</Label>
            <Input
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleChange}
              placeholder="Contact Number"
              className={`bg-white ${errors.contactInfo ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.contactInfo && <p className="text-red-500 text-xs mt-1">{errors.contactInfo}</p>}
          </div>
          
          <div>
            <Label className="text-gray-700">Monthly Fee (₹)*</Label>
            <Input
              name="monthlyFee"
              type="number"
              value={formData.monthlyFee}
              onChange={handleChange}
              placeholder="₹"
              className={`bg-white ${errors.monthlyFee ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.monthlyFee && <p className="text-red-500 text-xs mt-1">{errors.monthlyFee}</p>}
          </div>

          {/* Optional Fields */}
          <div>
            <Label className="text-gray-700">Pickup Location</Label>
            <Input
              name="pickupLocation"
              value={formData.pickupLocation}
              onChange={handleChange}
              placeholder="Pickup Location"
              className="bg-white border-gray-300"
            />
          </div>
          
          <div>
            <Label className="text-gray-700">Drop Location</Label>
            <Input
              name="dropLocation"
              value={formData.dropLocation}
              onChange={handleChange}
              placeholder="Drop Location"
              className="bg-white border-gray-300"
            />
          </div>
          
          <div>
            <Label className="text-gray-700">Father's Name</Label>
            <Input
              name="fathersName"
              value={formData.fathersName}
              onChange={handleChange}
              placeholder="Father's Name"
              className="bg-white border-gray-300"
            />
          </div>
          
          <div>
            <Label className="text-gray-700">Mother's Name</Label>
            <Input
              name="mothersName"
              value={formData.mothersName}
              onChange={handleChange}
              placeholder="Mother's Name"
              className="bg-white border-gray-300"
            />
          </div>
          
          <div>
            <Label className="text-gray-700">Gender*</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleSelectChange("gender", value)}
            >
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-gray-700">Date of Birth</Label>
            <Input
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              className="bg-white border-gray-300"
            />
          </div>
          
          <div>
            <Label className="text-gray-700">Address</Label>
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              className="bg-white border-gray-300"
            />
          </div>
          
          <div>
            <Label className="text-gray-700">Date of Joining*</Label>
            <Input
              name="dateOfJoining"
              type="date"
              value={formData.dateOfJoining}
              onChange={handleChange}
              className="bg-white border-gray-300"
            />
          </div>
          
          <div>
            <Label className="text-gray-700">Father's Contact</Label>
            <Input
              name="fathersContactNumber"
              value={formData.fathersContactNumber}
              onChange={handleChange}
              placeholder="Contact Number"
              className="bg-white border-gray-300"
            />
          </div>
          
          <div>
            <Label className="text-gray-700">Extra Paid (Credit)</Label>
            <Input
              name="extraPaid"
              type="number"
              value={formData.extraPaid}
              onChange={handleChange}
              placeholder="₹"
              className="bg-white border-gray-300"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded shadow"
          >
            {isSubmitting ? "Saving..." : "Save Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}