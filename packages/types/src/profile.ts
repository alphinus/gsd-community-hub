export interface DeveloperProfile {
  walletAddress: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  profileHash?: string;
  onChainPda?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProfileInput = {
  displayName: string;
  bio: string;
  githubUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
};

export type UpdateProfileInput = Partial<CreateProfileInput>;
