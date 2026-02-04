export interface JwtPayload {
  sub: number; // userId
  email: string;
  name: string;
  isAdmin: boolean;
}
