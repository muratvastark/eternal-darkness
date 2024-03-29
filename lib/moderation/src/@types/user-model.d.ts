import { NameFlags, RegisterFlags, RoleLogFlags, VoiceFlags } from '@/enums';

export interface IObject {
    [key: string]: number;
}

export interface IStat {
    [key: string]: IObject & { total: number };
}

export interface IVoiceLog {
    type: VoiceFlags;
    admin?: string;
    timestamp: number;
    channelId?: string;
    messageId?: string;
}

export interface IRegister {
    type: RegisterFlags;
    user: string;
}

export interface IRoleLog {
    type: RoleLogFlags;
    roles: string[];
    time: number;
    admin?: string;
}

interface IName {
    type: NameFlags;
    name: string;
    admin?: string;
    timestamp: number;
}

interface IWarn {
    reason: string;
    admin: string;
    timestamp: number;
}

export interface IUser {
    id: string;
    days: number;
    lastDayTime: number;
    voiceXP: number;
    messageXP: number;
    voiceLevel: number;
    messageLevel: number;
    chatFriends: IObject;
    voiceFriends: IObject;
    messages: IStat;
    streams: IStat;
    voices: IStat;
    cameras: IStat;
    names: IName[];
    roleLogs: IRoleLog[];
    voiceLogs: IVoiceLog[];
    registers: IRegister[];
    normalInvites: number;
    leaveInvites: number;
    inviter: string;
    warns: IWarn[];
}
