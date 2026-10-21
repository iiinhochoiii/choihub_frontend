import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "운영자 로그인",
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
