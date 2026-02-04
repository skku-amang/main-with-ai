export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // expiration time in seconds
}

export interface AuthResponse extends AuthTokens {
  user: {
    id: number;
    email: string;
    name: string;
    nickname: string;
    isAdmin: boolean;
  };
}
