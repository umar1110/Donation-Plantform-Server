import { z } from "zod";
import { createDonationSchema } from "./donations_schema";
import { DonationsRepository } from "./donations_repository";

export class DonationsService {
  private donationsRepository: DonationsRepository;

  constructor() {
    this.donationsRepository = new DonationsRepository();
  }

  async createDonation(donationData: z.infer<typeof createDonationSchema>) {
    const client = await this.donationsRepository.getClient();
    let donationId: string;
    try {
      await client.query("BEGIN");
      donationId = await this.donationsRepository.insertDonation(client, donationData);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
    return { donationId };
  }
}
