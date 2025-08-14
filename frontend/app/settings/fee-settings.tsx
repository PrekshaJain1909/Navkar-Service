"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function FeeSettings() {
  const [settings, setSettings] = useState({
    defaultFeeAmount: 2500,
    lateFeePercentage: 5,
  })

  const handleSave = () => {
    alert("Fee settings saved successfully!")
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Fee Configuration</CardTitle>
          <CardDescription>Set default fee amounts and late fee policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultFee">Default Monthly Fee (₹)</Label>
              <Input
                id="defaultFee"
                type="number"
                value={settings.defaultFeeAmount}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultFeeAmount: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lateFee">Late Fee Percentage (%)</Label>
              <Input
                id="lateFee"
                type="number"
                value={settings.lateFeePercentage}
                onChange={(e) => setSettings((prev) => ({ ...prev, lateFeePercentage: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Fee Calculation Example</h4>
            <p className="text-sm text-blue-700 mt-1">
              Monthly Fee: ₹{settings.defaultFeeAmount} | Late Fee: ₹
              {Math.round((settings.defaultFeeAmount * settings.lateFeePercentage) / 100)} | Total if Late: ₹
              {settings.defaultFeeAmount +
                Math.round((settings.defaultFeeAmount * settings.lateFeePercentage) / 100)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Fee Settings</Button>
      </div>
    </>
  )
}