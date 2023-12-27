import { IChannel, IChannelOverwrite, IChannelType, ILimit, IMessage, IPermissions, IRole } from '@/types';
import {
    AttachmentBuilder,
    ChannelType,
    Client,
    Collection,
    EmbedBuilder,
    FetchMessagesOptions,
    GatewayIntentBits,
    Guild,
    GuildChannel,
    GuildChannelCreateOptions,
    GuildEditOptions,
    GuildPremiumTier,
    PermissionFlagsBits,
    PermissionOverwrites,
    Snowflake,
    TextChannel,
    Webhook,
    bold,
    inlineCode,
} from 'discord.js';
import { ChannelModel, RoleModel } from '@/models';
import nodeFetch from 'node-fetch';

export class GuardManager {
    static limits = new Collection<string, ILimit>();
    static guildSettings: GuildEditOptions = {
        name: '',
        banner: '',
        icon: '',
        splash: '',
        discoverySplash: '',
    };
    static closingPermissions = false;
    static readonly voiceBitrates = {
        [GuildPremiumTier.None]: 64000,
        [GuildPremiumTier.Tier1]: 128000,
        [GuildPremiumTier.Tier2]: 256000,
        [GuildPremiumTier.Tier3]: 384000,
    };
    static readonly dangerPerms = [
        PermissionFlagsBits.Administrator,
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.ManageGuild,
        PermissionFlagsBits.BanMembers,
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageWebhooks,
        PermissionFlagsBits.ManageNicknames,
        PermissionFlagsBits.ManageChannels,
    ];

    static getPermissions(permission: PermissionOverwrites) {
        const permissions = {};
        Object.keys(PermissionFlagsBits).forEach((p) => (permissions[p] = null));

        const deny = permission.deny;
        const allow = permission.allow;

        Object.keys(PermissionFlagsBits).forEach((p) => {
            if (allow.has(PermissionFlagsBits[p]) && !deny.has(PermissionFlagsBits[p])) {
                permissions[p] = true;
            } else if (!allow.has(PermissionFlagsBits[p]) && deny.has(PermissionFlagsBits[p])) {
                permissions[p] = false;
            }
        });

        return permissions as IPermissions;
    }

    static async getBackup(guild: Guild) {
        guild = await guild.fetch();

        const roles: IRole[] = [];
        await Promise.all(
            guild.roles.cache
                .sort((a, b) => a.position - b.position)
                .filter((role) => !role.managed && role.id !== guild.id)
                .map(async (role) => {
                    const channelOverwrites: IChannelOverwrite[] = [];
                    guild.channels.cache.forEach((channel) => {
                        if (channel.isThread() || !channel.permissionOverwrites.cache.has(role.id)) return;

                        const permission = channel.permissionOverwrites.cache.get(role.id);
                        channelOverwrites.push({
                            id: channel.id,
                            permissions: this.getPermissions(permission) as IPermissions,
                        });
                    });

                    let iconBase64: string;
                    if (role.icon) {
                        const res = await fetch(role.iconURL({ forceStatic: true, size: 4096 }));
                        const buffer = await res.arrayBuffer();
                        iconBase64 = Buffer.from(buffer).toString('base64');
                    }

                    roles.push({
                        id: role.id,
                        channelOverwrites,
                        members: guild.members.cache
                            .filter((m) => m.roles.cache.has(role.id))
                            .map((member) => member.id),
                        name: role.name,
                        color: role.color,
                        position: role.position,
                        permissions: role.permissions.bitfield.toString(),
                        mentionable: role.mentionable,
                        hoist: role.hoist,
                        icon: iconBase64,
                        isDeleted: false,
                    });
                }),
        );
        await RoleModel.deleteMany({ isDeleted: false });
        await RoleModel.insertMany(roles);

        const channels: IChannel[] = [];
        await Promise.all(
            guild.channels.cache.map(async (channel) => {
                if (
                    channel.isThread() ||
                    [
                        ChannelType.DM,
                        ChannelType.GroupDM,
                        ChannelType.PublicThread,
                        ChannelType.PrivateThread,
                        ChannelType.AnnouncementThread,
                        ChannelType.GuildDirectory,
                        ChannelType.GuildMedia,
                        ChannelType.GuildForum,
                        ChannelType.GuildStageVoice,
                    ].includes(channel.type)
                )
                    return;

                const messages: IMessage[] = [];
                if (channel.type === ChannelType.GuildAnnouncement) {
                    const fetchOptions: FetchMessagesOptions = { limit: 100 };
                    let lastMessageId: Snowflake;
                    let fetchComplete: boolean = false;
                    while (!fetchComplete) {
                        if (lastMessageId) {
                            fetchOptions.before = lastMessageId;
                        }
                        const fetchedMessages = await channel.messages.fetch(fetchOptions);
                        if (fetchedMessages.size === 0) {
                            fetchComplete = true;
                            break;
                        }

                        lastMessageId = fetchedMessages.last().id;
                        for (const message of [...fetchedMessages.values()]) {
                            messages.push({
                                content: message.content,
                                createdTimestamp: message.createdTimestamp,
                                username: message.author.displayName,
                                avatarURL: message.author.displayAvatarURL(),
                                pinned: message.pinned,
                                embeds: message.embeds,
                                files: await Promise.all(
                                    message.attachments.map(async (attachment) => {
                                        let attach = attachment.url;
                                        if (
                                            attachment.url &&
                                            ['png', 'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi'].includes(attachment.url)
                                        ) {
                                            attach = await nodeFetch(attachment.url)
                                                .then((res) => res.buffer())
                                                .toString('base64');
                                        }
                                        return {
                                            name: attachment.name,
                                            attachment: attach,
                                        };
                                    }),
                                ),
                            });
                        }
                    }
                }

                channels.push({
                    id: channel.id,
                    isDeleted: false,
                    name: channel.name,
                    permissions: channel.permissionOverwrites.cache.map((permission) => ({
                        id: permission.id,
                        type: permission.type,
                        permissions: this.getPermissions(permission),
                    })),
                    position: channel.position,
                    type: channel.type as IChannelType,
                    parentId: channel.parentId,
                    topic: channel.isTextBased() ? (channel as TextChannel).topic : undefined,
                    isNSFW: channel.isTextBased() ? channel.nsfw : undefined,
                    bitrate: channel.isVoiceBased() ? channel.bitrate : undefined,
                    userLimit: channel.isVoiceBased() ? channel.userLimit : undefined,
                    rateLimitPerUser: channel.isTextBased() ? channel.rateLimitPerUser : undefined,
                    messages,
                });
            }),
        );

        await ChannelModel.deleteMany({ isDeleted: false });
        await ChannelModel.insertMany(channels);
    }

