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
  status?: string;
  type?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IDonationWithDonor extends IDonation {
  donor_first_name?: string | null;
  donor_last_name?: string | null;
  donor_email?: string | null;
}

export interface IDonationsQueryFilters {
  org_id: string;
  page: number;
  limit: number;
  q?: string;
  start_date?: Date;
  end_date?: Date;
  type?: string;
  payment_method?: string;
  status?: string;
  anonymous_only?: boolean;
  sort_by: string;
  sort_order: string;
}

export interface IPaginatedDonations {
  donations: IDonationWithDonor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export type IDonationCreate = Omit<IDonation, "id" | "created_at" | "updated_at">;