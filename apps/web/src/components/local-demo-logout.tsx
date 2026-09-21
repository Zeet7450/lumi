"use client";

import { logoutLocalDemo } from "@/app/local-demo-actions";

export function LocalDemoLogout({ confirm = false }: { confirm?: boolean }) {
  function confirmLogout(event: React.FormEvent<HTMLFormElement>) {
    if (confirm && !window.confirm("Keluar dari demo lokal ini?")) event.preventDefault();
  }
  return <form action={logoutLocalDemo} onSubmit={confirmLogout}><button className="text-utility" type="submit">Keluar demo</button></form>;
}
