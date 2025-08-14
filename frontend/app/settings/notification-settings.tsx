"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Mail, MessageSquare } from "lucide-react";

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: false,
    smsNotifications: false,
    whatsappNotifications: false,
    reminderDays: 5,
    emailTemplate: "",
    smsTemplate: "",
    whatsappTemplate: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from backend
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings"); // or `/settings` if calling Express directly
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      alert(data.message || "Notification settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Call test notification API
  const testNotification = async (type: "email" | "sms" | "whatsapp") => {
    try {
      const res = await fetch(`/api/settings/test-${type}`, { method: "POST" });
      const data = await res.json();
      alert(data.message || `Test ${type} sent successfully!`);
    } catch {
      alert(`Failed to send test ${type}`);
    }
  };

  if (loading) return <p>Loading settings...</p>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Configure how and when to send payment reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notification */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Send payment reminders via email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings((p) => ({ ...p, emailNotifications: checked }))}
            />
          </div>
          {/* SMS Notification */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Send payment reminders via SMS</p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => setSettings((p) => ({ ...p, smsNotifications: checked }))}
            />
          </div>
          {/* WhatsApp Notification */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">WhatsApp Notifications</Label>
              <p className="text-sm text-muted-foreground">Send payment reminders via WhatsApp</p>
            </div>
            <Switch
              checked={settings.whatsappNotifications}
              onCheckedChange={(checked) => setSettings((p) => ({ ...p, whatsappNotifications: checked }))}
            />
          </div>
          {/* Reminder Days */}
          <div className="space-y-2">
            <Label htmlFor="reminderDays">Reminder Days Before Due Date</Label>
            <Input
              id="reminderDays"
              type="number"
              value={settings.reminderDays}
              onChange={(e) => setSettings((p) => ({ ...p, reminderDays: Number(e.target.value) }))}
              className="max-w-xs"
            />
          </div>

          {/* Test Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => testNotification("email")} disabled={!settings.emailNotifications}>
              <Mail className="w-4 h-4 mr-2" /> Test Email
            </Button>
            <Button variant="outline" onClick={() => testNotification("sms")} disabled={!settings.smsNotifications}>
              <MessageSquare className="w-4 h-4 mr-2" /> Test SMS
            </Button>
            <Button
              variant="outline"
              onClick={() => testNotification("whatsapp")}
              disabled={!settings.whatsappNotifications}
            >
              <span>🟢</span> Test WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Message Templates</CardTitle>
          <CardDescription>Customize notification message templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailTemplate">Email Template</Label>
            <Textarea
              id="emailTemplate"
              value={settings.emailTemplate}
              onChange={(e) => setSettings((p) => ({ ...p, emailTemplate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smsTemplate">SMS Template</Label>
            <Textarea
              id="smsTemplate"
              value={settings.smsTemplate}
              onChange={(e) => setSettings((p) => ({ ...p, smsTemplate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappTemplate">WhatsApp Template</Label>
            <Textarea
              id="whatsappTemplate"
              value={settings.whatsappTemplate}
              onChange={(e) => setSettings((p) => ({ ...p, whatsappTemplate: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Notification Settings"}
        </Button>
      </div>
    </>
  );
}
