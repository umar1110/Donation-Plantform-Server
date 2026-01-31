import { z } from "zod";
import { createDonationSchema } from "./donations_schema";
import { PoolClient } from "pg";
import { ApiError } from "../../utils/apiError";
import { insertDonor, selectDonorById } from "../donors/donors_repository";
import { insertDonation } from "./donations_repository";
import { createDonorSchema } from "../donors/donors_schema";

export class DonationsService {
  async createDonation(
    client: PoolClient,
    donationData: z.infer<typeof createDonationSchema>,
  ) {
    // Check for donor
    if (!donationData.donor_id) {
      throw new ApiError(400, "Donor ID is required to create a donation");
    }
    const donor = await selectDonorById(client, donationData.donor_id);
    if (!donor) {
      throw new ApiError(404, "Donor not found, Please add donor first.");
    }

    // Insert donation logic goes here
    const donation = await insertDonation(client, donationData);
    return donation;
  }

  async createDonorAndDonation(
    client: PoolClient,
    donorData: z.infer<typeof createDonorSchema>,
    donationData: z.infer<typeof createDonationSchema>,
  ) {
    // Insert donor logic
    const donor = await insertDonor(client, donorData);
    donationData.donor_id = donor.id;

    // Insert donation logic
    const donation = await insertDonation(client, donationData);
    return { donor, donation };
  }
}
