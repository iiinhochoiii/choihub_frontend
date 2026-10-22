export interface CompanyInfo {
  name: string;
  nameEn: string;
  ceo: string;
  businessNumber: string;
  corporateNumber: string;
  industry: string;
  foundedAt: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  address: string;
  workStart: string; // HH:mm
  workEnd: string; // HH:mm
  defaultAnnualLeave: number;
}

/** PATCH /company, POST·PATCH /admin/tenants (회사정보 전체를 보낸다) */
export type CompanyInfoRequest = CompanyInfo;