    static sendLimitWarning({
        guild,
        authorName,
        maxCount,
        currentCount,
        type,
    }: {
        guild: Guild;
        authorName: string;
        maxCount: number;
        currentCount: number;
        type: string;
    }) {
        const channel = guild.channels.cache.find((c) => c.name === 'guard-log') as TextChannel;
        if (!channel) return;

        channel.send({
            embeds: [
                new EmbedBuilder({
                    description: `${authorName}, ${bold(type)} limitinde ${inlineCode(
                        maxCount.toString(),
                    )} hakkından birini kullandı. Kalan limit ${inlineCode(
                        (maxCount - currentCount).toString(),
                    )}. (${inlineCode(`${currentCount}/${maxCount}`)})`,
                }),
            ],
        });
    }

    static sendPunishLog({
        guild,
        authorName,
        targetName,
        targetType,
        action,
    }: {
        guild: Guild;
        authorName: string;
        targetName: string;
        targetType: string;
        action: string;
    }) {
        const channel = guild.channels.cache.find((c) => c.name === 'guard-log') as TextChannel;
        if (!channel) return;

        channel.send({
            embeds: [
                new EmbedBuilder({
                    description: `${authorName} adlı kullanıcı ${targetName} adlı ${targetType} ${action} ve yasaklandı.`,
                }),
            ],
        });
    }

    static checkLimits({ userId, type, limit, time }: { userId: string; type: number; limit?: number; time?: number }) {
        const now = Date.now().valueOf();
        const key = `${userId}_${type}`;
        const userLimits = GuardManager.limits.get(key);
        if (!userLimits) {
            GuardManager.limits.set(key, { count: 1, lastDate: now });
            return {
                isWarn: true,
                maxCount: limit,
                currentCount: 1,
            };
        }

        userLimits.count++;
        const diff = now - userLimits.lastDate;
        if (diff < time && userLimits.count >= limit) {
            return {
                isWarn: false,
                maxCount: limit,
                currentCount: userLimits.count,
            };
        }

        if (diff > time) GuardManager.limits.set(key, { count: 1, lastDate: now });
        return {
            isWarn: true,
            maxCount: limit,
            currentCount: userLimits.count,
        };
    }

    static async closePermissions(guild: Guild) {
        if (GuardManager.closingPermissions) return;
        GuardManager.closingPermissions = true;

        const dangerRoles = guild.roles.cache.filter(
            (role) => GuardManager.dangerPerms.some((perm) => role.permissions.has(perm)) && role.editable,
        );
        for (const role of dangerRoles.values()) await role.setPermissions([]);
    }

