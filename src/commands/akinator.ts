import { CommandInteraction, MessageButton, MessageComponentInteraction, MessageEmbed } from 'discord.js'
import { Bot } from 'index'
import { Aki } from 'aki-api'
import { promisify } from 'util'
import Language from 'types/Language'

const sleep = promisify(setTimeout)

const progressBar = (p: number, l: number = 30) => {
    let filled = Math.floor((p * 30) / 100)
    let rest = 30 - filled

    return `${Number(p.toFixed(2))}% [${'█'.repeat(filled)}${'_'.repeat(rest)}]`
}

export const name = 'akinator'
export const description = 'Play Akinator'
export async function run(bot: Bot, interaction: CommandInteraction) {
    const lang = bot.getLanguage(interaction.user)

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

    let buttons = [
        [
            new MessageButton({ customID: '0', label: game.answers[0], style: 'PRIMARY', emoji: '861383283321733161' }),
            new MessageButton({ customID: '1', label: game.answers[1], style: 'PRIMARY', emoji: '861383283015417877' }),
            new MessageButton({ customID: '3', label: game.answers[3], style: 'PRIMARY', emoji: '861383283144654938' }),
        ],
        [
            new MessageButton({ customID: '2', label: game.answers[2], style: 'PRIMARY', emoji: '861383282981339167' }),
            new MessageButton({ customID: '4', label: game.answers[4], style: 'PRIMARY', emoji: '861383283110838273' }),
            new MessageButton({ customID: 'back', label: lang.texts.correct, style: 'DANGER', emoji: '861383281940758528' }),
        ],
    ]

    embed.setTitle(`${lang.texts.question} ${game.currentStep + 1}:`)
    embed.setDescription(game.question)
    embed.setFooter(progressBar(game.progress, 20))

    const message = await interaction.editReply({ embeds: [embed], components: buttons })

    const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id && i.message.id === message.id

    const collector = interaction.channel?.createMessageComponentCollector({ filter, idle: 30e3 })

    if (game.currentStep > 0) buttons[1][2].setDisabled(false)
    else buttons[1][2].setDisabled(true)

    collector?.on('collect', async (i: MessageComponentInteraction) => {
        await i.deferUpdate()

        if ((game.progress >= 80 || game.currentStep >= 78) && i.customID === 'continue') {
            let thoughtsEmbeds = game.answers.map(answer =>
                new MessageEmbed()
                    .setDescription(
                        `**${answer.name}**\n${answer.description}\n${lang.texts.guess.ranked} **#${answer.ranking}**`
                    )
                    .setThumbnail(answer.absolute_picture_path)
                    .setColor('YELLOW')
            )
            interaction.editReply({ content: null, embeds: [failEmbed, ...thoughtsEmbeds], components: [] })

            collector.stop()
            return
        }

        if (i.customID === 'back') await game.back()
        else await game.step(i.customID)

        if (game.currentStep > 0) buttons[1][2].setDisabled(false)
        else buttons[1][2].setDisabled(true)

        if (game.progress >= 80 && i.customID !== 'continue') {
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
                new MessageButton({ customID: 'win', label: lang.texts.yes, style: 'PRIMARY', emoji: '861383283321733161' }),
                new MessageButton({ customID: 'continue', label: lang.texts.no, style: 'PRIMARY', emoji: '861383283015417877' }),
                new MessageButton({ customID: 'back', label: lang.texts.correct, style: 'DANGER', emoji: '861383281940758528' }),
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
