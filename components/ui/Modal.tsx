"use client";

import styled from "@emotion/styled";
import { X } from "lucide-react";
import { useEffect } from "react";
import { Button, IconButton, transientOptions } from "./Button";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: ${({ theme }) => theme.colors.overlay};
  animation: fade-in 0.15s ease-out;

  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
`;

const Dialog = styled("div", transientOptions)<{ $width: number }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: ${({ $width }) => $width}px;
  max-height: calc(100vh - 32px);
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  animation: pop-in 0.18s ease-out;

  @keyframes pop-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  h2 {
    font-size: 16px;
    font-weight: 700;
  }
`;

const Body = styled.div`
  padding: 20px;
  overflow-y: auto;
`;

export const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  width?: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({ open, title, onClose, width = 520, footer, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Overlay onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <Dialog $width={width} role="dialog" aria-modal="true" aria-label={title}>
        <Header>
          <h2>{title}</h2>
          <IconButton onClick={onClose} aria-label="닫기">
            <X />
          </IconButton>
        </Header>
        <Body>{children}</Body>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </Dialog>
    </Overlay>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** window.confirm 대체용 확인 모달 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "확인",
  danger,
  onConfirm,
  onClose,
}: ConfirmProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      width={400}
      footer={
        <>
          <Button $variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            $variant={danger ? "danger" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ whiteSpace: "pre-line" }}>{message}</p>
    </Modal>
  );
}
