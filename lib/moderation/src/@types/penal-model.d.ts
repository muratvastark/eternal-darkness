import { PenalFlags } from '@/enums';

export interface IPenal {
    id?: number;
    reason: string;
    type: PenalFlags;
    createdTimestamp: number;
    finishTimestamp?: number;
    user: string;
    admin: string;
    activity?: boolean;
    visible?: boolean;
    remover?: string;
    removeTimestamp?: number;
    removeReason?: string;
    roles?: string[];
}
