import { Client } from '@/base';
import { Collection, Attachment, ClientEvents, Message, User } from 'discord.js';

export interface IStreamCache {
    ownerId: string;
    channelId: string;
}

export type EventKeys = keyof ClientEvents;

export interface ISnipe {
    id: string;
    content?: string;
    author: User;
    attachments?: Collection<string, Attachment>;
    timestamp: number;
}

export interface ILimit {
    count: number;
    lastUsage: number;
}

export interface IEvent<K extends EventKeys> {
    name: EventKeys;
    execute: (client: Client, ...args: ClientEvents[K]) => Promise<void> | void;
}

export interface ICommand {
    usages: string[];
    description: string;
    usableChannels?: string[];
    usableAuth?: string[];
    disabled?: boolean;
    execute: (commandArgs: CommandArgs) => Promise<unknown> | unknown;
}

export interface CommandArgs {
    client: Client;
    message: Message;
    args: string[];
}

export interface IMention {
    user: string;
    timestamp: number;
}

export interface IAFK {
    timestamp: number;
    reason: string;
    mentions: IMention[];
}
