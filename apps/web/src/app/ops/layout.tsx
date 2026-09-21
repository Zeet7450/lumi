export default async function OpsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Operational pages have server-side role guards. Keeping this layout neutral
  // lets a current Warga demo session switch safely at the dedicated login form.
  return <>{children}</>;
}
