import { Request, Response } from "express";
import { createDonationSchema } from "./donations_schema";
import { DonationsService } from "./donations_services";
import { createDonorSchema } from "../donors/donors_schema";
import { IDonationCreate } from "./donations_types";
import { IDonorCreate } from "../donors/donots_types";

const donationsService = new DonationsService();

// That is for organization admin to add a new custom donation
export const addNewDonationController = async (req: Request, res: Response) => {
  //  Adusting org_id
  if (req?.body?.donor) {
    req.body.donor.org_id = req.org?.id;
  }
  const validated = createDonationSchema.parse({
    ...(req.body || {}),
    org_id: req.org?.id,
  });

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
  };

  if (validated.donor_id) {
    const donation = await donationsService.createDonationForDonor(
      donationData,
      validated.donor_id,
    );
    return res.status(201).json({
      success: true,
      message: "Donation created successfully",
      data: donation,
    });
  } else {
    const validateDonor = createDonorSchema.parse({
      ...validated.donor,
      org_id: req.org?.id,
    });

    const donorData: IDonorCreate = {
      first_name: validateDonor.first_name,
      last_name: validateDonor.last_name,
      email: validateDonor.email,
      phone: validateDonor.phone,
      address: validateDonor.address,
      org_id: validateDonor.org_id,
      auth_user_id: validateDonor.auth_user_id || null,
    };
    const result = await donationsService.createDonorAndDonation(
      donorData,
      donationData,
      req.org?.id!,
    );

    return res.status(201).json({
      success: true,
      message: "Donor and Donation created successfully",
      data: result,
    });
  }
};
