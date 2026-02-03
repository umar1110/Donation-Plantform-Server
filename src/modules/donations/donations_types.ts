import { DonationSourceType } from "./donations.constants";

export interface IDonation {
  id: string;
  org_id: string;
  donor_id?: string | null;
  amount: number;
  is_amount_split: boolean;
  tax_deductible_amount: number;
  tax_non_deductible_amount: number;
  currency: string;
  payment_method: string;
  note?: string | null;
  message?: string | null;
  is_anonymous: boolean;
  abn?: string | null;
  donation_by: DonationSourceType;
  donation_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export type IDonationCreate = Omit<IDonation, "id" | "created_at" | "updated_at">;