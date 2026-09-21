import { logoutLocalDemo } from "@/app/local-demo-actions";

export function LocalDemoLogout() {
  return <form action={logoutLocalDemo}><button className="text-utility" type="submit">Keluar</button></form>;
}