    static startHelpers(tokens: string[]) {
        console.log('The helpers is waking up.');

        const promises: Promise<Client>[] = [];
        for (const TOKEN of tokens) {
            promises.push(
                new Promise<any>((resolve) => {
                    const helperClient = new Client({
                        intents: [
                            GatewayIntentBits.Guilds,
                            GatewayIntentBits.GuildPresences,
                            GatewayIntentBits.GuildMembers,
                        ],
                    });

                    helperClient.on('ready', () => {
                        const guild = helperClient.guilds.cache.first();
                        if (!guild) {
                            console.log(`[HELPER-BOT]: ${helperClient.user.tag} is not in server!`);
                            helperClient.destroy();
                            return;
                        }

                        resolve(helperClient);
                    });

                    helperClient.on('rateLimit', (rateLimitData) => {
                        console.log(
                            `[HELPER-BOT]: ${helperClient.user.tag} rate limited caught. Retrying in ${Math.round(
                                rateLimitData.timeout / 1000,
                            )} seconds.`,
                        );
                    });

                    helperClient.login(TOKEN).catch(() => console.log(`[HELPER-BOT]: ${TOKEN} is not online.`));
                }),
            );
        }

        return Promise.all(promises);
    }

    static async createRole(guild: Guild, document: IRole, tokens: string[]) {
        const role = await guild.roles.create({
            name: document.name,
            color: document.color,
            hoist: document.hoist,
            mentionable: document.mentionable,
            position: document.position,
            permissions: BigInt(document.permissions),
        });

        if (document.icon) role.setIcon(Buffer.from(document.icon, 'base64'));

        await ChannelModel.updateMany({ 'permissions.$.id': document.id }, { 'permissions.$.id': role.id });

        for (const overwrite of document.channelOverwrites) {
            const channel = role.guild.channels.cache.get(overwrite.id) as GuildChannel;
            if (channel) channel.permissionOverwrites.create(role.id, overwrite.permissions);
        }

        if (document.members.length) {
            const distributors = await GuardManager.startHelpers(tokens);
            const extraMembers = document.members.length % distributors.length;
            const perMembers = (document.members.length - extraMembers) / distributors.length;

            for (let index = 0; index < distributors.length; index++) {
                const members = document.members.splice(0, index === 0 ? perMembers + extraMembers : perMembers);
                if (members.length <= 0) break;

                const guild = await distributors[index].guilds.fetch(role.guild.id);
                members.forEach(async (id, i) => {
                    const member = guild.members.cache.get(id);
                    if (member) await member.roles.add(role.id);
                    if (members.length === i + 1) distributors[index].destroy();
                });
            }
        }
    }

    static async createChannel(guild: Guild, document: IChannel) {
        const createOptions: GuildChannelCreateOptions = {
            name: document.name,
            type: document.type,
            position: document.position,
        };

        if (document.parentId) createOptions.parent = document.parentId;

        if (document.type === ChannelType.GuildText || document.type === ChannelType.GuildAnnouncement) {
            createOptions.topic = document.topic;
            createOptions.nsfw = document.isNSFW;
            createOptions.rateLimitPerUser = document.rateLimitPerUser;
        } else if (document.type === ChannelType.GuildVoice) {
            let bitrate = document.bitrate;
            const bitrates = Object.values(GuardManager.voiceBitrates);
            while (bitrate > GuardManager.voiceBitrates[guild.premiumTier]) {
                bitrate = bitrates[guild.premiumTier];
            }
            createOptions.bitrate = bitrate;
            createOptions.userLimit = document.userLimit;
        }

        const channel = (await guild.channels.create(createOptions)) as GuildChannel;

        await RoleModel.updateMany({ 'channelOverwrites.$.id': document.id }, { 'channelOverwrites.$.id': channel.id });

        document.permissions
            .filter((p) => guild.roles.cache.has(p.id) || guild.members.cache.has(p.id))
            .forEach((p) => channel.permissionOverwrites.create(p.id, p.permissions));

        if (document.type === ChannelType.GuildAnnouncement && document.messages.length > 0) {
            const webhook = await (channel as TextChannel).createWebhook({
                name: channel.client.user.displayName,
                avatar: channel.client.user.displayAvatarURL(),
            });

            for (const msg of document.messages) {
                const sentMsg = await webhook.send({
                    content: msg.content.length ? msg.content : undefined,
                    username: msg.username,
                    avatarURL: msg.avatarURL,
                    embeds: msg.embeds,
                    files: msg.files.map((f) => new AttachmentBuilder(f.attachment, { name: f.name })),
                });
                if (msg.pinned && sentMsg) await sentMsg.pin();
            }

            await webhook.delete();
        }
    }
}
