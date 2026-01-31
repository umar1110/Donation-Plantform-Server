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
  message?: string | null;
  is_anonymous: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export type IDonationCreate = Omit<IDonation, "id" | "created_at" | "updated_at">;