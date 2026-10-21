"use client";

import { useParams } from "next/navigation";
import { NoticeEditor } from "@/components/notices/NoticeEditor";

export default function NoticeEditPage() {
  const { id } = useParams<{ id: string }>();
  return <NoticeEditor key={id} id={id} />;
}
