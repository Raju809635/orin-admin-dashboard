"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";
import { clearSession, getToken, getUser, isAdminUser } from "../../lib/auth";
import {
  ChatConversation,
  ChatMessageRecord,
  ComplaintRecord,
  Demographics,
  ManualPaymentRecord,
  Mentor,
  MentorProfileRecord,
  NotificationRecord,
  Student
} from "../../lib/types";

type NotificationForm = {
  title: string;
  message: string;
  type: "announcement" | "system" | "booking" | "approval";
  targetRole: "student" | "mentor" | "admin" | "all";
};

type DirectMentorMessageForm = {
  title: string;
  message: string;
};

const defaultNotification: NotificationForm = {
  title: "",
  message: "",
  type: "announcement",
  targetRole: "all"
};

const sectionList = [
  { id: "overview", label: "Overview" },
  { id: "approvals", label: "Approvals" },
  { id: "payments", label: "Payments" },
  { id: "complaints", label: "Complaints" },
  { id: "mentors", label: "Mentors" },
  { id: "chats", label: "Mentor Chats" },
  { id: "students", label: "Students" },
  { id: "notifications", label: "Notifications" }
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState<(typeof sectionList)[number]["id"]>("overview");

  const [pendingMentors, setPendingMentors] = useState<Mentor[]>([]);
  const [mentorProfiles, setMentorProfiles] = useState<MentorProfileRecord[]>([]);
  const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [manualPayments, setManualPayments] = useState<ManualPaymentRecord[]>([]);
  const [notificationForm, setNotificationForm] = useState(defaultNotification);
  const [directMessageForm, setDirectMessageForm] = useState<DirectMentorMessageForm>({
    title: "",
    message: ""
  });
  const [complaintReplyById, setComplaintReplyById] = useState<Record<string, string>>({});
  const [sendingNotification, setSendingNotification] = useState(false);
  const [sendingDirect, setSendingDirect] = useState(false);
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [activeChatUserId, setActiveChatUserId] = useState<string>("");
  const [activeChatMentorName, setActiveChatMentorName] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessageRecord[]>([]);
  const [chatText, setChatText] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingChatMessage, setSendingChatMessage] = useState(false);

  const validSections = useMemo(() => sectionList.map((item) => item.id), []);

  useEffect(() => {
    const parts = (pathname || "").split("/").filter(Boolean);
    const sectionFromPath = parts.length >= 2 ? parts[1] : "overview";
    const normalized = validSections.includes(sectionFromPath as (typeof sectionList)[number]["id"])
      ? (sectionFromPath as (typeof sectionList)[number]["id"])
      : "overview";
    setActiveSection(normalized);
  }, [pathname, validSections]);

  useEffect(() => {
    const currentToken = getToken();
    const currentUser = getUser();

    if (!currentToken || !isAdminUser(currentUser)) {
      router.replace("/login");
      return;
    }

    setToken(currentToken);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          mentorData,
          mentorProfileData,
          studentData,
          demographicData,
          notificationData,
          complaintData,
          manualPaymentData,
          chatConversationData
        ] = await Promise.all([
          apiRequest<Mentor[]>("/api/admin/pending-mentors", {}, token),
          apiRequest<MentorProfileRecord[]>("/api/admin/mentors/profiles", {}, token),
          apiRequest<Student[]>("/api/admin/students", {}, token),
          apiRequest<Demographics>("/api/admin/demographics", {}, token),
          apiRequest<NotificationRecord[]>("/api/admin/notifications", {}, token),
          apiRequest<ComplaintRecord[]>("/api/complaints/admin", {}, token),
          apiRequest<ManualPaymentRecord[]>("/api/sessions/admin/manual-payments", {}, token),
          apiRequest<ChatConversation[]>("/api/chat/conversations", {}, token)
        ]);

        setPendingMentors(mentorData);
        setMentorProfiles(mentorProfileData);
        setStudents(studentData);
        setDemographics(demographicData);
        setNotifications(notificationData);
        setComplaints(complaintData);
        setManualPayments(manualPaymentData);
        setChatConversations(
          chatConversationData.filter((item) => item.counterpart?.role === "mentor")
        );
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  const openComplaints = useMemo(
    () => complaints.filter((item) => item.status === "open" || item.status === "in_progress").length,
    [complaints]
  );

  async function approveMentor(id: string) {
    if (!token) return;
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/admin/approve/${id}`, { method: "PUT" }, token);
      setMessage("Mentor approved.");
      setPendingMentors((prev) => prev.filter((mentor) => mentor._id !== id));
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

  function toggleMentorSelection(mentorId: string) {
    setSelectedMentorIds((prev) =>
      prev.includes(mentorId) ? prev.filter((id) => id !== mentorId) : [...prev, mentorId]
    );
  }

  async function sendDirectMessageToSelectedMentors(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSendingDirect(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        "/api/admin/messages/mentors",
        {
          method: "POST",
          body: JSON.stringify({
            title: directMessageForm.title,
            message: directMessageForm.message,
            recipientUserIds: selectedMentorIds
          })
        },
        token
      );

      setDirectMessageForm({ title: "", message: "" });
      setSelectedMentorIds([]);
      setMessage("Direct message sent to selected mentors.");
      const notificationData = await apiRequest<NotificationRecord[]>("/api/admin/notifications", {}, token);
      setNotifications(notificationData);
    } catch (err: any) {
      setError(err.message || "Failed to send direct mentor message");
    } finally {
      setSendingDirect(false);
    }
  }

  async function updateComplaintStatus(complaintId: string, status: ComplaintRecord["status"]) {
    if (!token) return;
    setError("");
    try {
      const responseText = complaintReplyById[complaintId] || "";
      const { complaint } = await apiRequest<{ complaint: ComplaintRecord }>(
        `/api/complaints/admin/${complaintId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            adminResponse: responseText
          })
        },
        token
      );

      setComplaints((prev) => prev.map((item) => (item._id === complaintId ? complaint : item)));
      setMessage("Complaint updated.");
    } catch (err: any) {
      setError(err.message || "Failed to update complaint");
    }
  }

  async function reviewManualPayment(sessionId: string, action: "verify" | "reject") {
    if (!token) return;
    setError("");
    setMessage("");

    try {
      const rejectReason =
        action === "reject"
          ? window.prompt("Reason for rejection", "Payment proof unclear") || ""
          : "";

      await apiRequest<{ message: string }>(
        `/api/sessions/admin/manual-payments/${sessionId}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({ action, rejectReason })
        },
        token
      );

      const refreshed = await apiRequest<ManualPaymentRecord[]>("/api/sessions/admin/manual-payments", {}, token);
      setManualPayments(refreshed);
      setMessage(action === "verify" ? "Payment verified." : "Payment rejected.");
    } catch (err: any) {
      setError(err.message || "Failed to review payment");
    }
  }

  async function openMentorChat(userId: string, mentorName: string) {
    if (!token) return;

    try {
      setLoadingChat(true);
      setError("");
      const response = await apiRequest<{ counterpart: { _id: string; name: string }; messages: ChatMessageRecord[] }>(
        `/api/chat/messages/${userId}`,
        {},
        token
      );
      await apiRequest(`/api/chat/messages/${userId}/read`, { method: "PATCH" }, token);
      setActiveChatUserId(userId);
      setActiveChatMentorName(response.counterpart?.name || mentorName);
      setChatMessages(response.messages || []);
      const refreshed = await apiRequest<ChatConversation[]>("/api/chat/conversations", {}, token);
      setChatConversations(refreshed.filter((item) => item.counterpart?.role === "mentor"));
    } catch (err: any) {
      setError(err.message || "Failed to open chat.");
    } finally {
      setLoadingChat(false);
    }
  }

  async function sendMentorChatMessage(event: FormEvent) {
    event.preventDefault();
    if (!token || !activeChatUserId || !chatText.trim()) return;

    try {
      setSendingChatMessage(true);
      setError("");
      await apiRequest(
        `/api/chat/messages/${activeChatUserId}`,
        {
          method: "POST",
          body: JSON.stringify({ text: chatText.trim() })
        },
        token
      );

      const response = await apiRequest<{ counterpart: { _id: string; name: string }; messages: ChatMessageRecord[] }>(
        `/api/chat/messages/${activeChatUserId}`,
        {},
        token
      );
      setChatMessages(response.messages || []);
      setChatText("");
      const refreshed = await apiRequest<ChatConversation[]>("/api/chat/conversations", {}, token);
      setChatConversations(refreshed.filter((item) => item.counterpart?.role === "mentor"));
    } catch (err: any) {
      setError(err.message || "Failed to send chat message.");
    } finally {
      setSendingChatMessage(false);
    }
  }

  function gotoSection(id: (typeof sectionList)[number]["id"]) {
    const targetPath = id === "overview" ? "/dashboard" : `/dashboard/${id}`;
    router.push(targetPath);
  }

  function sectionDisplay(id: (typeof sectionList)[number]["id"]) {
    return activeSection === id ? undefined : { display: "none" as const };
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
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand">
          <h1>ORIN Admin</h1>
          <p>Operations Console</p>
        </div>
        <nav className="nav-list">
          {sectionList.map((section) => (
            <button
              key={section.id}
              className={`nav-btn ${activeSection === section.id ? "active" : ""}`}
              onClick={() => gotoSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <button className="button ghost logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      <section className="admin-content">
        {error ? (
          <section className="card alert error">
            <p>{error}</p>
          </section>
        ) : null}
        {message ? (
          <section className="card alert success">
            <p>{message}</p>
          </section>
        ) : null}

        <section id="overview" className="card section-card" style={sectionDisplay("overview")}>
          <h2>Overview</h2>
          <p className="muted">Live platform snapshot and action health.</p>
          {demographics ? (
            <div className="grid kpi">
              <div className="kpi"><h3>Total Users</h3><p>{demographics.totals.users}</p></div>
              <div className="kpi"><h3>Students</h3><p>{demographics.roles.students}</p></div>
              <div className="kpi"><h3>Mentors</h3><p>{demographics.roles.mentors}</p></div>
              <div className="kpi"><h3>Pending Mentors</h3><p>{demographics.totals.pendingMentors}</p></div>
              <div className="kpi"><h3>Total Bookings</h3><p>{demographics.totals.bookings}</p></div>
              <div className="kpi"><h3>Open Complaints</h3><p>{openComplaints}</p></div>
            </div>
          ) : null}
        </section>

        <section id="approvals" className="card section-card" style={sectionDisplay("approvals")}>
          <h2>Pending Mentor Approvals</h2>
          {pendingMentors.length === 0 ? (
            <p className="muted">No pending mentors.</p>
          ) : (
            <div className="list-stack">
              {pendingMentors.map((mentor) => (
                <article key={mentor._id} className="row-item">
                  <div>
                    <strong>{mentor.name}</strong>
                    <p className="muted">
                      {mentor.email} | {[mentor.primaryCategory, mentor.subCategory].filter(Boolean).join(" > ") || "No category"}
                    </p>
                  </div>
                  <button className="button primary" onClick={() => approveMentor(mentor._id)}>
                    Approve
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="payments" className="card section-card" style={sectionDisplay("payments")}>
          <h2>Payment Verifications</h2>
          {manualPayments.length === 0 ? (
            <p className="muted">No pending manual payments.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Mentor</th>
                    <th>Amount</th>
                    <th>Screenshot</th>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {manualPayments.map((item) => (
                    <tr key={item._id}>
                      <td>{item.studentId?.name || "-"}</td>
                      <td>{item.mentorId?.name || "-"}</td>
                      <td>
                        {item.currency || "INR"} {item.amount}
                      </td>
                      <td>
                        {item.paymentScreenshot ? (
                          <a href={item.paymentScreenshot} target="_blank" rel="noreferrer">
                            View Proof
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{new Date(item.createdAt).toLocaleString()}</td>
                      <td>{item.transactionReference || "-"}</td>
                      <td className="inline-actions">
                        <button className="button primary" onClick={() => reviewManualPayment(item._id, "verify")}>
                          Verify
                        </button>
                        <button className="button danger" onClick={() => reviewManualPayment(item._id, "reject")}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="complaints" className="card section-card" style={sectionDisplay("complaints")}>
          <h2>Student Complaints</h2>
          {complaints.length === 0 ? (
            <p className="muted">No complaints found.</p>
          ) : (
            <div className="list-stack">
              {complaints.map((item) => (
                <article key={item._id} className="complaint-item">
                  <div className="complaint-head">
                    <strong>{item.subject}</strong>
                    <span className={`pill ${item.status}`}>{item.status}</span>
                  </div>
                  <p className="muted">
                    {item.student?.name} ({item.student?.email}) | {item.category} | {item.priority}
                  </p>
                  <p>{item.description}</p>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Write admin response"
                    value={complaintReplyById[item._id] ?? item.adminResponse ?? ""}
                    onChange={(e) =>
                      setComplaintReplyById((prev) => ({ ...prev, [item._id]: e.target.value }))
                    }
                  />
                  <div className="inline-actions">
                    <button className="button ghost" onClick={() => updateComplaintStatus(item._id, "in_progress")}>
                      Mark In Progress
                    </button>
                    <button className="button primary" onClick={() => updateComplaintStatus(item._id, "resolved")}>
                      Mark Resolved
                    </button>
                    <button className="button danger" onClick={() => updateComplaintStatus(item._id, "closed")}>
                      Close
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="mentors" className="card section-card" style={sectionDisplay("mentors")}>
          <h2>Mentor Profiles</h2>
          {mentorProfiles.length === 0 ? (
            <p className="muted">No mentor profiles found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Mentor</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Category</th>
                    <th>Experience</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mentorProfiles.map((mentor) => (
                    <tr key={mentor._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedMentorIds.includes(mentor._id)}
                          onChange={() => toggleMentorSelection(mentor._id)}
                        />
                      </td>
                      <td>{mentor.name}</td>
                      <td>{mentor.email}</td>
                      <td>{mentor.phoneNumber || "-"}</td>
                      <td>{[mentor.primaryCategory, mentor.subCategory].filter(Boolean).join(" > ") || "-"}</td>
                      <td>{mentor.experienceYears ?? 0} yrs</td>
                      <td>{mentor.sessionPrice ?? 0}</td>
                      <td>{mentor.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <form onSubmit={sendDirectMessageToSelectedMentors} className="grid form-block">
            <h3>Message Selected Mentors</h3>
            <p className="muted">Selected mentors: {selectedMentorIds.length}</p>
            <input
              className="input"
              placeholder="Message title"
              value={directMessageForm.title}
              onChange={(e) => setDirectMessageForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              className="input"
              rows={4}
              placeholder="Write your message to selected mentors"
              value={directMessageForm.message}
              onChange={(e) => setDirectMessageForm((prev) => ({ ...prev, message: e.target.value }))}
            />
            <button className="button primary" type="submit" disabled={sendingDirect || selectedMentorIds.length === 0}>
              {sendingDirect ? "Sending..." : "Send Direct Message"}
            </button>
          </form>
        </section>

        <section id="chats" className="card section-card" style={sectionDisplay("chats")}>
          <h2>Mentor Chats</h2>
          <p className="muted">WhatsApp-style mentor inbox for admin support.</p>
          <div className="grid" style={{ gridTemplateColumns: "minmax(260px, 1fr) minmax(320px, 2fr)", gap: 16 }}>
            <div>
              {chatConversations.length === 0 ? (
                <p className="muted">No mentor conversations yet.</p>
              ) : (
                <div className="list-stack">
                  {chatConversations.map((chat) => {
                    const isActive = activeChatUserId === chat.counterpartId;
                    return (
                      <button
                        type="button"
                        key={chat.counterpartId}
                        className={`row-item ${isActive ? "active-chat" : ""}`}
                        onClick={() => openMentorChat(chat.counterpartId, chat.counterpart?.name || "Mentor")}
                        style={{ textAlign: "left", border: "1px solid #e5e7eb", background: isActive ? "#E8F5EE" : "#fff" }}
                      >
                        <div>
                          <strong>{chat.counterpart?.name || "Mentor"}</strong>
                          <p className="muted">{chat.counterpart?.phoneNumber || "No phone"}</p>
                          <p className="muted">{chat.lastMessage}</p>
                          <p className="muted">{new Date(chat.lastMessageAt).toLocaleString()}</p>
                        </div>
                        {chat.unreadCount > 0 ? <span className="pill open">{chat.unreadCount} new</span> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              {!activeChatUserId ? (
                <p className="muted">Select a mentor conversation.</p>
              ) : (
                <>
                  <h3>{activeChatMentorName || "Mentor"}</h3>
                  {loadingChat ? <p className="muted">Loading chat...</p> : null}
                  <div className="list-stack" style={{ maxHeight: 360, overflowY: "auto", marginBottom: 10 }}>
                    {chatMessages.length === 0 ? (
                      <p className="muted">No messages yet.</p>
                    ) : (
                      chatMessages.map((item) => (
                        <article key={item._id} className="row-item">
                          <p>
                            <strong>{item.sender === activeChatUserId ? activeChatMentorName || "Mentor" : "Admin"}:</strong>{" "}
                            {item.text}
                          </p>
                          <p className="muted">{new Date(item.createdAt).toLocaleString()}</p>
                        </article>
                      ))
                    )}
                  </div>
                  <form onSubmit={sendMentorChatMessage} className="grid form-block">
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Type reply to mentor"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                    />
                    <button className="button primary" type="submit" disabled={sendingChatMessage || !chatText.trim()}>
                      {sendingChatMessage ? "Sending..." : "Send Reply"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        <section id="students" className="card section-card" style={sectionDisplay("students")}>
          <h2>Students</h2>
          {students.length === 0 ? (
            <p className="muted">No student records.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.status || student.approvalStatus || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="notifications" className="card section-card" style={sectionDisplay("notifications")}>
          <h2>Notifications</h2>
          <form onSubmit={sendNotification} className="grid form-block">
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
            <div className="split">
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

          <h3>Recent Notifications</h3>
          {notifications.length === 0 ? (
            <p className="muted">No notifications sent yet.</p>
          ) : (
            <div className="list-stack">
              {notifications.slice(0, 15).map((item) => (
                <article key={item._id} className="row-item notification-row">
                  <div>
                    <strong>{item.title}</strong>
                    <p className="muted">{item.message}</p>
                    <p className="muted">
                      {item.type} | target: {item.targetRole}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
