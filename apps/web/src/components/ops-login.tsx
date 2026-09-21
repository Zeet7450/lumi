"use client";

import { ThemeInit } from "./theme-init";
import { ThemeToggle } from "./theme-toggle";
import { LumiMark } from "./brand-marks";
import { LocalDemoLogin } from "./local-demo-login";

export function OpsLogin() {
  return <><ThemeInit /><header className="ops-login-header"><div className="brand"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI Ops</span></div><ThemeToggle /></header><main className="ops-login-page"><section className="ops-login-context"><div><p>KOORDINASI LINGKUNGAN</p><h1>Satu ruang kerja untuk respons asap dan kebakaran lahan.</h1><span>Simulator membangun data uji, DLH memvalidasi lingkungan, BPBD mengelola respons, lalu Approver menerbitkan informasi warga.</span></div><div className="ops-login-flow" aria-label="Alur koordinasi demo"><strong>Alur lintas instansi</strong><ol><li>Simulator</li><li>DLH</li><li>BPBD</li><li>Approver</li></ol></div></section><section className="ops-login-form"><div><p className="eyebrow">Masuk petugas</p><h2>Selamat datang kembali.</h2><p className="muted">Masukkan email dan kata sandi akun instansi Anda.</p></div><LocalDemoLogin institutional /></section></main></>;
}
