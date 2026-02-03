import { Request, Response } from "express";
import { createDonationSchema, getDonationsQuerySchema } from "./donations_schema";
import { DonationsService } from "./donations_services";
import { createDonorSchema } from "../donors/donors_schema";
import { getDonationsByOrg } from "./donations_repository";
import type { IDonationCreate } from "./donations_types";
import type { IDonorCreate } from "../donors/donors_types";

const donationsService = new DonationsService();

/**
 * Get donations with pagination and filters
 * GET /donations?page=1&limit=20&q=john&start_date=2025-01-01&end_date=2025-12-31&type=one-time&payment_method=cash&status=completed&anonymous_only=true
 */
export const getDonationsController = async (req: Request, res: Response) => {
  const orgId = req.org?.id;
  if (!orgId) {
    return res.status(400).json({
      success: false,
      message: "Organization context required",
    });
  }

  const validated = getDonationsQuerySchema.parse(req.query);

  const result = await getDonationsByOrg({
    org_id: orgId,
    page: validated.page,
    limit: validated.limit,
    q: validated.q,
    start_date: validated.start_date,
    end_date: validated.end_date,
    type: validated.type,
    payment_method: validated.payment_method,
    status: validated.status,
    anonymous_only: validated.anonymous_only,
    sort_by: validated.sort_by,
    sort_order: validated.sort_order,
  });

  return res.status(200).json({
    success: true,
    message: "Donations retrieved successfully",
    data: result,
  });
};

export const addNewDonationController = async (
  req: Request,
  res: Response
) => {
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

  const validated = createDonationSchema.parse(payload);

  if (validated.is_anonymous) {
    const donation =
      await donationsService.createDonationForAnonymousDonor(validated);
    return res.status(201).json({
      success: true,
      message: "Anonymous donation created successfully",
      data: donation,
    });
  }

  const donationData: IDonationCreate = {
    amount: validated.amount,
    is_amount_split: validated.is_amount_split,
    tax_deductible_amount: validated.tax_deductible_amount,
    tax_non_deductible_amount: validated.tax_non_deductible_amount,
    currency: validated.currency,
    payment_method: validated.payment_method,
    message: validated.message,
    is_anonymous: validated.is_anonymous,
    org_id: validated.org_id,
    donation_by: validated.donation_by,
    donation_date: validated.donation_date,
  };

  if (validated.donor_id) {
    const donation = await donationsService.createDonationForDonor(
      donationData,
      validated.donor_id
    );
    return res.status(201).json({
      success: true,
      message: "Donation created successfully",
      data: donation,
    });
  }

  const validateDonor = createDonorSchema.parse({
    ...validated.donor,
    org_id: orgId,
  });

  const donorData: IDonorCreate = {
    first_name: validateDonor.first_name,
    last_name: validateDonor.last_name,
    email: validateDonor.email,
    phone: validateDonor.phone,
    address: validateDonor.address,
    org_id: validateDonor.org_id,
    auth_user_id: validateDonor.auth_user_id ?? null,
  };

  const result = await donationsService.createDonorAndDonation(
    donorData,
    donationData,
    orgId
  );

  const message = result.wasLinked
    ? "Existing donor linked to your organization and donation created successfully"
    : "Donor and Donation created successfully";

  return res.status(201).json({
    success: true,
    message,
    data: result,
  });
};
