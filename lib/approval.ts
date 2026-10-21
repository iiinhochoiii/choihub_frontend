import type { ApprovalDocument, ApprovalForm, ApprovalStep } from "./types";

/** 양식의 결재선으로 결재 단계를 만든다. 기안자 본인은 결재선에서 제외한다. */
export function buildSteps(form: ApprovalForm, drafterId: string): ApprovalStep[] {
  return form.approverIds
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

/** 아무도 결재하지 않은 진행중 문서만 기안자가 회수할 수 있다. */
export function canWithdraw(doc: ApprovalDocument, memberId: string): boolean {
  return (
    doc.drafterId === memberId &&
    doc.status === "in_progress" &&
    doc.steps.every((step) => step.status === "pending" || step.status === "waiting")
  );
}

/** 현재 단계 결재자의 승인/반려를 반영한 새 문서를 반환한다. */
export function applyDecision(
  doc: ApprovalDocument,
  approverId: string,
  decision: "approved" | "rejected",
  comment: string,
): ApprovalDocument {
  const index = doc.steps.findIndex((step) => step.status === "pending");
  if (index === -1 || doc.steps[index].approverId !== approverId) return doc;

  const actedAt = new Date().toISOString();
  const steps = doc.steps.map((step, i): ApprovalStep => {
    if (i === index) return { ...step, status: decision, comment: comment || undefined, actedAt };
    if (decision === "approved" && i === index + 1) return { ...step, status: "pending" };
    return step;
  });

  let status: ApprovalDocument["status"] = "in_progress";
  if (decision === "rejected") status = "rejected";
  else if (index === doc.steps.length - 1) status = "approved";

  return { ...doc, steps, status };
}

/** 문서번호: 양식카테고리 약어 없이 연도-일련번호 */
export function nextDocNumber(docs: ApprovalDocument[], date = new Date()): string {
  const year = date.getFullYear();
  const prefix = `GW-${year}-`;
  const max = docs
    .filter((doc) => doc.docNumber.startsWith(prefix))
    .reduce((acc, doc) => Math.max(acc, Number(doc.docNumber.slice(prefix.length)) || 0), 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}
