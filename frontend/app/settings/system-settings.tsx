"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database, Shield } from "lucide-react"

export default function SystemSettings() {
  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    backupFrequency: "daily",
  })

  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleSystemSave = () => {
    alert("System settings saved successfully!")
  }

  const handleSecuritySave = () => {
    alert("Security settings updated successfully!")
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            System Configuration
          </CardTitle>
          <CardDescription>Database backup and system maintenance settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Automatic Backup</Label>
              <p className="text-sm text-muted-foreground">Automatically backup data at regular intervals</p>
            </div>
            <Switch
              checked={systemSettings.autoBackup}
              onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, autoBackup: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backupFrequency">Backup Frequency</Label>
            <Select
              value={systemSettings.backupFrequency}
              onValueChange={(value) => setSystemSettings((prev) => ({ ...prev, backupFrequency: value }))}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">Create Backup Now</Button>
            <Button variant="outline">Restore from Backup</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Settings
          </CardTitle>
          <CardDescription>Manage login credentials and security preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Enter current password"
              value={securitySettings.currentPassword}
              onChange={(e) =>
                setSecuritySettings((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={securitySettings.newPassword}
              onChange={(e) => setSecuritySettings((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={securitySettings.confirmPassword}
              onChange={(e) =>
                setSecuritySettings((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
            />
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Session Management</h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Last login: January 15, 2024 at 10:30 AM</p>
              <Button variant="outline" size="sm">
                Log out all devices
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleSystemSave}>
          Save System Settings
        </Button>
        <Button onClick={handleSecuritySave}>Update Security Settings</Button>
      </div>
    </>
  )
}