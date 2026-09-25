"use client";

import { useActionState, useEffect } from "react";
import { loginLocalDemo } from "@/app/local-demo-actions";

const emptyLoginState = { error: "" as string, destination: undefined as string | undefined };

export function LocalDemoLogin({ institutional = false }: Readonly<{ institutional?: boolean }>) {
  const [state, action, pending] = useActionState(loginLocalDemo, emptyLoginState);
  useEffect(() => {
    if (state.destination) window.location.assign(state.destination);
  }, [state.destination]);
  return <form className="local-demo-login" action={action}>
    <label>Email<input name="email" type="email" autoComplete="username" placeholder="nama@instansi.id" required /></label>
    <label>Kata sandi<input name="password" type="password" autoComplete="current-password" required /></label>
    <div className="password-row">
      <a className="password-forgot" href="/ops/login?reset=diminta" onClick={(event) => { event.preventDefault(); window.alert("Reset kata sandi diserahkan ke admin instansi Anda. Hubungi koordinator untuk membuat ulang kredensial."); }}>Lupa kata sandi?</a>
    </div>
    {state.error ? <p className="error" role="alert">{state.error}</p> : null}
    <button className="button" type="submit" disabled={pending}>{pending ? "Memeriksa…" : "Masuk"}</button>
    <p className="muted small">{institutional ? "Gunakan akun petugas yang telah disediakan." : "Khusus akun petugas. Tidak ada pendaftaran publik di halaman ini."}</p>
  </form>;
}
