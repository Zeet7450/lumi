"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LOCAL_DEMO_COOKIE, localDemoAccounts } from "@/lib/local-demo-auth";

type LoginState = { error: string };

function passwordsMatch(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function loginLocalDemo(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const account = localDemoAccounts[email as keyof typeof localDemoAccounts];
  const expectedPassword = process.env.DEMO_PASSWORD;
  if (!account || !expectedPassword || !passwordsMatch(password, expectedPassword)) return { error: "Email atau kata sandi demo tidak sesuai." };
  const cookieStore = await cookies();
  cookieStore.set(LOCAL_DEMO_COOKIE, account.role, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12 });
  redirect(account.destination);
}

export async function logoutLocalDemo(): Promise<void> {
  (await cookies()).delete(LOCAL_DEMO_COOKIE);
  redirect("/");
}
