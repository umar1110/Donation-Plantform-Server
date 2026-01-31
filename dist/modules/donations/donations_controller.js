"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNewDonationController = void 0;
const donations_schema_1 = require("./donations_schema");
const donations_services_1 = require("./donations_services");
const donors_schema_1 = require("../donors/donors_schema");
const donationsService = new donations_services_1.DonationsService();
const addNewDonationController = async (req, res) => {
    const orgId = req.org?.id;
    if (!orgId) {
        return res.status(400).json({
            success: false,
            message: "Organization context required",
        });
    }
    const body = req.body ?? {};
    const payload = {
        ...body,
        org_id: orgId,
        donor: body.donor
            ? { ...body.donor, org_id: orgId }
            : undefined,
    };
    const validated = donations_schema_1.createDonationSchema.parse(payload);
    if (validated.is_anonymous) {
        const donation = await donationsService.createDonationForAnonymousDonor(validated);
        return res.status(201).json({
            success: true,
            message: "Anonymous donation created successfully",
            data: donation,
        });
    }
    const donationData = {
        amount: validated.amount,
        is_amount_split: validated.is_amount_split,
        tax_deductible_amount: validated.tax_deductible_amount,
        tax_non_deductible_amount: validated.tax_non_deductible_amount,
        currency: validated.currency,
        payment_method: validated.payment_method,
        message: validated.message,
        is_anonymous: validated.is_anonymous,
        org_id: validated.org_id,
    };
    if (validated.donor_id) {
        const donation = await donationsService.createDonationForDonor(donationData, validated.donor_id);
        return res.status(201).json({
            success: true,
            message: "Donation created successfully",
            data: donation,
        });
    }
    const validateDonor = donors_schema_1.createDonorSchema.parse({
        ...validated.donor,
        org_id: orgId,
    });
    const donorData = {
        first_name: validateDonor.first_name,
        last_name: validateDonor.last_name,
        email: validateDonor.email,
        phone: validateDonor.phone,
        address: validateDonor.address,
        org_id: validateDonor.org_id,
        auth_user_id: validateDonor.auth_user_id ?? null,
    };
    const result = await donationsService.createDonorAndDonation(donorData, donationData, orgId);
    return res.status(201).json({
        success: true,
        message: "Donor and Donation created successfully",
        data: result,
    });
};
exports.addNewDonationController = addNewDonationController;
