import { z } from "zod";
import { insertDonor } from "../donors/donors_repository";
import { createDonorSchema } from "../donors/donors_schema";
import { insertDonation } from "./donations_repository";
import { createDonationSchema } from "./donations_schema";

export class DonationsService {
  async createDonation(donationData: z.infer<typeof createDonationSchema>) {
    // Insert donation logic goes here
    const donation = await insertDonation(donationData);
    return donation;
  }

  async createDonorAndDonation(
    donorData: z.infer<typeof createDonorSchema>,
    donationData: z.infer<typeof createDonationSchema>,
  ) {
    // Insert donor logic
    const donor = await insertDonor(donorData);
    donationData.donor_id = donor.id;

    // Insert donation logic
    const donation = await insertDonation(donationData);
    return { donor, donation };
  }
}
