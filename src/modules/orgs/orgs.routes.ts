import express from 'express';

const router = express.Router();
import { registerNewOrgs } from './orgs.controller';

router.post('/orgs', registerNewOrgs);

export default router;
