import { CommandInteraction, MessageButton, MessageComponentInteraction } from 'discord.js'
import Bot from 'structures/Bot'
import { promisify } from 'util'
import Akinator from '../structures/Akinator'

const sleep = promisify(setTimeout)

export const name = 'akinator'
export const description = 'Play Akinator'
export async function run(this: Bot, interaction: CommandInteraction) {
    const lang = this.getLanguage(interaction.user)

    const game = new Akinator(lang)

    interaction.defer()

    await game.start()

    const message = await interaction.editReply({ embeds: [game.question], components: game.answers })
    const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id && i.message.id === message.id

    const collector = interaction.channel?.createMessageComponentCollector({ filter, idle: 120e3 })

    collector?.on('collect', async (i: MessageComponentInteraction) => {
        if (i.customId === 'win') {
            let [guess] = game.guesses
            interaction.editReply({ content: null, embeds: [guess, game.success], components: [] })

            return collector.stop()
        }

        if (i.customId === 'stop') {
            interaction.editReply({ content: null, embeds: [game.failure, ...game.minGuesses.slice(0, 9)], components: [] })

            return collector.stop()
        }

        interaction.editReply({
            embeds: [game.question],
            components: game.answers.map(row => {
                const button = row.find(b => b.customId === i.customId && i.customId !== 'back')

                if (button) button.setStyle('SUCCESS')

                return row
            }),
        })

        await i.deferUpdate()

        if (i.customId === 'back') await game.correct()
        else await game.answer(i.customId)

        if (game.progress >= 70 && i.customId !== 'stop') {
            await game.win()

            i.editReply({ embeds: [game.guessQuestion], components: [] })

            await sleep(3000)

            let [guess] = game.guesses

            let buttons = [
                new MessageButton({ customId: 'win', label: lang.texts.yes, style: 'PRIMARY', emoji: '861383283321733161' }),
                new MessageButton({ customId: 'stop', label: lang.texts.no, style: 'PRIMARY', emoji: '861383283015417877' }),
                new MessageButton({ customId: 'back', label: lang.texts.correct, style: 'DANGER', emoji: '861383281940758528' }),
            ]

            interaction.editReply({ embeds: [guess], components: [buttons] })

            return
        }

        await i.editReply({
            embeds: [game.question],
            components: game.answers,
        })
    })

    collector?.on('end', (_, reason) => {
        if (reason === 'idle' && game.progress < 70) {
            interaction.editReply({ content: 'This interaction has timed out', embeds: [], components: [] }).catch()
        }
    })
}
