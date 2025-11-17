import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as paymentController from '../controllers/paymentController.js';

const router = Router();

router.get('/pricing', paymentController.getPricingInfo);

router.post('/create-checkout-session', authenticate, paymentController.createCheckoutSession);

router.post('/create-portal-session', authenticate, paymentController.createPortalSession);

router.post('/webhook', paymentController.handleWebhook);

export default router;
