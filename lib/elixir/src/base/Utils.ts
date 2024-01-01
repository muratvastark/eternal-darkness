import { readdirSync } from 'fs';
import { resolve } from 'path';

import { Client } from '@/base';
import { Message } from 'discord.js';

export class Utils {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    getRandomColor() {
        return Math.floor(Math.random() * (0xffffff + 1));
    }

    sendTimedMessage(message: Message, content: string, time = 1000 * 5) {
        message
            .reply({ content })
            .then((msg) => {
                setTimeout(() => msg.delete(), time);
            })
            .catch(() => undefined);

        return message;
    }

    async loadEvents() {
        const files = readdirSync(resolve(__dirname, '..', 'events'));
        files.forEach(async (fileName) => {
            const eventFile = await import(resolve(__dirname, '..', 'events', fileName));
            delete require.cache[eventFile];

            const event = eventFile.default;
            this.client.on(event.name, (...args: unknown[]) => event.execute(this.client, ...args));
        });
    }
}
