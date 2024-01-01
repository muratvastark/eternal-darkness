import { Client as Core, GatewayIntentBits, ActivityType, Collection } from 'discord.js';
import { connect } from 'mongoose';

import { Utils } from './Utils';
import config from '../../config.json';
import { ICommand } from '@/types';
import { UserModel } from '@/models';

export class Client extends Core {
    commands = new Collection<string, ICommand>();
    utils = new Utils(this);
    config = config;

    constructor() {
        super({
            intents: Object.keys(GatewayIntentBits).map((intent) => GatewayIntentBits[intent]),
            presence: {
                activities: [{ name: config.BOT.STATUS, type: ActivityType.Watching }],
            },
        });
    }

    async connect() {
        console.log('Loading bot commands...');
        await this.utils.loadCommands();

        console.log('Loading bot events...');
        await this.utils.loadEvents();

        console.log('Connecting mongo...');
        await connect(this.config.BOT.MONGO_URL);

        await this.login(this.config.BOT.TOKEN);
    }
}
