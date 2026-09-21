"use client";

import { useActionState, useEffect } from "react";
import { loginLocalDemo } from "@/app/local-demo-actions";

const emptyLoginState = { error: "" as string, destination: undefined as string | undefined };

export function LocalDemoLogin() {
  const [state, action, pending] = useActionState(loginLocalDemo, emptyLoginState);
  useEffect(() => {
    if (state.destination) window.location.assign(state.destination);
  }, [state.destination]);
  return <form className="local-demo-login" action={action}>
    <label>Email akun demo<input name="email" type="email" autoComplete="username" placeholder="nama@demo.lumi.id" required /></label>
    <label>Kata sandi demo<input name="password" type="password" autoComplete="current-password" required /></label>
    {state.error ? <p className="error" role="alert">{state.error}</p> : null}
    <button className="button" type="submit" disabled={pending}>{pending ? "Memeriksa…" : "Masuk"}</button>
    <p className="muted small">Akses ini hanya untuk demo lokal. Tidak ada pendaftaran publik atau akun produksi.</p>
  </form>;
}
