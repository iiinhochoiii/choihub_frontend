"use client";

import { useParams } from "next/navigation";
import { NoticeDetail } from "@/components/notices/NoticeDetail";

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <NoticeDetail key={id} id={id} />;
}
