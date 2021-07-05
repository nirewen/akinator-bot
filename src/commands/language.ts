import {
    CommandInteraction,
    MessageButton,
    MessageComponentInteraction,
    MessageSelectMenu,
    MessageSelectOptionData,
} from 'discord.js'
import { Bot } from 'index'
import languages from '../data/languages.json'

export const name = 'language'
export const description = 'Sets the language of the game for the user'
export async function run(bot: Bot, interaction: CommandInteraction) {
    const lang = bot.getLanguage(interaction.user)

    const options: MessageSelectOptionData[] = Object.entries(languages).map(([id, lang]) => ({
        value: id,
        label: `${lang.emoji} ${lang.name} - ${lang.native}`,
    }))
    const select = new MessageSelectMenu({
        customID: 'lang',
        placeholder: options.find(option => option.value === lang.code)?.label,
        options,
    })
    const cancel = new MessageButton({
        customID: 'cancel',
        label: lang.texts.cancel,
        style: 'DANGER',
        emoji: '861403802154565642',
    })

    await interaction.reply({ content: 'Select a language', components: [[select, cancel]], ephemeral: true })

    const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id

    interaction.channel?.awaitMessageComponent({ filter, time: 15000 }).then((i: any) => {
        let lang = i.values.join(', ')
        let selected: { emoji: string; name: string; native: string } = (languages as any)[lang]

        interaction.editReply({
            content: `Set language to ${selected.emoji} ${selected.name} - ${selected.native}`,
            components: [],
        })

        bot.db.set(interaction.user.id, lang)
    })
}
