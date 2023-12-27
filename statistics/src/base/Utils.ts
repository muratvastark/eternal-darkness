import { readdirSync } from 'fs';
import { resolve } from 'path';

import { Client } from '@/base';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from 'discord.js';
import { ICommand } from '@/types';

export class Utils {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    getRandomColor() {
        return Math.floor(Math.random() * (0xffffff + 1));
    }

    timesUpButton() {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'timefinished',
                    disabled: true,
                    emoji: { name: '⏱️' },
                    style: ButtonStyle.Danger,
                }),
            ],
        });
    }

    paginationButtons(page: number, totalData: number) {
        return new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'first',
                    emoji: {
                        id: '1070037431690211359',
                    },
                    style: ButtonStyle.Secondary,
                    disabled: page === 1,
                }),
                new ButtonBuilder({
                    custom_id: 'previous',
                    emoji: {
                        id: '1061272577332498442',
                    },
                    style: ButtonStyle.Secondary,
                    disabled: page === 1,
                }),
                new ButtonBuilder({
                    custom_id: 'count',
                    label: `${page}/${totalData}`,
                    style: ButtonStyle.Secondary,
                    disabled: true,
                }),
                new ButtonBuilder({
                    custom_id: 'next',
                    emoji: {
                        id: '1061272499670745229',
                    },
                    style: ButtonStyle.Secondary,
                    disabled: totalData === page,
                }),
                new ButtonBuilder({
                    custom_id: 'last',
                    emoji: {
                        id: '1070037622820458617',
                    },
                    style: ButtonStyle.Secondary,
                    disabled: page === totalData,
                }),
            ],
        });
    }

    splitMessage(text: string, { maxLength = 2000, char = '\n', prepend = '', append = '' } = {}) {
        if (text.length <= maxLength) return [append + text + prepend];
        const splitText = text.split(char);
        const messages = [];
        let msg = '';
        for (const chunk of splitText) {
            if (msg && (msg + char + chunk + append).length > maxLength) {
                messages.push(msg + append);
                msg = prepend;
            }
            msg += (msg && msg !== prepend ? char : '') + chunk;
        }
        return messages.concat(msg).filter((m) => m);
    }

    numberToString(seconds: number, short: boolean = false) {
        if (1000 >= seconds) {
            if (short) return "0sn";
            else return "0 saniye";
        }

        seconds = seconds / 1000;
        var d = Math.floor(seconds / (3600 * 24));
        var h = Math.floor((seconds % (3600 * 24)) / 3600);
        var m = Math.floor((seconds % 3600) / 60);
        var s = Math.floor(seconds % 60);

        if (short) {
            if (d > 0) return d + 'g';
            if (h > 0) return h + 's';
            if (m > 0) return m + 'd';
            if (s > 0) return s + 'sn';
        }

        const dDisplay = d > 0 ? d + ' gün ' : '';
        const hDisplay = h > 0 ? h + ' saat ' : '';
        const mDisplay = d === 0 && m > 0 ? m + ' dakika ' : '';
        const sDisplay = h === 0 && s > 0 ? s + ' saniye' : '';
        return dDisplay + hDisplay + mDisplay + sDisplay;
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

    async loadCommands() {
        const files = readdirSync(resolve(__dirname, '..', 'commands'));
        files.forEach(async (fileName) => {
            const commandFile = await import(resolve(__dirname, '..', 'commands', fileName));
            delete require.cache[commandFile];

            const command = commandFile.default as ICommand;
            if (!command.usages.length || !command.execute || command.disabled) return;

            this.client.commands.set(command.usages[0], command);
        });
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
