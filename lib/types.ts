export type Role = "student" | "mentor" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "pending" | "approved";
  domain?: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type Mentor = {
  _id: string;
  name: string;
  email: string;
  status: "pending" | "approved";
  domain?: string;
  createdAt: string;
};

export type Student = {
  _id: string;
  name: string;
  email: string;
  status: "pending" | "approved";
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
    admins: number;
  };
  bookings: {
    pending: number;
    approved: number;
    rejected: number;
  };
  mentorDomains: Array<{ domain: string; count: number }>;
};

export type NotificationRecord = {
  _id: string;
  title: string;
  message: string;
  type: "announcement" | "system" | "booking" | "approval";
  targetRole: "student" | "mentor" | "admin" | "all";
  createdAt: string;
};
