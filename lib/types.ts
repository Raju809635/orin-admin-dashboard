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
