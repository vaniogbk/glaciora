import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes';
import { catalogueRouter } from '../modules/catalogue/catalogue.routes';
import { cartRouter } from '../modules/cart/cart.routes';
import { checkoutRouter } from '../modules/checkout/checkout.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { accountRouter } from '../modules/account/account.routes';
import { adminRouter } from '../modules/admin/admin.routes';
import { mediaRouter } from '../modules/media/media.routes';

export const apiRouter = Router();

apiRouter.use('/media', mediaRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/catalogue', catalogueRouter);
apiRouter.use('/cart', cartRouter);
apiRouter.use('/checkout', checkoutRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/account', accountRouter);
apiRouter.use('/admin', adminRouter);
