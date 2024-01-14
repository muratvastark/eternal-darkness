export interface IStaffExcuse {
    activity: boolean;
    createdTimestamp: number;
    finishTimestamp?: number;
    staffId: string;
    adminId: string;
    reason: string;
}
