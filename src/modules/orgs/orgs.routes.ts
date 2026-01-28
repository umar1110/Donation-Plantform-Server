import express from 'express';

const router = express.Router();
import { registerNewOrgs } from './orgs.controller';

router.post('/orgss', registerNewOrgs);

export default router;
