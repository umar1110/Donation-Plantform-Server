import express from 'express';

const router = express.Router();
import { registerNewTenant } from './teanant.controller';

router.post('/tenants', registerNewTenant);

export default router;
