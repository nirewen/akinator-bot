import { CommandInteraction, MessageButton, MessageComponentInteraction, MessageEmbed } from 'discord.js'
import { Bot } from 'index'
import { Aki } from 'aki-api'
import { promisify } from 'util'
import { sliceIntoChunks, progressBar } from '../utils'
import languages from '../utils/languages.json'
import Language from 'utils/Language'

const sleep = promisify(setTimeout)

export const name = 'akinator'
export const description = 'Play Akinator'
export async function run(bot: Bot, interaction: CommandInteraction) {
    const lang: Language = (languages as { [key: string]: Language })[
        (bot.db.get(interaction.user.id) as string | undefined) || 'pt'
    ]

    const embed = new MessageEmbed().setColor('YELLOW')
    const successEmbed = new MessageEmbed()
        .setTitle(lang.texts.guess.right.title)
        .setDescription(lang.texts.guess.right.description)
        .setColor('GREEN')
    const failEmbed = new MessageEmbed()
        .setTitle(lang.texts.guess.wrong.title.replace('{username}', interaction.user.username))
        .setDescription(lang.texts.guess.wrong.description)
        .setColor('RED')
    const game = new Aki(lang.code)

    interaction.defer()

    await game.start()

    let buttons = sliceIntoChunks(
        game.answers.map((label: string, i: number) => new MessageButton({ customID: `${i}`, label, style: 'PRIMARY' })),
        3
    )
    buttons[1].push(new MessageButton({ customID: 'back', label: lang.texts.correct, style: 'DANGER', emoji: '◀️' }))

    embed.setTitle(`${lang.texts.question} ${game.currentStep + 1}:`)
    embed.setDescription(game.question)
    embed.setFooter(progressBar(game.progress, 20))

    const message = await interaction.editReply({ embeds: [embed], components: buttons })

    const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id && i.message.id === message.id

    const collector = interaction.channel?.createMessageComponentCollector({ filter, idle: 30e3 })

    collector?.on('collect', async (i: MessageComponentInteraction) => {
        await i.deferUpdate()

        if (i.customID === 'back') await game.back()
        else await game.step(i.customID)

        if (game.currentStep >= 78 && i.customID === 'continue') {
            interaction.editReply({ content: null, embeds: [embed, failEmbed], components: [] })

            collector.stop()
            return
        }

        if (game.progress >= 70 && i.customID !== 'continue') {
            if (i.customID === 'win') {
                interaction.editReply({ content: null, embeds: [embed, successEmbed], components: [] })

                return
            }

            await game.win()
            i.editReply({ content: ':thinking:', embeds: [], components: [] })
            await sleep(3000)

            let [answer] = game.answers

            embed.setTitle(lang.texts.guess.question)
            embed.setDescription(`**${answer.name}**\n${answer.description}\n${lang.texts.guess.ranked} **#${answer.ranking}**`)
            embed.setFooter('')
            embed.setImage(answer.absolute_picture_path)

            let buttons = [
                new MessageButton({ customID: 'win', label: lang.texts.yes, style: 'PRIMARY' }),
                new MessageButton({ customID: 'continue', label: lang.texts.no, style: 'PRIMARY' }),
                new MessageButton({ customID: 'back', label: lang.texts.correct, style: 'DANGER', emoji: '◀️' }),
            ]

            interaction.editReply({ content: null, embeds: [embed], components: [buttons] })

            return
        }

        embed.setTitle(`${lang.texts.question} ${game.currentStep + 1}:`)
        embed.setDescription(game.question)
        embed.setImage('')
        embed.setFooter(progressBar(Number(game.progress), 20))

        await i.editReply({ embeds: [embed], components: buttons })
    })

    collector?.on('end', (_, reason) => {
        if (reason === 'idle' && game.progress < 70) {
            interaction.editReply({ content: 'This interaction was timed out', embeds: [], components: [] })
        }
    })
}
