// app/client/page.tsx
"use client";

import { redirect } from "next/navigation";

export default function ClientHomePage() {
  redirect("/client/pilotos");
}
