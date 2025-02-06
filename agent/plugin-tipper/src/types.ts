export interface WalletRecord {
    id?: number;
    userId: string; // twitter id
    username: string; // twitter handle
    address: string;
    walletId: string;
    seed: string;
};

export enum UserState {
    hasNothing,
    hasAddress,
    hasBalance
};