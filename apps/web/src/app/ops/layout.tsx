import { InternalDemoGate } from "@/components/internal-demo-gate";

export default function OpsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <InternalDemoGate>{children}</InternalDemoGate>;
}
