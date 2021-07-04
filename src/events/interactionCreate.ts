import { Interaction } from 'discord.js'
import { Bot } from 'index'

export default function (bot: Bot, interaction: Interaction) {
    if (interaction.isCommand()) {
        const { commandName } = interaction

        bot.commands.get(commandName).run(bot, interaction)
    }
}