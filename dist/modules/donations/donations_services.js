"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonationsService = void 0;
const database_1 = require("../../config/database");
const donors_repository_1 = require("../donors/donors_repository");
const donations_repository_1 = require("./donations_repository");
const receipts_repository_1 = require("../receipts/receipts_repository");
const orgs_repository_1 = require("../orgs/orgs.repository");
const orgsRepository = new orgs_repository_1.OrgsRepository();
function buildOrgAddress(org) {
    const parts = [
        org.address,
        org.city,
        org.state_province,
        org.country,
    ].filter(Boolean);
    return parts.join(", ") || "";
}
async function createReceiptForDonation(donation, orgId, donor, client) {
    const org = await orgsRepository.selectOrgsByIdWithClient(orgId, client);
    if (!org) {
        throw new Error("Org not found for receipt");
    }
    const receiptNumber = await (0, receipts_repository_1.getNextReceiptNumber)(orgId, client);
    const donorName = donor
        ? `${donor.first_name} ${donor.last_name}`.trim() || "Unknown"
        : "Anonymous Donor";
    const donorEmail = donor?.email ?? null;
    const donationDate = donation.donation_date ?? new Date();
    const retentionUntil = new Date(donationDate);
    retentionUntil.setFullYear(retentionUntil.getFullYear() + 7);
    await (0, receipts_repository_1.insertReceipt)({
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
    }, client);
}
class DonationsService {
    async createDonationForAnonymousDonor(donationData) {
        if (!donationData.is_anonymous) {
            throw new Error("Donation is not marked as anonymous");
        }
        const client = await (0, database_1.getClient)();
        try {
            await client.query("BEGIN");
            const donation = await (0, donations_repository_1.insertDonation)(donationData, client);
            await createReceiptForDonation(donation, donationData.org_id, null, client);
            await client.query("COMMIT");
            return donation;
        }
        catch (err) {
            await client.query("ROLLBACK");
            throw err;
        }
        finally {
            client.release();
        }
    }
    async createDonationForDonor(donationData, donorId) {
        const donationAmount = donationData.is_amount_split
            ? (donationData.tax_deductible_amount ?? 0)
            : donationData.amount;
        const client = await (0, database_1.getClient)();
        try {
            await client.query("BEGIN");
            const donor = await (0, donors_repository_1.getDonorById)(donorId, client);
            if (!donor) {
                throw new Error("Donor not found");
            }
            await (0, donors_repository_1.updateDonorTotals)(donorId, donationAmount, client);
            await (0, donors_repository_1.updateOrgsDonorsTotals)(donationData.org_id, donorId, donationAmount, client);
            const donation = await (0, donations_repository_1.insertDonation)({ ...donationData, donor_id: donorId }, client);
            await createReceiptForDonation(donation, donationData.org_id, donor, client);
            await client.query("COMMIT");
            return donation;
        }
        catch (err) {
            await client.query("ROLLBACK");
            throw err;
        }
        finally {
            client.release();
        }
    }
    async createDonorAndDonation(donorData, donationData, org_id) {
        const client = await (0, database_1.getClient)();
        try {
            await client.query("BEGIN");
            const existingDonor = await (0, donors_repository_1.findDonorByEmailAndOrg)(donorData.email, org_id, client);
            if (existingDonor) {
                throw new Error("Donor with this email already exists in the organization");
            }
            const donor = await (0, donors_repository_1.insertDonorProfile)(donorData, client);
            await (0, donors_repository_1.linkDonorToOrg)(org_id, donor.id, client);
            const donationAmount = donationData.is_amount_split
                ? (donationData.tax_deductible_amount ?? 0)
                : donationData.amount;
            await (0, donors_repository_1.updateDonorTotals)(donor.id, donationAmount, client);
            await (0, donors_repository_1.updateOrgsDonorsTotals)(org_id, donor.id, donationAmount, client);
            const donation = await (0, donations_repository_1.insertDonation)({ ...donationData, donor_id: donor.id }, client);
            await createReceiptForDonation(donation, org_id, donor, client);
            await client.query("COMMIT");
            return { donor, donation };
        }
        catch (err) {
            await client.query("ROLLBACK");
            throw err;
        }
        finally {
            client.release();
        }
    }
}
exports.DonationsService = DonationsService;
