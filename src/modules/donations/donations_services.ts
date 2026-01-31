import { getClient } from "../../config/database";
import {
  insertDonorProfile,
  linkDonorToOrg,
  getDonorById,
  findDonorByEmailAndOrg,
  updateDonorTotals,
  updateOrgsDonorsTotals,
} from "../donors/donors_repository";
import { insertDonation } from "./donations_repository";
import type { IDonation, IDonationCreate } from "./donations_types";
import type { IDonorCreate } from "../donors/donors_types";

export class DonationsService {
  async createDonationForAnonymousDonor(
    donationData: IDonationCreate
  ): Promise<IDonation> {
    if (!donationData.is_anonymous) {
      throw new Error("Donation is not marked as anonymous");
    }
    const client = await getClient();
    try {
      await client.query("BEGIN");
      const donation = await insertDonation(donationData, client);
      await client.query("COMMIT");
      return donation;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async createDonationForDonor(
    donationData: IDonationCreate,
    donorId: string
  ): Promise<IDonation> {
    const donationAmount = donationData.is_amount_split
      ? (donationData.tax_deductible_amount ?? 0)
      : donationData.amount;

    const client = await getClient();
    try {
      await client.query("BEGIN");

      const donor = await getDonorById(donorId, client);
      if (!donor) {
        throw new Error("Donor not found");
      }

      await updateDonorTotals(donorId, donationAmount, client);
      await updateOrgsDonorsTotals(
        donationData.org_id,
        donorId,
        donationAmount,
        client
      );

      const donation = await insertDonation(
        { ...donationData, donor_id: donorId },
        client
      );
      await client.query("COMMIT");
      return donation;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async createDonorAndDonation(
    donorData: IDonorCreate,
    donationData: IDonationCreate,
    org_id: string
  ): Promise<{ donor: Record<string, unknown>; donation: IDonation }> {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      const existingDonor = await findDonorByEmailAndOrg(
        donorData.email,
        org_id,
        client
      );
      if (existingDonor) {
        throw new Error(
          "Donor with this email already exists in the organization"
        );
      }

      const donor = await insertDonorProfile(donorData, client);
      await linkDonorToOrg(org_id, donor.id, client);

      const donationAmount = donationData.is_amount_split
        ? (donationData.tax_deductible_amount ?? 0)
        : donationData.amount;

      await updateDonorTotals(donor.id, donationAmount, client);
      await updateOrgsDonorsTotals(org_id, donor.id, donationAmount, client);

      const donation = await insertDonation(
        { ...donationData, donor_id: donor.id },
        client
      );

      await client.query("COMMIT");
      return { donor, donation };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}
