export interface User {
  _id: string;
  user_wallet_address: string;
  username: string;
  createdAt: string;
  uploads: number;
  votes: number;
  refer_code: string;
  totalCastedVotesCount: number;
  totalUploadsCount: number;
  majorityVotes: number;
  majorityUploads: number;
  totalVotesReceived: number;
  mintedCoins: number;
  bio?: string;
  profile_pic?: string;
}
