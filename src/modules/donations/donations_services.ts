import { z } from "zod";
import {
  insertDonorProfile,
  linkDonorToOrg,
} from "../donors/donors_repository";
import { createDonorSchema } from "../donors/donors_schema";
import { insertDonation } from "./donations_repository";
import { createDonationSchema } from "./donations_schema";
import { supabase } from "../../config/supabase";
import { IDonationCreate } from "./donations_types";
import { IDonorCreate } from "../donors/donots_types";

export class DonationsService {
  async createDonationForAnonymousDonor(donationData: IDonationCreate) {
    if (!donationData.is_anonymous) {
      throw new Error("Donation is not marked as anonymous");
    }
    // Insert donation logic goes here
    const donation = await insertDonation(donationData);
    return donation;
  }

  async createDonationForDonor(donationData: IDonationCreate, donorId: string) {
    // 1- Check donor with donorId
    const donor = await supabase
      .from("donor_profiles")
      .select("*")
      .eq("id", donorId)
      .single();
    if (donor.error || !donor.data) {
      throw new Error("Donor not found");
    }
    // 2- Update total_donation of donor in donor profile
    const donationAmount = donationData?.is_amount_split
      ? donationData.tax_deductible_amount
      : donationData.amount;

    await supabase
      .from("donor_profiles")
      .update({
        total_donations: (donor.data.total_donations || 0) + donationAmount,
        donation_count: (donor.data.donation_count || 0) + 1,
      })
      .eq("id", donorId);

    //   Update total_donations and donation_count in orgs_donors table
    const orgDonorLink = await supabase
      .from("orgs_donors")
      .select("*")
      .eq("donor_id", donorId)
      .eq("org_id", donationData.org_id)
      .single();
    if (orgDonorLink.data) {
      await supabase
        .from("orgs_donors")
        .update({
          total_donations:
            (orgDonorLink.data.total_donations || 0) + donationAmount,
          donation_count: (orgDonorLink.data.donation_count || 0) + 1,
        })
        .eq("donor_id", donorId)
        .eq("org_id", donationData.org_id);
    }

    // 3- Insert donation
    donationData.donor_id = donorId;
    const donation = await insertDonation(donationData);
    return donation;
  }

  async createDonorAndDonation(
    donorData: IDonorCreate,
    donationData: IDonationCreate,
    org_id: string,
  ) {
    // Check if donor with same email exists in the organization
    const existingDonor = await supabase
      .from("donor_profiles")
      .select("*")
      .eq("email", donorData.email)
      .eq("org_id", org_id)
      .single();

    if (existingDonor.data) {
      throw new Error(
        "Donor with this email already exists in the organization",
      );
    }

    // 1. Insert donor profile
    const donor = await insertDonorProfile(donorData);
    // 2. Link donor to org
    await linkDonorToOrg(org_id, donor.id);
    // 3. Insert donation
    donationData.donor_id = donor.id;
    const donation = await this.createDonationForDonor(donationData, donor.id);
    return { donor, donation };
  }
}
