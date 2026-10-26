import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/auth';
import { adminProductsRouter } from './admin.products';
import { adminOrdersRouter } from './admin.orders';
import { adminSettingsRouter } from './admin.settings';
import { adminBankRouter } from './admin.bank';

/** Toutes les routes admin : session obligatoire + rôle ADMIN revérifié en base à chaque requête. */
export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);
adminRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

adminRouter.use('/products', adminProductsRouter);
adminRouter.use('/orders', adminOrdersRouter);
adminRouter.use('/bank-accounts', adminBankRouter);
adminRouter.use('/', adminSettingsRouter);
