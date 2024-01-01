export interface IGiveaway {
    messageId: string;
    channelId: string;
    endTimestamp: number;
    winnerCount: number;
    joiners: string[];
}
