import { IPermissions } from './guardian';

export interface IChannelOverwrite {
    id: string;
    permissions: IPermissions;
}

export interface IRole {
    deletedTimestamp?: number;
    isDeleted: boolean;
    id: string;
    name: string;
    color: number;
    position: number;
    permissions: string;
    members?: string[];
    icon?: string;
    mentionable: boolean;
    hoist: boolean;
    channelOverwrites: IChannelOverwrite[];
}
