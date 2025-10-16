// app/team-member/page.tsx
"use client";

import { redirect } from "next/navigation";

export default function TeamMemberHomePage() {
  return (
    redirect("/team-member/calendario")
  );
}
