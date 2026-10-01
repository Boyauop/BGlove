import 'dotenv/config';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  demoMode: process.env.DEMO_MODE === 'true',
  trialDays: Number(process.env.TRIAL_DAYS || 7),
  subscriptionPrice: Number(process.env.SUBSCRIPTION_PRICE_USD || 2)
};

if (env.nodeEnv === 'production' && env.jwtSecret === 'development-only-change-me') {
  throw new Error('JWT_SECRET must be configured in production');
}

export default env;