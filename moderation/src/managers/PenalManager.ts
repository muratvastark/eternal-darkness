import { PenalModel } from '@/models';
import { IPenal } from '@/types';
import { EmbedBuilder, Guild, TextChannel, User, bold, codeBlock, inlineCode, time } from 'discord.js';

export class PenalManager {
    static reasonImage: RegExp =
        /((?:https?:\/\/)[a-z0-9]+(?:[-.][a-z0-9]+)*\.[a-z]{2,5}(?::[0-9]{1,5})?(?:\/[^ \n<>]*)\.(?:png|apng|jpg|gif))/g;

    static getImage(str: string) {
        const images = str.match(PenalManager.reasonImage);
        return images ? images[0] : undefined;
    }

    static sendLog({
        guild,
        channelName,
        user,
        penal,
        admin,
        type,
        attachment,
    }: {
        guild: Guild;
        channelName: string;
        penal: IPenal;
        user: User;
        admin: User;
        attachment?: string;
        type: string;
    }) {
        const logChannel = guild.channels.cache.find((c) => c.name === channelName) as TextChannel;
        if (!logChannel) return;

        const image = PenalManager.getImage(penal.reason);
        logChannel.send({
            embeds: [
                new EmbedBuilder({
                    description: `${user.displayName} adlı kullanıcı ${admin.displayName} tarafından sunucudan ${bold(
                        type,
                    )} cezası aldı.`,
                    fields: [
                        {
                            name: 'Ceza Yiyen Kullanıcı',
                            value: `${user} (${inlineCode(user.id)})`,
                            inline: true,
                        },
                        {
                            name: 'Cezalandıran Yetkili',
                            value: `${admin} (${inlineCode(admin.id)})`,
                            inline: true,
                        },
                        {
                            name: 'Başlangıç',
                            value: time(Math.floor(penal.createdTimestamp / 1000), 'F'),
                            inline: false,
                        },
                        {
                            name: 'Bitiş',
                            value: time(Math.floor(penal.finishTimestamp / 1000), 'F'),
                            inline: false,
                        },
                        {
                            name: 'Ceza Sebebi',
                            value: codeBlock('ansi', `[2;31m${penal.reason}`),
                        },
                    ].filter(Boolean),
                    image: {
                        url: attachment ? attachment : (image as string),
                    },
                    footer: {
                        text: `Ceza ID: ${penal.id}`,
                    },
                }),
            ],
        });
    }

    static async createPenal(newPenal: IPenal) {
        const newID = (await PenalModel.countDocuments()) + 1;
        return await PenalModel.create({
            id: newID,
            ...newPenal,
        });
    }
}
