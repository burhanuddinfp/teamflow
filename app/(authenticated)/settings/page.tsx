"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { getSettings, updateSettings } from "@/lib/settings";

export default function SettingsPage() {
  const { user, profile } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [lateCutoffHour, setLateCutoffHour] = useState(10);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const settings = await getSettings();
      setLateCutoffHour(settings.lateCutoffHour);
      setSettingsLoaded(true);
    };
    load();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (!user || !user.email) return;

    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError("Current password is incorrect, or something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMessage("");
    try {
      await updateSettings({ lateCutoffHour });
      setSettingsMessage("Settings saved.");
    } catch (err) {
      console.error(err);
      setSettingsMessage("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Settings</h1>
          <p>Manage your account.</p>
        </div>
      </header>

      <div className="panel" style={{ maxWidth: 480 }}>
        <div className="panel-header">
          <div>
            <h2>Account Info</h2>
          </div>
        </div>
        <div style={{ padding: "0 24px 20px" }}>
          <p style={{ marginBottom: 8 }}><strong>Name:</strong> {profile?.name}</p>
          <p style={{ marginBottom: 8 }}><strong>Email:</strong> {user?.email}</p>
          <p style={{ marginBottom: 8 }}><strong>Role:</strong> {profile?.role}</p>
          <p><strong>Position:</strong> {profile?.position}</p>
        </div>
      </div>

      {profile?.role === "admin" && settingsLoaded && (
        <div className="panel" style={{ maxWidth: 480, marginTop: 20 }}>
          <div className="panel-header">
            <div>
              <h2>Attendance Settings</h2>
            </div>
          </div>
          <div style={{ padding: "0 24px 24px" }}>
            {settingsMessage && (
              <div style={{ background: "#e7f7ee", color: "#1a7f4b", padding: "10px 13px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                {settingsMessage}
              </div>
            )}

            <label>Late Cutoff Time</label>
            <select
              value={lateCutoffHour}
              onChange={(e) => setLateCutoffHour(Number(e.target.value))}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e1e6", borderRadius: 8, marginBottom: 14 }}
            >
              {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                <option key={h} value={h}>
                  {h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`}
                </option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: "#777d89", marginBottom: 16 }}>
              Employees clocking in at or after this time will be marked "Late."
            </p>

            <button className="btn-primary" onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      <div className="panel" style={{ maxWidth: 480, marginTop: 20 }}>
        <div className="panel-header">
          <div>
            <h2>Change Password</h2>
          </div>
        </div>
        <form onSubmit={handleChangePassword} style={{ padding: "0 24px 24px" }}>
          {error && <div className="login-error">{error}</div>}
          {message && (
            <div style={{ background: "#e7f7ee", color: "#1a7f4b", padding: "10px 13px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
              {message}
            </div>
          )}

          <label>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e1e6", borderRadius: 8, marginBottom: 14 }}
          />

          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e1e6", borderRadius: 8, marginBottom: 14 }}
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e1e6", borderRadius: 8, marginBottom: 18 }}
          />

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </>
  );
}