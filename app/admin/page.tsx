// app/admin/page.tsx
"use client";

import { redirect } from "next/navigation";

export default function AdminHomePage() {
  redirect("/admin/perfiles");
}