import { defaultInstance } from "../defaultInstance";
import type { CompanyInfo, CompanyInfoRequest } from "@/types";

export const companyService = {
  get: () => defaultInstance.get<CompanyInfo>("/company").then((r) => r.data),

  /** 매니저 */
  update: (body: CompanyInfoRequest) => defaultInstance.patch<CompanyInfo>("/company", body).then((r) => r.data),
};
