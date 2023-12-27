import { APIEmbed, ChannelType, OverwriteType } from 'discord.js';
import { IPermissions } from './guardian';

export type IChannelType = Exclude<
    ChannelType,
    | ChannelType.DM
    | ChannelType.GroupDM
    | ChannelType.PrivateThread
    | ChannelType.PublicThread
    | ChannelType.AnnouncementThread
    | ChannelType.GuildMedia
    | ChannelType.GuildForum
    | ChannelType.GuildDirectory
    | ChannelType.GuildStageVoice
>;

export interface IOverwrite {
    id: string;
    type: OverwriteType;
    permissions: IPermissions;
}

export interface IFile {
    name: string;
    attachment: string;
}

export interface IMessage {
    content: string;
    createdTimestamp: number;
    username: string;
    avatarURL: string;
    pinned: boolean;
    files: IFile[];
    embeds: APIEmbed[];
}

export interface IChannel {
    deletedTimestamp?: number;
    id: string;
    isDeleted: boolean;
    name: string;
    type: IChannelType;
    parentId?: string;
    topic?: string;
    position: number;
    isNSFW?: boolean;
    bitrate?: number;
    messages?: IMessage[];
    userLimit?: number;
    permissions: IOverwrite[];
    rateLimitPerUser?: number;
}
