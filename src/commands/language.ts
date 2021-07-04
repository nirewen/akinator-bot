import { CommandInteraction, MessageComponentInteraction, MessageResolvable, MessageSelectMenu } from 'discord.js'
import { Bot } from 'index'
import languages from '../utils/languages.json'

export const name = 'language'
export const description = 'Sets the language of the game for the user'
export async function run(bot: Bot, interaction: CommandInteraction) {
    const buttons = new MessageSelectMenu()
        .setCustomID('lang')
        .setPlaceholder('Nothing selected')
        .addOptions(
            Object.entries(languages).map(([id, lang]) => ({
                value: id,
                label: `${lang.emoji} ${lang.name} - ${lang.native}`
            }))
        )

    await interaction.reply({ content: 'Select a language', components: [[buttons]], ephemeral: true })

    const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id

    interaction.channel?.awaitMessageComponent({ filter, time: 15000 })
        .then((i: any) => {
            let lang = i.values.join(', ')
            let selected: { emoji: string, name: string, native: string } = (languages as any)[lang]

            interaction.editReply({ content: `Set language to ${selected.emoji} ${selected.name} - ${selected.native}`, components: [] })

            bot.db.set(interaction.user.id, lang)
        })
}