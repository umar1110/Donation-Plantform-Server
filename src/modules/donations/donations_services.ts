import { PoolClient } from "pg";
import { getClient } from "../../config/database";
import {
  findDonorByEmail,
  getDonorById,
  insertDonorProfile,
  isDonorLinkedToOrg,
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
  donation: IDonation,
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

  // donation_date comes from database (either provided or NOW())
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

  /** New donor + donation in one go: create donor or link existing, then donation + receipt */
  async createDonorAndDonation(
    donorData: IDonorCreate,
    donationData: IDonationCreate,
    org_id: string
  ): Promise<{ donor: Record<string, unknown>; donation: IDonation; wasLinked: boolean }> {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      let donor: Record<string, unknown>;
      let wasLinked = false;

      // Check if donor exists globally by email
      const existingDonor = await findDonorByEmail(donorData.email, client);

      if (existingDonor) {
        // Donor exists globally - check if already linked to this org
        const isLinked = await isDonorLinkedToOrg(
          existingDonor.id as string,
          org_id,
          client
        );

        if (isLinked) {
          throw new Error(
            "Donor with this email already exists in your organization"
          );
        }

        // Link existing donor to this org
        await linkDonorToOrg(org_id, existingDonor.id as string, client);
        donor = existingDonor;
        wasLinked = true;
      } else {
        // Create new donor and link to org
        donor = await insertDonorProfile(donorData, client);
        await linkDonorToOrg(org_id, donor.id as string, client);
      }

      const donationAmount = donationData.is_amount_split
        ? (donationData.tax_deductible_amount ?? 0)
        : donationData.amount;

      await updateDonorTotals(donor.id as string, donationAmount, client);
      await updateOrgsDonorsTotals(org_id, donor.id as string, donationAmount, client);

      const donation = await insertDonation(
        { ...donationData, donor_id: donor.id as string },
        client
      );
      await createReceiptForDonation(
        donation,
        org_id,
        donor as { first_name: string; last_name: string; email?: string },
        client
      );
      await client.query("COMMIT");
      return { donor, donation, wasLinked };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}
