import { Client } from '@/base';
import { ClientEvents, Message, User } from 'discord.js';

export type EventKeys = keyof ClientEvents;

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

export interface IInvite {
    code: string;
    uses: number;
    inviter: User;
}

export interface IVoiceBased {
    updateAt: number;
    channelId: string;
}
