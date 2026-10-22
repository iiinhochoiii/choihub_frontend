import type { CompanyInfo } from "./types";

export type CompanyKey = keyof CompanyInfo;

export interface CompanyFieldDef {
  key: CompanyKey;
  label: string;
  type?: "text" | "email" | "url" | "date" | "time" | "number" | "tel";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  full?: boolean;
}

/** 회사정보 입력 항목. 매니저의 회사정보 화면과 운영자의 회사 등록 화면이 함께 쓴다. */
export const COMPANY_SECTIONS: { title: string; fields: CompanyFieldDef[] }[] = [
  {
    title: "기본 정보",
    fields: [
      { key: "name", label: "회사명", required: true },
      { key: "nameEn", label: "영문 회사명" },
      { key: "ceo", label: "대표자", required: true },
      { key: "businessNumber", label: "사업자등록번호", required: true, placeholder: "000-00-00000" },
      { key: "corporateNumber", label: "법인등록번호", placeholder: "000000-0000000" },
      { key: "industry", label: "업종" },
      { key: "foundedAt", label: "설립일", type: "date" },
    ],
  },
  {
    title: "연락처",
    fields: [
      { key: "phone", label: "대표전화", type: "tel", required: true, placeholder: "02-0000-0000" },
      { key: "fax", label: "팩스", type: "tel" },
      { key: "email", label: "대표 이메일", type: "email", required: true },
      { key: "website", label: "서비스 주소", type: "url", placeholder: "https://", hint: "http:// 또는 https://로 시작" },
      { key: "address", label: "주소", full: true },
    ],
  },
  {
    title: "근무 설정",
    fields: [
      { key: "workStart", label: "출근 시간", type: "time", required: true, hint: "이 시간 이후 출근 시 지각 처리" },
      { key: "workEnd", label: "퇴근 시간", type: "time", required: true },
      { key: "defaultAnnualLeave", label: "기본 연차일수", type: "number", required: true, hint: "신규 구성원에게 적용" },
    ],
  },
];

export const EMPTY_COMPANY: CompanyInfo = {
  name: "",
  nameEn: "",
  ceo: "",
  businessNumber: "",
  corporateNumber: "",
  industry: "",
  foundedAt: "",
  phone: "",
  fax: "",
  email: "",
  website: "",
  address: "",
  workStart: "09:00",
  workEnd: "18:00",
  defaultAnnualLeave: 15,
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

