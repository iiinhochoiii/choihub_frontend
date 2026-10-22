import type { ApprovalDocument, ApprovalStep } from "@/types";

/**
 * 기안 화면의 결재선 미리보기. 실제 결재 단계는 상신 시 서버가 만든다.
 * (서버와 같이 기안자 본인은 결재선에서 제외해 보여 준다)
 */
export function previewSteps(approverIds: string[], drafterId: string): ApprovalStep[] {
  return approverIds
    .filter((id) => id !== drafterId)
    .map((approverId, index) => ({
      approverId,
      status: index === 0 ? "pending" : "waiting",
    }));
}

export function getCurrentStep(doc: ApprovalDocument): ApprovalStep | undefined {
  if (doc.status !== "in_progress") return undefined;
  return doc.steps.find((step) => step.status === "pending");
}

export function isMyTurn(doc: ApprovalDocument, memberId: string): boolean {
  return getCurrentStep(doc)?.approverId === memberId;
}

/** 아무도 결재하지 않은 진행중 문서만 기안자가 회수할 수 있다. (버튼 표시용, 최종 판단은 서버) */
export function canWithdraw(doc: ApprovalDocument, memberId: string): boolean {
  return (
    doc.drafterId === memberId &&
    doc.status === "in_progress" &&
    doc.steps.every((step) => step.status === "pending" || step.status === "waiting")
  );
}
