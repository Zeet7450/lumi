"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LOCAL_DEMO_COOKIE, localDemoAccountByEmail } from "@/lib/local-demo-auth";

type LoginState = { error: string; destination?: string };

function passwordsMatch(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function loginLocalDemo(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const account = localDemoAccountByEmail(email);
  const expectedPassword = process.env.DEMO_PASSWORD;
  const isOpsLogin = process.env.LUMI_ENTRY === "ops";
  if (!account || (isOpsLogin && account.role === "WARGA") || !expectedPassword || !passwordsMatch(password, expectedPassword)) return { error: "Email atau kata sandi tidak sesuai." };
  const cookieStore = await cookies();
  // The cookie carries the email, not the role: several provincial officers
  // share a role, and the session must remember which province they serve.
  cookieStore.set(LOCAL_DEMO_COOKIE, account.email, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12 });
  return { error: "", destination: account.destination };
}

export async function logoutLocalDemo(): Promise<void> {
  (await cookies()).delete(LOCAL_DEMO_COOKIE);
  redirect("/");
}
