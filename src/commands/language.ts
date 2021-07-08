import {
    CommandInteraction,
    MessageButton,
    MessageComponentInteraction,
    MessageSelectMenu,
    MessageSelectOptionData,
} from 'discord.js'
import Bot from 'structures/Bot'
import Language from 'types/Language'
import languages from '../data/languages.json'

export const name = 'language'
export const description = 'Sets the language of the game for the user'
export async function run(this: Bot, interaction: CommandInteraction) {
    const lang = this.getLanguage(interaction.user)

    const options: MessageSelectOptionData[] = Object.entries(languages).map(([id, lang]) => ({
        value: id,
        label: lang.name,
        emoji: lang.emoji,
        description: lang.native,
    }))
    const select = new MessageSelectMenu({
        customId: 'lang',
        placeholder: 'Nothing selected',
        options,
    })
    const cancel = new MessageButton({
        customId: 'cancel',
        label: lang.texts.cancel,
        style: 'DANGER',
        emoji: '861403802154565642',
    })
    const undo = new MessageButton({
        customId: 'undo',
        label: 'Undo',
        style: 'DANGER',
        emoji: '861383281940758528',
    })

    await interaction.reply({ content: 'Select a language:', components: [[select], [cancel]], ephemeral: true })

    const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id

    const collector = interaction.channel?.createMessageComponentCollector({ filter, idle: 30e3 })

    collector?.on('collect', async (i: MessageComponentInteraction) => {
        await i.deferUpdate()

        if (i.customId === 'lang') {
            // @ts-ignore: Unknown value
            let selected = i.values.join('_')
            let language: Language = (languages as any)[selected]

            i.editReply({
                content: `Set language to ${language.emoji} ${language.name} - ${language.native}`,
                components: [[undo]],
            })

            this.db.set(interaction.user.id, language.code as any)
        }

        if (i.customId === 'cancel') {
            i.editReply({
                content: `Language not changed. You're still using ${lang.emoji} ${lang.name} - ${lang.native}`,
                components: [[undo]],
            })
        }

        if (i.customId === 'undo') {
            i.editReply({ content: 'Select a language', components: [[select], [cancel]] })

            this.db.set(interaction.user.id, lang.code as any)
        }
    })

    collector?.on('end', (_, reason) => {
        if (reason === 'idle') interaction.editReply({ content: 'This interaction has timed out', components: [] })
    })
}
