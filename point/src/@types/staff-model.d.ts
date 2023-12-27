import { Document, Types } from 'mongoose';

export interface ITask {
    type: string;
    currentCount: number;
    requiredCount: number;
    compeleted: boolean;
}

export interface IOldRole {
    timestamp: number;
    roles: string[];
}

export interface IStaffTake {
    timestamp: number;
    id: string;
}

export interface IStaff {
    id: string;
    staffStartTime: number;
    lastWeekPoints: number;
    oldRoles: IOldRole[];
    allPoints: number;
    totalPoints: number;
    roleStarted: number;
    tasks: ITask[];
    registerPoints: number;
    otherPoints: number;
    messagePoints: number;
    responsibilityPoints: number;
    publicPoints: number;
    bonusPoints: number;
    invitedUsers: string[];
    staffTakes: IStaffTake[];
    hasOrientation: boolean;
    problemResolvePoints: number;
    orientationPoints: number;
}

export type IStaffDocument = Document<unknown, {}, IStaff> &
    IStaff & {
        _id: Types.ObjectId;
    };
