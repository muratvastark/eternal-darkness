import { Client } from '@/base';
import { ClientEvents, Message, PermissionsString } from 'discord.js';

export type IPermissions = {
    [key in PermissionsString]: boolean | null;
};

export interface ILimit {
    count: number;
    lastDate: number;
}

export type EventKeys = keyof ClientEvents;

export interface IEvent<K extends EventKeys> {
    name: EventKeys;
    execute: (client: Client, ...args: ClientEvents[K]) => Promise<any> | any;
}

export interface ICommand {
    usages: string[];
    execute: (commandArgs: CommandArgs) => Promise<unknown> | unknown;
}

export interface CommandArgs {
    client: Client;
    message: Message;
    args: string[];
}
