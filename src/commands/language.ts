import { CommandInteraction, MessageSelectMenu } from 'discord.js'
import { Bot } from 'index'
import { regions } from 'aki-api'

export const name = 'language'
export const description = 'Sets the language of the game for the user'
export async function run(bot: Bot, interaction: CommandInteraction) {
    const languages = new MessageSelectMenu()
        .setCustomID('lang')
        .setPlaceholder('Nothing selected')
        .addOptions(
            regions.map(region => ({
                label: region,
                value: region
            }))
        )

    await interaction.reply({ content: 'Select a language', components: [[languages]] })
}