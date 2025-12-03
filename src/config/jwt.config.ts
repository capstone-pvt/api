import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
  accessTokenExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m',
  refreshTokenExpirationShort: process.env.JWT_REFRESH_TOKEN_EXPIRATION_SHORT || '7d',
  refreshTokenExpirationLong: process.env.JWT_REFRESH_TOKEN_EXPIRATION_LONG || '30d',
}));
