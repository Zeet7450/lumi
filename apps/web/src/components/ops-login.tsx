"use client";

import { ThemeInit } from "./theme-init";
import { LumiMark } from "./brand-marks";
import { LocalDemoLogin } from "./local-demo-login";

export function OpsLogin() {
  return <><ThemeInit /><header className="ops-login-header"><div className="brand"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI Ops</span></div><span className="ops-login-header-note">Akses terbatas · petugas instansi</span></header><main className="ops-login-page"><section className="ops-login-context"><div><p>KOORDINASI LINGKUNGAN</p><h1>Satu ruang kerja untuk respons asap dan kebakaran lahan.</h1><span>Skenario dibangun di ruang uji, BPBD Provinsi memverifikasi kasus, DLH Provinsi memantau kondisi lalu menyebar informasi warga bersama Diskominfo, dan penutupan akhir selalu di tangan DLH Provinsi.</span></div><div className="ops-login-flow" aria-label="Alur koordinasi lintas instansi"><strong>Alur lintas instansi</strong><ol><li>Ruang uji</li><li>BPBD Provinsi</li><li>DLH Provinsi</li><li>BNPB / KLH</li><li>Warga</li></ol></div></section><section className="ops-login-form"><div><p className="eyebrow">Masuk petugas</p><h2>Selamat datang kembali.</h2><p className="muted">Masukkan email dan kata sandi akun instansi Anda.</p></div><LocalDemoLogin institutional /></section></main></>;
}
