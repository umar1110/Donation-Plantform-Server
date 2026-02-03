/** Snapshot data saved when a donation receipt is issued (for tax/audit) */
export interface IReceiptCreate {
  org_id: string;
  donation_id: string;
  receipt_number: string;
  donor_name: string;
  donor_email: string | null;
  amount: number;
  currency: string;
  is_amount_split: boolean;
  tax_deductible_amount: number;
  tax_non_deductible_amount: number;
  donation_date: Date;
  org_name: string;
  org_abn: string | null;
  org_address: string;
  retention_until: Date;
  issued_by_admin_id?: string | null;
}

/** Full receipt record from database */
export interface IReceipt extends IReceiptCreate {
  id: string;
  email_sent: boolean;
  email_sent_at: Date | null;
  status: "issued" | "void" | "amended";
  created_at: Date;
  updated_at: Date;
}
