import { ICommand } from '@/types';
import { codeBlock } from 'discord.js';

const Eval: ICommand = {
    usages: ['eval', 'sıla', 'heval'],
    description: 'sevdiğim birini anımsatan bir şey.',
    execute: async ({ client, message, args }) => {
        if (!client.config.BOT.BOT_OWNERS.includes(message.author.id)) return;

        const code = args.join(' ');
        let evaled: string;
        try {
            evaled = await eval(code);
        } catch (err) {
            evaled = err;
        }

        const texts = client.utils.splitMessage(clean(evaled), { maxLength: 2000 });
        for (const newText of texts) message.channel.send(codeBlock('xl', newText));
    },
};

export default Eval;

function clean(text: any): string {
    if (typeof text !== 'string') text = require('util').inspect(text, { depth: 0 });
    text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
    return text;
}
