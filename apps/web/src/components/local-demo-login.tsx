"use client";

import { useActionState } from "react";
import { emptyLoginState, loginLocalDemo } from "@/app/local-demo-actions";

export function LocalDemoLogin() {
  const [state, action, pending] = useActionState(loginLocalDemo, emptyLoginState);
  return <form className="local-demo-login" action={action}>
    <label>Email akun demo<input name="email" type="email" autoComplete="username" placeholder="nama@demo.lumi.id" required /></label>
    <label>Kata sandi demo<input name="password" type="password" autoComplete="current-password" required /></label>
    {state.error ? <p className="error" role="alert">{state.error}</p> : null}
    <button className="button" type="submit" disabled={pending}>{pending ? "Memeriksa…" : "Masuk"}</button>
    <p className="muted small">Akses ini hanya untuk demo lokal. Tidak ada pendaftaran publik atau akun produksi.</p>
  </form>;
}
