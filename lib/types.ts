export type Role = "student" | "mentor";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isAdmin?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  primaryCategory?: string;
  subCategory?: string;
};

export type LoginResponse = {
  token: string;
  refreshToken: string;
  user: AuthUser;
};

export type Mentor = {
  _id: string;
  name: string;
  email: string;
  approvalStatus: "pending" | "approved" | "rejected";
  primaryCategory?: string;
  subCategory?: string;
  specializations?: string[];
  createdAt: string;
};

export type MentorProfileRecord = {
  _id: string;
  name: string;
  email: string;
  status: "pending" | "approved";
  profilePhotoUrl?: string;
  phoneNumber?: string;
  title?: string;
  company?: string;
  experienceYears?: number;
  primaryCategory?: string;
  subCategory?: string;
  specializations?: string[];
  sessionPrice?: number;
  about?: string;
  linkedInUrl?: string;
  rating?: number;
  totalSessionsConducted?: number;
};

export type Student = {
  _id: string;
  name: string;
  email: string;
  status?: "pending" | "approved";
  approvalStatus?: "pending" | "approved" | "rejected";
  educationLevel?: string;
  targetExam?: string;
  interestedCategories?: string[];
  createdAt: string;
};

export type Demographics = {
  totals: {
    users: number;
    bookings: number;
    pendingMentors: number;
    approvedMentors: number;
  };
  roles: {
    students: number;
    mentors: number;
  };
  bookings: {
    pending: number;
    approved: number;
    rejected: number;
  };
  mentorCategories: Array<{ category: string; count: number }>;
  studentInterests: Array<{ category: string; count: number }>;
};

export type CollaborateApplication = {
  _id: string;
  name: string;
  email: string;
  organization?: string;
  type: "leader" | "founder" | "mentor";
  message?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
};

export type NotificationRecord = {
  _id: string;
  title: string;
  message: string;
  type: "announcement" | "system" | "booking" | "approval" | "direct";
  targetRole: "student" | "mentor" | "admin" | "all";
  createdAt: string;
};

export type ComplaintRecord = {
  _id: string;
  subject: string;
  description: string;
  category: "technical" | "mentor" | "booking" | "payment" | "general";
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  adminResponse?: string;
  createdAt: string;
  student?: {
    _id: string;
    name: string;
    email: string;
  };
};

export type ManualPaymentRecord = {
  _id: string;
  date: string;
  time: string;
  amount: number;
  currency?: string;
  paymentScreenshot?: string;
  transactionReference?: string;
  paymentStatus: "pending" | "waiting_verification" | "verified" | "rejected" | "paid";
  status: "pending" | "payment_pending" | "confirmed" | "approved" | "completed" | "cancelled" | "rejected";
  createdAt: string;
  studentId?: {
    _id: string;
    name: string;
    email: string;
  };
  mentorId?: {
    _id: string;
    name: string;
    email: string;
  };
};

export type ChatUser = {
  _id: string;
  name: string;
  email: string;
  role: "student" | "mentor" | "admin";
  status?: "pending" | "approved" | "rejected";
  approvalStatus?: "pending" | "approved" | "rejected";
  phoneNumber?: string;
};

export type ChatConversation = {
  counterpartId: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  counterpart: ChatUser;
};

export type ChatMessageRecord = {
  _id: string;
  sender: string;
  recipient: string;
  text: string;
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type NetworkAdminOverview = {
  posts: {
    total: number;
    public: number;
    private: number;
  };
  network: {
    pendingConnections: number;
    acceptedConnections: number;
    follows: number;
  };
  communities: {
    activeGroups: number;
    activeChallenges: number;
    upcomingLiveSessions: number;
  };
};

export type AdminNetworkPost = {
  _id: string;
  content: string;
  postType: string;
  visibility: "public" | "connections" | "private";
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  createdAt: string;
  authorId?: {
    _id: string;
    name: string;
    email: string;
    role: Role;
  };
};

export type AdminConnectionRecord = {
  _id: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
  relationshipType: "student_student" | "student_mentor" | "student_recruiter";
  createdAt: string;
  requesterId?: { _id: string; name: string; email: string; role: Role };
  recipientId?: { _id: string; name: string; email: string; role: Role };
};

export type AdminFollowRecord = {
  _id: string;
  createdAt: string;
  followerId?: { _id: string; name: string; email: string; role: Role };
  followingId?: { _id: string; name: string; email: string; role: Role };
};

export type AdminMentorGroupRecord = {
  _id: string;
  name: string;
  domain?: string;
  description?: string;
  maxStudents?: number;
  memberIds?: string[];
  schedule?: string;
  isActive: boolean;
  mentorId?: { _id: string; name: string; email: string; role: Role; approvalStatus?: string };
};

export type AdminLiveSessionRecord = {
  _id: string;
  title: string;
  topic?: string;
  description?: string;
  startsAt: string;
  durationMinutes?: number;
  sessionMode?: "free" | "paid";
  price?: number;
  currency?: string;
  maxParticipants?: number;
  approvalStatus?: "pending" | "approved" | "rejected";
  adminReviewNote?: string;
  isCancelled: boolean;
  meetingLink?: string;
  reviewedBy?: { _id: string; name: string; email: string; role: Role };
  mentorId?: { _id: string; name: string; email: string; role: Role };
  bookingStats?: {
    totalBookings: number;
    paidBookings: number;
    pendingBookings: number;
  };
};

export type AdminChallengeRecord = {
  _id: string;
  title: string;
  domain?: string;
  deadline: string;
  isActive: boolean;
  participants?: string[];
};
