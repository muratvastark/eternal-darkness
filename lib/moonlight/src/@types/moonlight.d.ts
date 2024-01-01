import { Client } from '@/base';
import { ClientEvents } from 'discord.js';

export {};

declare global {
    namespace Moonlight {
        export type EventKeys = keyof ClientEvents;

        export interface IEvent<K extends EventKeys> {
            name: EventKeys;
            execute: (client: Client, ...args: ClientEvents[K]) => Promise<void> | void;
        }
    }
}
