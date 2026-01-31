

import { Request, Response } from "express";
import { createDonationSchema } from "./donations_schema";
import { DonationsService } from "./donations_services";

const donationsService = new DonationsService();

export const addNewDonationController = async (
  req: Request,
  res: Response,
) => {
  try {
    const validated = createDonationSchema.parse(req.body);
    const donation = await donationsService.createDonation(validated);
    return res.status(201).json({
      success: true,
      message: "Donation created successfully",
      data: donation,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create donation",
      errors: error.errors || [],
    });
  }
};
