"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, isAdminUser } from "../lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !isAdminUser(user)) {
      router.replace("/login");
      return;
    }

    router.replace("/dashboard");
  }, [router]);

  return null;
}
