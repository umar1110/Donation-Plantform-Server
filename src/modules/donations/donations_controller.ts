import { Request, Response } from "express";
import { createDonationSchema } from "./donations_schema";
import { DonationsService } from "./donations_services";
import { createDonorSchema } from "../donors/donors_schema";

const donationsService = new DonationsService();

export const addNewDonationController = async (req: Request, res: Response) => {
  const validated = createDonationSchema.parse(req.body);

  if (validated.donor_id) {
    const donation = await donationsService.createDonation(
      req.app.locals.dbClient,
      validated,
    );
    return res.status(201).json({
      success: true,
      message: "Donation created successfully",
      data: donation,
    });
  } else {
    const validateDonor = createDonorSchema.parse(validated.donor);
    const result = await donationsService.createDonorAndDonation(
      req.app.locals.dbClient,
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
