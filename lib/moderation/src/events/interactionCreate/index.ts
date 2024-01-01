import { Events } from 'discord.js';
import memberPanel from './memberPanel';
import roleSelect from './roleSelect';
import streamOwner from './streamOwner';
import appealStaff from './appealStaff';
import appealAccept from './appealAccept';
import { giveawayJoin } from './giveawayJoin';
import { IEvent } from '@/types';

const InteractionCreate: IEvent<Events.InteractionCreate> = {
    name: Events.InteractionCreate,
    execute: async (client, interaction) => {
        if (interaction.isButton() || interaction.isStringSelectMenu()) roleSelect(client, interaction);
        if (interaction.isButton()) memberPanel(client, interaction);
        if (interaction.isButton() && ['streamer-owner', 'streamer-owner-change'].includes(interaction.customId)) {
            streamOwner(client, interaction);
        }
        if (interaction.isButton() && interaction.customId === 'appeal-staff') appealStaff(interaction);
        if (interaction.isButton() && interaction.customId.startsWith('appeal-accept')) appealAccept(interaction);
        if (interaction.isButton() && interaction.customId === 'giveaway') giveawayJoin(interaction);
    },
};

export default InteractionCreate;
