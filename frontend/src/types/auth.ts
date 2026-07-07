export type UserRole = "administrator" | "member";

export type CurrentUser = {
  id: string;
  username: string;
  role: UserRole;
  isDisabled: boolean;
};

export type SessionInfo = {
  expiresAt: string;
};

export type SessionUserResponse = {
  user: CurrentUser;
  session: SessionInfo;
};

export type LoginRequest = {
  username: string;
  password: string;
};
