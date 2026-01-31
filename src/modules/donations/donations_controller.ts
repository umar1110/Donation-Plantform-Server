import { Request, Response } from "express";
import { createDonationSchema } from "./donations_schema";
import { DonationsService } from "./donations_services";
import { createDonorSchema } from "../donors/donors_schema";

const donationsService = new DonationsService();

export const addNewDonationController = async (req: Request, res: Response) => {
  //  Adusting org_id
  if (req?.body?.donor) {
    req.body.donor.org_id = req.org?.id;
  }
  const validated = createDonationSchema.parse({
    ...(req.body || {}),
    org_id: req.org?.id,
  });

  // If donor_id is provided or is_anonymous is true, create donation only
  if (validated.donor_id || validated.is_anonymous) {
    const donation = await donationsService.createDonation(validated);
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
    const result = await donationsService.createDonorAndDonation(
      validateDonor,
      validated,
    );
    return res.status(201).json({
      success: true,
      message: "Donor and Donation created successfully",
      data: result,
    });
  }
};
