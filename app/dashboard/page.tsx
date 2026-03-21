"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";
import { clearSession, getToken, getUser, isAdminUser } from "../../lib/auth";
import {
  AdminChallengeRecord,
  AdminConnectionRecord,
  AdminFollowRecord,
  AdminLiveSessionRecord,
  AdminMentorGroupRecord,
  AdminNetworkPost,
  ChatConversation,
  ChatMessageRecord,
  CollaborateApplication,
  ComplaintRecord,
  Demographics,
  ManualPaymentRecord,
  Mentor,
  MentorProfileRecord,
  NetworkAdminOverview,
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

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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
  { id: "collaborations", label: "Collaborations" },
  { id: "mentors", label: "Mentors" },
  { id: "chats", label: "Mentor Chats" },
  { id: "network", label: "Network Feed" },
  { id: "mentorGroups", label: "Mentor Groups" },
  { id: "liveSessions", label: "Live Sessions" },
  { id: "communityChallenges", label: "Community Challenges" },
  { id: "students", label: "Students" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" }
] as const;

const DASHBOARD_CACHE_KEY = "orin_admin_dashboard_cache_v1";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cacheHydrated, setCacheHydrated] = useState(false);
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
  const [collaborateApplications, setCollaborateApplications] = useState<CollaborateApplication[]>([]);
  const [collaborateNotesById, setCollaborateNotesById] = useState<Record<string, string>>({});
  const [manualPayments, setManualPayments] = useState<ManualPaymentRecord[]>([]);
  const [networkOverview, setNetworkOverview] = useState<NetworkAdminOverview | null>(null);
  const [networkPosts, setNetworkPosts] = useState<AdminNetworkPost[]>([]);
  const [networkConnections, setNetworkConnections] = useState<AdminConnectionRecord[]>([]);
  const [networkFollows, setNetworkFollows] = useState<AdminFollowRecord[]>([]);
  const [networkGroups, setNetworkGroups] = useState<AdminMentorGroupRecord[]>([]);
  const [networkLiveSessions, setNetworkLiveSessions] = useState<AdminLiveSessionRecord[]>([]);
  const [networkChallenges, setNetworkChallenges] = useState<AdminChallengeRecord[]>([]);
  const [notificationForm, setNotificationForm] = useState(defaultNotification);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [directMessageForm, setDirectMessageForm] = useState<DirectMentorMessageForm>({
    title: "",
    message: ""
  });
  const [complaintReplyById, setComplaintReplyById] = useState<Record<string, string>>({});
  const [sendingNotification, setSendingNotification] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
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
    if (typeof window === "undefined") {
      setCacheHydrated(true);
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(DASHBOARD_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as {
          pendingMentors: Mentor[];
          mentorProfiles: MentorProfileRecord[];
          students: Student[];
          demographics: Demographics | null;
          notifications: NotificationRecord[];
          complaints: ComplaintRecord[];
          collaborateApplications: CollaborateApplication[];
          manualPayments: ManualPaymentRecord[];
          networkOverview: NetworkAdminOverview | null;
          networkPosts: AdminNetworkPost[];
          networkConnections: AdminConnectionRecord[];
          networkFollows: AdminFollowRecord[];
          networkGroups: AdminMentorGroupRecord[];
          networkLiveSessions: AdminLiveSessionRecord[];
          networkChallenges: AdminChallengeRecord[];
          chatConversations: ChatConversation[];
        };

        setPendingMentors(cached.pendingMentors || []);
        setMentorProfiles(cached.mentorProfiles || []);
        setStudents(cached.students || []);
        setDemographics(cached.demographics || null);
        setNotifications(cached.notifications || []);
        setComplaints(cached.complaints || []);
        setCollaborateApplications(cached.collaborateApplications || []);
        setManualPayments(cached.manualPayments || []);
        setNetworkOverview(cached.networkOverview || null);
        setNetworkPosts(cached.networkPosts || []);
        setNetworkConnections(cached.networkConnections || []);
        setNetworkFollows(cached.networkFollows || []);
        setNetworkGroups(cached.networkGroups || []);
        setNetworkLiveSessions(cached.networkLiveSessions || []);
        setNetworkChallenges(cached.networkChallenges || []);
        setChatConversations(cached.chatConversations || []);
        setLoading(false);
      }
    } catch {
      // ignore cache parsing errors
    } finally {
      setCacheHydrated(true);
    }
  }, []);

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
    if (!token || !cacheHydrated) return;

    async function loadData() {
      try {
        setLoading((prev) => prev && !demographics);
        setError("");

        const [
          mentorData,
          mentorProfileData,
          studentData,
          demographicData,
          notificationData,
          complaintData,
          collaborateData,
          manualPaymentData,
          chatConversationData,
          networkOverviewData,
          networkPostsData,
          networkConnectionsData,
          networkFollowsData,
          networkGroupsData,
          networkLiveSessionsData,
          networkChallengesData
        ] = await Promise.all([
          apiRequest<Mentor[]>("/api/admin/pending-mentors", {}, token),
          apiRequest<MentorProfileRecord[]>("/api/admin/mentors/profiles", {}, token),
          apiRequest<Student[]>("/api/admin/students", {}, token),
          apiRequest<Demographics>("/api/admin/demographics", {}, token),
          apiRequest<NotificationRecord[]>("/api/admin/notifications", {}, token),
          apiRequest<ComplaintRecord[]>("/api/complaints/admin", {}, token),
          apiRequest<CollaborateApplication[]>("/api/admin/collaborate/applications", {}, token),
          apiRequest<ManualPaymentRecord[]>("/api/sessions/admin/manual-payments", {}, token),
          apiRequest<ChatConversation[]>("/api/chat/conversations", {}, token),
          apiRequest<NetworkAdminOverview>("/api/admin/network/overview", {}, token),
          apiRequest<AdminNetworkPost[]>("/api/admin/network/posts", {}, token),
          apiRequest<AdminConnectionRecord[]>("/api/admin/network/connections", {}, token),
          apiRequest<AdminFollowRecord[]>("/api/admin/network/follows", {}, token),
          apiRequest<AdminMentorGroupRecord[]>("/api/admin/network/mentor-groups", {}, token),
          apiRequest<AdminLiveSessionRecord[]>("/api/admin/network/live-sessions", {}, token),
          apiRequest<AdminChallengeRecord[]>("/api/admin/network/challenges", {}, token)
        ]);

        setPendingMentors(mentorData);
        setMentorProfiles(mentorProfileData);
        setStudents(studentData);
        setDemographics(demographicData);
        setNotifications(notificationData);
        setComplaints(complaintData);
        setCollaborateApplications(collaborateData);
        setManualPayments(manualPaymentData);
        setNetworkOverview(networkOverviewData);
        setNetworkPosts(networkPostsData);
        setNetworkConnections(networkConnectionsData);
        setNetworkFollows(networkFollowsData);
        setNetworkGroups(networkGroupsData);
        setNetworkLiveSessions(networkLiveSessionsData);
        setNetworkChallenges(networkChallengesData);
        setChatConversations(
          chatConversationData.filter((item) => item.counterpart?.role === "mentor")
        );

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            DASHBOARD_CACHE_KEY,
            JSON.stringify({
              pendingMentors: mentorData,
              mentorProfiles: mentorProfileData,
              students: studentData,
              demographics: demographicData,
              notifications: notificationData,
              complaints: complaintData,
              collaborateApplications: collaborateData,
              manualPayments: manualPaymentData,
              networkOverview: networkOverviewData,
              networkPosts: networkPostsData,
              networkConnections: networkConnectionsData,
              networkFollows: networkFollowsData,
              networkGroups: networkGroupsData,
              networkLiveSessions: networkLiveSessionsData,
              networkChallenges: networkChallengesData,
              chatConversations: chatConversationData.filter((item) => item.counterpart?.role === "mentor")
            })
          );
        }
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token, cacheHydrated, demographics]);

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

  async function changeAdminPassword(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError("");
    setMessage("");

    if (passwordForm.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      setChangingPassword(true);
      await apiRequest<{ message: string }>(
        "/api/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword
          })
        },
        token
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      setMessage("Password changed successfully. Please login again.");
      clearSession();
      router.replace("/login");
    } catch (err: any) {
      setError(err.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
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

  async function reviewCollaborateApplication(applicationId: string, action: "approve" | "reject") {
    if (!token) return;
    setError("");
    setMessage("");
    try {
      const adminNotes = collaborateNotesById[applicationId] || "";
      await apiRequest(
        `/api/admin/collaborate/applications/${applicationId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ action, adminNotes })
        },
        token
      );
      const refreshed = await apiRequest<CollaborateApplication[]>("/api/admin/collaborate/applications", {}, token);
      setCollaborateApplications(refreshed);
      setMessage(action === "approve" ? "Collaboration approved." : "Collaboration rejected.");
    } catch (err: any) {
      setError(err.message || "Failed to review collaboration.");
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

  async function removePost(postId: string) {
    if (!token) return;
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/admin/network/posts/${postId}`, { method: "DELETE" }, token);
      setNetworkPosts((prev) => prev.filter((item) => item._id !== postId));
      setMessage("Post removed.");
    } catch (err: any) {
      setError(err.message || "Failed to remove post.");
    }
  }

  async function toggleGroup(groupId: string) {
    if (!token) return;
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/admin/network/mentor-groups/${groupId}/toggle`, { method: "PATCH" }, token);
      const refreshed = await apiRequest<AdminMentorGroupRecord[]>("/api/admin/network/mentor-groups", {}, token);
      setNetworkGroups(refreshed);
      setMessage("Group status updated.");
    } catch (err: any) {
      setError(err.message || "Failed to update group.");
    }
  }

  async function toggleLiveSession(liveSessionId: string) {
    if (!token) return;
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/admin/network/live-sessions/${liveSessionId}/toggle`, { method: "PATCH" }, token);
      const refreshed = await apiRequest<AdminLiveSessionRecord[]>("/api/admin/network/live-sessions", {}, token);
      setNetworkLiveSessions(refreshed);
      setMessage("Live session status updated.");
    } catch (err: any) {
      setError(err.message || "Failed to update live session.");
    }
  }

  async function toggleChallenge(challengeId: string) {
    if (!token) return;
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/admin/network/challenges/${challengeId}/toggle`, { method: "PATCH" }, token);
      const refreshed = await apiRequest<AdminChallengeRecord[]>("/api/admin/network/challenges", {}, token);
      setNetworkChallenges(refreshed);
      setMessage("Challenge status updated.");
    } catch (err: any) {
      setError(err.message || "Failed to update challenge.");
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
                    <th>Paid By → Paid To</th>
                    <th>Session Slot</th>
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
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span>
                            <strong>Student:</strong> {item.studentId?.name || "-"}
                          </span>
                          <span className="muted">{item.studentId?.email || "-"}</span>
                          <span>
                            <strong>Mentor:</strong> {item.mentorId?.name || "-"}
                          </span>
                          <span className="muted">{item.mentorId?.email || "-"}</span>
                        </div>
                      </td>
                      <td>
                        {item.date} {item.time}
                      </td>
                      <td>
                        {item.currency || "INR"} {item.amount}
                      </td>
                      <td>
                        {item.paymentScreenshot ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <a href={item.paymentScreenshot} target="_blank" rel="noreferrer">
                              <img
                                src={item.paymentScreenshot}
                                alt="Payment proof"
                                style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }}
                              />
                            </a>
                            <a href={item.paymentScreenshot} target="_blank" rel="noreferrer">
                              Open full screenshot
                            </a>
                          </div>
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

        <section id="collaborations" className="card section-card" style={sectionDisplay("collaborations")}>
          <h2>Collaborate Applications</h2>
          {collaborateApplications.length === 0 ? (
            <p className="muted">No collaboration applications yet.</p>
          ) : (
            <div className="list-stack">
              {collaborateApplications.map((item) => (
                <article key={item._id} className="complaint-item">
                  <div className="complaint-head">
                    <strong>{item.name} ({item.type})</strong>
                    <span className={`pill ${item.status === "pending" ? "open" : item.status}`}>{item.status}</span>
                  </div>
                  <p className="muted">{item.email} {item.organization ? `| ${item.organization}` : ""}</p>
                  <p>{item.message || "No message provided."}</p>
                  <p className="muted">Submitted: {new Date(item.createdAt).toLocaleString()}</p>
                  {item.reviewedAt ? (
                    <p className="muted">
                      Reviewed: {new Date(item.reviewedAt).toLocaleString()} by {item.reviewedBy?.name || "Admin"}
                    </p>
                  ) : null}
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Admin notes"
                    value={collaborateNotesById[item._id] ?? item.adminNotes ?? ""}
                    onChange={(e) =>
                      setCollaborateNotesById((prev) => ({ ...prev, [item._id]: e.target.value }))
                    }
                  />
                  {item.status === "pending" ? (
                    <div className="inline-actions">
                      <button className="button primary" onClick={() => reviewCollaborateApplication(item._id, "approve")}>
                        Approve
                      </button>
                      <button className="button danger" onClick={() => reviewCollaborateApplication(item._id, "reject")}>
                        Reject
                      </button>
                    </div>
                  ) : null}
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

        <section id="network" className="card section-card" style={sectionDisplay("network")}>
          <h2>Network Feed</h2>
          <p className="muted">Moderate posts, follows, and connection activity.</p>

          {networkOverview ? (
            <div className="grid kpi">
              <div className="kpi"><h3>Total Posts</h3><p>{networkOverview.posts.total}</p></div>
              <div className="kpi"><h3>Public Posts</h3><p>{networkOverview.posts.public}</p></div>
              <div className="kpi"><h3>Pending Connections</h3><p>{networkOverview.network.pendingConnections}</p></div>
              <div className="kpi"><h3>Accepted Connections</h3><p>{networkOverview.network.acceptedConnections}</p></div>
              <div className="kpi"><h3>Total Follows</h3><p>{networkOverview.network.follows}</p></div>
            </div>
          ) : null}

          <h3>Recent Posts</h3>
          {networkPosts.length === 0 ? (
            <p className="muted">No posts found.</p>
          ) : (
            <div className="list-stack">
              {networkPosts.slice(0, 25).map((post) => (
                <article key={post._id} className="row-item">
                  <div>
                    <strong>{post.authorId?.name || "User"}</strong>
                    <p className="muted">
                      {post.authorId?.email || "-"} | {post.postType} | {post.visibility} | {new Date(post.createdAt).toLocaleString()}
                    </p>
                    <p>{post.content}</p>
                    <p className="muted">
                      Likes {post.likeCount || 0} | Comments {post.commentCount || 0} | Shares {post.shareCount || 0}
                    </p>
                  </div>
                  <button className="button danger" onClick={() => removePost(post._id)}>
                    Remove Post
                  </button>
                </article>
              ))}
            </div>
          )}

          <h3>Recent Connections</h3>
          {networkConnections.length === 0 ? (
            <p className="muted">No connection records found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Recipient</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {networkConnections.slice(0, 40).map((item) => (
                    <tr key={item._id}>
                      <td>{item.requesterId?.name || "-"}</td>
                      <td>{item.recipientId?.name || "-"}</td>
                      <td>{item.relationshipType}</td>
                      <td>{item.status}</td>
                      <td>{new Date(item.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3>Recent Follows</h3>
          {networkFollows.length === 0 ? (
            <p className="muted">No follow records found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Follower</th>
                    <th>Following</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {networkFollows.slice(0, 40).map((item) => (
                    <tr key={item._id}>
                      <td>{item.followerId?.name || "-"}</td>
                      <td>{item.followingId?.name || "-"}</td>
                      <td>{new Date(item.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="mentorGroups" className="card section-card" style={sectionDisplay("mentorGroups")}>
          <h2>Mentor Groups</h2>
          <p className="muted">Review group visibility, ownership, and member volume.</p>
          {networkOverview ? (
            <div className="grid kpi">
              <div className="kpi"><h3>Active Groups</h3><p>{networkOverview.communities.activeGroups}</p></div>
              <div className="kpi"><h3>Total Groups Loaded</h3><p>{networkGroups.length}</p></div>
            </div>
          ) : null}
          {networkGroups.length === 0 ? (
            <p className="muted">No mentor groups found.</p>
          ) : (
            <div className="list-stack">
              {networkGroups.slice(0, 20).map((group) => (
                <article key={group._id} className="row-item">
                  <div>
                    <strong>{group.name}</strong>
                    <p className="muted">
                      Mentor: {group.mentorId?.name || "-"} | Domain: {group.domain || "-"} | Members: {group.memberIds?.length || 0}
                    </p>
                    <p className="muted">{group.schedule || "Weekly sessions"}</p>
                    <p className="muted">Status: {group.isActive ? "Active" : "Disabled"}</p>
                  </div>
                  <button className={`button ${group.isActive ? "danger" : "primary"}`} onClick={() => toggleGroup(group._id)}>
                    {group.isActive ? "Disable" : "Activate"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="liveSessions" className="card section-card" style={sectionDisplay("liveSessions")}>
          <h2>Live Sessions</h2>
          <p className="muted">Monitor upcoming mentor live sessions and control visibility.</p>
          {networkOverview ? (
            <div className="grid kpi">
              <div className="kpi"><h3>Upcoming Lives</h3><p>{networkOverview.communities.upcomingLiveSessions}</p></div>
              <div className="kpi"><h3>Total Lives Loaded</h3><p>{networkLiveSessions.length}</p></div>
            </div>
          ) : null}
          {networkLiveSessions.length === 0 ? (
            <p className="muted">No live sessions found.</p>
          ) : (
            <div className="list-stack">
              {networkLiveSessions.slice(0, 20).map((live) => (
                <article key={live._id} className="row-item">
                  <div>
                    <strong>{live.title}</strong>
                    <p className="muted">
                      Mentor: {live.mentorId?.name || "-"} | {new Date(live.startsAt).toLocaleString()}
                    </p>
                    <p className="muted">Status: {live.isCancelled ? "Cancelled" : "Active"}</p>
                  </div>
                  <button
                    className={`button ${live.isCancelled ? "primary" : "danger"}`}
                    onClick={() => toggleLiveSession(live._id)}
                  >
                    {live.isCancelled ? "Reopen" : "Cancel"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="communityChallenges" className="card section-card" style={sectionDisplay("communityChallenges")}>
          <h2>Community Challenges</h2>
          <p className="muted">Activate or disable community challenge tracks from one place.</p>
          {networkOverview ? (
            <div className="grid kpi">
              <div className="kpi"><h3>Active Challenges</h3><p>{networkOverview.communities.activeChallenges}</p></div>
              <div className="kpi"><h3>Total Challenges Loaded</h3><p>{networkChallenges.length}</p></div>
            </div>
          ) : null}
          {networkChallenges.length === 0 ? (
            <p className="muted">No challenges found.</p>
          ) : (
            <div className="list-stack">
              {networkChallenges.slice(0, 20).map((challenge) => (
                <article key={challenge._id} className="row-item">
                  <div>
                    <strong>{challenge.title}</strong>
                    <p className="muted">
                      Domain: {challenge.domain || "-"} | Deadline: {new Date(challenge.deadline).toLocaleDateString()} | Participants: {challenge.participants?.length || 0}
                    </p>
                    <p className="muted">Status: {challenge.isActive ? "Active" : "Disabled"}</p>
                  </div>
                  <button
                    className={`button ${challenge.isActive ? "danger" : "primary"}`}
                    onClick={() => toggleChallenge(challenge._id)}
                  >
                    {challenge.isActive ? "Disable" : "Activate"}
                  </button>
                </article>
              ))}
            </div>
          )}
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

        <section id="security" className="card section-card" style={sectionDisplay("security")}>
          <h2>Security</h2>
          <p className="muted">Change admin password and secure account access.</p>
          <form onSubmit={changeAdminPassword} className="grid form-block">
            <input
              className="input"
              type="password"
              placeholder="Current password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              autoComplete="current-password"
              required
            />
            <input
              className="input"
              type="password"
              placeholder="New password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              autoComplete="new-password"
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              autoComplete="new-password"
              required
            />
            <button className="button primary" type="submit" disabled={changingPassword}>
              {changingPassword ? "Updating..." : "Change Password"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
