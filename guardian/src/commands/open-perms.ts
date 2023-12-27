import { ICommand } from '@/types';

const OpenPerms: ICommand = {
    usages: ['yaç', 'yetkileriaç', 'yetkiaç', 'op', 'openperms', 'open-perms'],
    execute: ({ client, message }) => {
        client.config.SERVER.ROLE_PERMISSIONS.forEach((rolePermission) => {
            const role = message.guild.roles.cache.get(rolePermission.ID);
            if (role) role.edit({ permissions: BigInt(rolePermission.PERMISSIONS) });
        });
        message.channel.send('Yetkiler açıldı.');
    },
};

export default OpenPerms;
