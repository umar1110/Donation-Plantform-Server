import { PoolClient } from "pg";
import { getClient } from "../../config/database";
import {
  findDonorByEmailAndOrg,
  getDonorById,
  insertDonorProfile,
  linkDonorToOrg,
  updateDonorTotals,
  updateOrgsDonorsTotals,
} from "../donors/donors_repository";
import type { IDonorCreate } from "../donors/donors_types";
import { OrgsRepository } from "../orgs/orgs.repository";
import { getNextReceiptNumber, insertReceipt } from "../receipts/receipts_repository";
import { sendDonationReceiptEmail } from "../receipts/email-sender";
import { insertDonation } from "./donations_repository";
import type { IDonation, IDonationCreate } from "./donations_types";

const orgsRepository = new OrgsRepository();

/** Combines org address parts into one string for receipt */
function buildOrgAddress(org: {
  address?: string;
  city?: string;
  state_province?: string;
  country?: string;
}): string {
  const parts = [
    org.address,
    org.city,
    org.state_province,
    org.country,
  ].filter(Boolean);
  return parts.join(", ") || "";
}

/** Creates a receipt for a donation. Call inside same transaction as donation insert. */
async function createReceiptForDonation(
  donation: IDonation & { donation_date?: Date },
  orgId: string,
  donor: { first_name: string; last_name: string; email?: string } | null,
  client: PoolClient
): Promise<void> {
  const org = await orgsRepository.selectOrgsByIdWithClient(orgId, client);
  if (!org) throw new Error("Org not found for receipt");

  const receiptNumber = await getNextReceiptNumber(orgId, client);
  const donorName = donor
    ? `${donor.first_name} ${donor.last_name}`.trim() || "Unknown"
    : "Anonymous Donor";
  const donorEmail = donor?.email ?? null;

  const donationDate = donation.donation_date ?? new Date();
  const retentionUntil = new Date(donationDate);
  retentionUntil.setFullYear(retentionUntil.getFullYear() + 7); // ATO: keep 7 years

  const receipt = await insertReceipt(
    {
      org_id: orgId,
      donation_id: donation.id,
      receipt_number: receiptNumber,
      donor_name: donorName,
      donor_email: donorEmail,
      amount: donation.amount,
      currency: donation.currency,
      is_amount_split: donation.is_amount_split,
      tax_deductible_amount: donation.tax_deductible_amount,
      tax_non_deductible_amount: donation.tax_non_deductible_amount,
      donation_date: donationDate,
      org_name: org.name,
      org_abn: org.abn ?? org.ABN ?? null,
      org_address: buildOrgAddress(org),
      retention_until: retentionUntil,
      issued_by_admin_id: null,
    },
    client
  );

  // Send receipt email to donor (only if email is available)
  if (donorEmail) {
    console.log("Scheduling receipt email to: =========> ", donorEmail);
    // Send email asynchronously without blocking the transaction
    setImmediate(async () => {
      try {
        await sendDonationReceiptEmail({
          ...receipt,
          description_of_gift: "Cash / Money",
        });
        console.log("Receipt email sent to:", donorEmail);
      } catch (error) {
        console.error("Failed to send receipt email:", error);
        // Don't throw - email failure shouldn't affect donation creation
      }
    });
  }
}

export class DonationsService {
  /** Anonymous: no donor, receipt shows "Anonymous Donor" */
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
      await createReceiptForDonation(
        donation,
        donationData.org_id,
        null, // no donor info
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

  /** Existing donor: link donation by donor_id, create receipt with donor name */
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
      await createReceiptForDonation(
        donation,
        donationData.org_id,
        donor as { first_name: string; last_name: string; email?: string },
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

  /** New donor + donation in one go: create donor, link to org, then donation + receipt */
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
      await createReceiptForDonation(
        donation,
        org_id,
        donor as { first_name: string; last_name: string; email?: string },
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
