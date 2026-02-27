"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";
import { clearSession, getToken, getUser } from "../../lib/auth";
import { Demographics, Mentor, NotificationRecord, Student } from "../../lib/types";

type NotificationForm = {
  title: string;
  message: string;
  type: "announcement" | "system" | "booking" | "approval";
  targetRole: "student" | "mentor" | "admin" | "all";
};

const defaultNotification: NotificationForm = {
  title: "",
  message: "",
  type: "announcement",
  targetRole: "all"
};

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [endpointWarnings, setEndpointWarnings] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const [pendingMentors, setPendingMentors] = useState<Mentor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [notificationForm, setNotificationForm] = useState(defaultNotification);
  const [sendingNotification, setSendingNotification] = useState(false);

  useEffect(() => {
    const currentToken = getToken();
    const currentUser = getUser();

    if (!currentToken || !currentUser || currentUser.role !== "admin") {
      router.replace("/login");
      return;
    }

    setToken(currentToken);
  }, [router]);

  useEffect(() => {
    if (!token) {
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        setEndpointWarnings([]);

        const [mentorRes, studentRes, demographicRes, notificationRes] = await Promise.allSettled([
          apiRequest<Mentor[]>("/api/admin/pending-mentors", {}, token),
          apiRequest<Student[]>("/api/admin/students", {}, token),
          apiRequest<Demographics>("/api/admin/demographics", {}, token),
          apiRequest<NotificationRecord[]>("/api/admin/notifications", {}, token)
        ]);

        const warnings: string[] = [];

        if (mentorRes.status === "fulfilled") {
          setPendingMentors(mentorRes.value);
        } else {
          warnings.push(`Mentors: ${mentorRes.reason?.message || "failed to load"}`);
        }

        if (studentRes.status === "fulfilled") {
          setStudents(studentRes.value);
        } else {
          warnings.push(`Students: ${studentRes.reason?.message || "failed to load"}`);
        }

        if (demographicRes.status === "fulfilled") {
          setDemographics(demographicRes.value);
        } else {
          setDemographics(null);
          warnings.push(`Demographics: ${demographicRes.reason?.message || "failed to load"}`);
        }

        if (notificationRes.status === "fulfilled") {
          setNotifications(notificationRes.value);
        } else {
          warnings.push(`Notifications: ${notificationRes.reason?.message || "failed to load"}`);
        }

        if (warnings.length > 0) {
          setEndpointWarnings(warnings);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  async function refreshPendingMentors() {
    if (!token) return;
    const mentorData = await apiRequest<Mentor[]>("/api/admin/pending-mentors", {}, token);
    setPendingMentors(mentorData);
  }

  async function approveMentor(id: string) {
    if (!token) return;
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/admin/approve/${id}`, { method: "PUT" }, token);
      setMessage("Mentor approved.");
      await refreshPendingMentors();
    } catch (err: any) {
      setError(err.message || "Approval failed");
    }
  }

  async function sendNotification(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSendingNotification(true);
    setMessage("");
    setError("");

    try {
      await apiRequest(
        "/api/admin/notifications",
        {
          method: "POST",
          body: JSON.stringify(notificationForm)
        },
        token
      );
      setNotificationForm(defaultNotification);
      const notificationData = await apiRequest<NotificationRecord[]>("/api/admin/notifications", {}, token);
      setNotifications(notificationData);
      setMessage("Notification sent.");
    } catch (err: any) {
      setError(err.message || "Notification failed");
    } finally {
      setSendingNotification(false);
    }
  }

  function logout() {
    clearSession();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="page">
        <p>Loading admin dashboard...</p>
      </main>
    );
  }

  return (
    <main className="page grid">
      <section className="card" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>ORIN Admin Dashboard</h1>
          <p className="muted" style={{ marginBottom: 0 }}>
            Mentor approvals, students, demographics and notifications
          </p>
        </div>
        <button className="button ghost" onClick={logout}>
          Logout
        </button>
      </section>

      {error ? (
        <section className="card">
          <p style={{ margin: 0, color: "#b42318" }}>{error}</p>
        </section>
      ) : null}
      {endpointWarnings.length > 0 ? (
        <section className="card">
          {endpointWarnings.map((warn) => (
            <p key={warn} style={{ margin: "0 0 6px 0", color: "#b54708" }}>
              {warn}
            </p>
          ))}
          <p className="muted" style={{ margin: 0 }}>
            If you see route not found, redeploy the latest backend on Render.
          </p>
        </section>
      ) : null}
      {message ? (
        <section className="card">
          <p style={{ margin: 0, color: "#1f7a4c" }}>{message}</p>
        </section>
      ) : null}

      {demographics ? (
        <section className="grid kpi">
          <div className="kpi">
            <h3 style={{ margin: 0 }}>Total Users</h3>
            <p style={{ marginBottom: 0 }}>{demographics.totals.users}</p>
          </div>
          <div className="kpi">
            <h3 style={{ margin: 0 }}>Students</h3>
            <p style={{ marginBottom: 0 }}>{demographics.roles.students}</p>
          </div>
          <div className="kpi">
            <h3 style={{ margin: 0 }}>Mentors</h3>
            <p style={{ marginBottom: 0 }}>{demographics.roles.mentors}</p>
          </div>
          <div className="kpi">
            <h3 style={{ margin: 0 }}>Pending Mentors</h3>
            <p style={{ marginBottom: 0 }}>{demographics.totals.pendingMentors}</p>
          </div>
          <div className="kpi">
            <h3 style={{ margin: 0 }}>Total Bookings</h3>
            <p style={{ marginBottom: 0 }}>{demographics.totals.bookings}</p>
          </div>
          <div className="kpi">
            <h3 style={{ margin: 0 }}>Booking Pending</h3>
            <p style={{ marginBottom: 0 }}>{demographics.bookings.pending}</p>
          </div>
        </section>
      ) : null}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Pending Mentor Approvals</h2>
        {pendingMentors.length === 0 ? (
          <p className="muted">No pending mentors.</p>
        ) : (
          <div className="grid">
            {pendingMentors.map((mentor) => (
              <div
                key={mentor._id}
                style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}
              >
                <div>
                  <strong>{mentor.name}</strong>
                  <p className="muted" style={{ margin: "4px 0 0 0" }}>
                    {mentor.email} | {mentor.domain || "No domain"}
                  </p>
                </div>
                <button className="button primary" onClick={() => approveMentor(mentor._id)}>
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Students</h2>
        {students.length === 0 ? (
          <p className="muted">No student records.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Name</th>
                  <th align="left">Email</th>
                  <th align="left">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td style={{ padding: "8px 0" }}>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card grid">
        <h2 style={{ margin: 0 }}>Send Notification</h2>
        <form onSubmit={sendNotification} className="grid">
          <input
            className="input"
            placeholder="Title"
            value={notificationForm.title}
            onChange={(e) => setNotificationForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            className="input"
            rows={4}
            placeholder="Message"
            value={notificationForm.message}
            onChange={(e) => setNotificationForm((prev) => ({ ...prev, message: e.target.value }))}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <select
              className="input"
              value={notificationForm.type}
              onChange={(e) =>
                setNotificationForm((prev) => ({
                  ...prev,
                  type: e.target.value as NotificationForm["type"]
                }))
              }
            >
              <option value="announcement">announcement</option>
              <option value="system">system</option>
              <option value="booking">booking</option>
              <option value="approval">approval</option>
            </select>
            <select
              className="input"
              value={notificationForm.targetRole}
              onChange={(e) =>
                setNotificationForm((prev) => ({
                  ...prev,
                  targetRole: e.target.value as NotificationForm["targetRole"]
                }))
              }
            >
              <option value="all">all</option>
              <option value="student">student</option>
              <option value="mentor">mentor</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <button className="button primary" type="submit" disabled={sendingNotification}>
            {sendingNotification ? "Sending..." : "Send Notification"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Recent Notifications</h2>
        {notifications.length === 0 ? (
          <p className="muted">No notifications sent yet.</p>
        ) : (
          <div className="grid">
            {notifications.slice(0, 15).map((item) => (
              <div key={item._id} style={{ borderTop: "1px solid #e4ece9", paddingTop: 10 }}>
                <strong>{item.title}</strong>
                <p style={{ margin: "4px 0", color: "#425350" }}>{item.message}</p>
                <p className="muted" style={{ margin: 0 }}>
                  {item.type} | target: {item.targetRole}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
