import { SetMetadata } from '@nestjs/common';

export const THROTTLE_LIMIT_KEY = 'throttle_limit';
export const THROTTLE_TTL_KEY = 'throttle_ttl';

/**
 * Custom throttle decorator to set specific rate limits for routes
 * @param limit - Maximum number of requests
 * @param ttl - Time window in milliseconds
 */
export const Throttle = (limit: number, ttl: number) => {
  return (
    target: object,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    if (propertyKey && descriptor) {
      SetMetadata(THROTTLE_LIMIT_KEY, limit)(target, propertyKey, descriptor);
      SetMetadata(THROTTLE_TTL_KEY, ttl)(target, propertyKey, descriptor);
    }
  };
};
