export interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
}

export interface JwtRefreshPayload {
  userId: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}
