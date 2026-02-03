import { Request, Response } from "express";
import { searchDonorsQuerySchema } from "./donors_schema";
import { searchDonorsByOrg } from "./donors_repository";
import { ApiError } from "../../utils/apiError";

/**
 * Search donors by email, first_name, or last_name
 * GET /donors/search?q=searchTerm&limit=10
 */
export const searchDonorsController = async (req: Request, res: Response) => {
  const orgId = req.org?.id;
  if (!orgId) {
    throw new ApiError(400, "Organization context required");
  }

  const { q, limit } = searchDonorsQuerySchema.parse(req.query);

  const donors = await searchDonorsByOrg(orgId, q, limit);

  return res.status(200).json({
    success: true,
    message: "Donors retrieved successfully",
    data: donors,
  });
};
