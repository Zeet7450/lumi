export class ApplicationError extends Error {
  constructor(
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT",
    message: string
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export const unauthenticated = () => new ApplicationError("UNAUTHENTICATED", "Sesi petugas diperlukan.");
export const forbidden = () => new ApplicationError("FORBIDDEN", "Akses untuk peran ini tidak diizinkan.");
export const notFound = () => new ApplicationError("NOT_FOUND", "Data tidak ditemukan.");
export const conflict = () => new ApplicationError("CONFLICT", "Data telah berubah; muat ulang sebelum mencoba lagi.");
