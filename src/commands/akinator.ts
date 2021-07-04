import { CommandInteraction, MessageButton, MessageComponentInteraction, MessageEmbed } from 'discord.js'
import { Bot } from 'index'
import { Aki } from 'aki-api'
import { sliceIntoChunks } from '../utils/array'
import { promisify } from 'util'

const sleep = promisify(setTimeout)

export const name = 'akinator'
export const description = 'Play Akinator'
export async function run(bot: Bot, interaction: CommandInteraction) {
    let game = new Aki('pt')
    const embed = new MessageEmbed().setColor('YELLOW')
    const progressBar = (p: number, l: number = 30) => {
        let filled = Math.floor((p * 30) / 100)
        let rest = 30 - filled

        return Number(p.toFixed(2)) + '% ' + '█'.repeat(filled) + '░'.repeat(rest)
    }

    interaction.defer()

    await game.start()

    let buttons = sliceIntoChunks(game.answers.map((label: string, i: number) => 
        new MessageButton({ customID: `${i}`, label, style: 'PRIMARY'}))
    , 3)
    buttons[1].push(new MessageButton({ customID: 'back', label: 'Voltar', style: 'DANGER' }))

    embed.setTitle(`Pergunta ${game.currentStep + 1}:`)
    embed.setDescription(game.question)
    embed.setFooter(progressBar(game.progress, 20))

    const message = await interaction.editReply({ embeds: [embed], components: buttons })

    const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id && i.message.id === message.id

    const collector = interaction.channel?.createMessageComponentCollector({ filter, idle: 30E3 })

    collector?.on('collect', async (i: MessageComponentInteraction) => {
        await i.deferUpdate()

        if (i.customID === 'back')
            await game.back()
        else
            await game.step(i.customID)

        if (game.currentStep >= 78 && i.customID === 'continue') {
            interaction.editReply({ content: null, embeds: [
                embed, 
                new MessageEmbed()
                    .setTitle(`Bravo, ${interaction.user.username}!`)
                    .setDescription('Você me venceu!')
                    .setColor('RED')
                ], components: []
            })

            collector.stop()
            return
        }

        if (game.progress >= 70 && i.customID !== 'continue') {
            if (i.customID === 'win') {
                interaction.editReply({ content: null, embeds: [
                    embed, 
                    new MessageEmbed()
                        .setTitle('Excelente! Acertei mais uma vez!')
                        .setDescription('Adorei jogar com você!')
                        .setColor('GREEN')
                    ], components: []
                })

                return
            }

            await game.win()
            i.editReply({ content: ':thinking:', embeds: [], components: [] })
            await sleep(2000)

            let [answer] = game.answers

            embed.setTitle(`Esse é o seu personagem?`)
            embed.setDescription(`**${answer.name}**\n${answer.description}\nClassificado como **#${answer.ranking}**`)
            embed.setFooter('')
            embed.setImage(answer.absolute_picture_path)

            let buttons = [
                { customID: 'win', label: 'Sim', style: 'PRIMARY' },
                { customID: 'continue', label: 'Não', style: 'PRIMARY' },
                { customID: 'back', label: 'Voltar', style: 'DANGER' },
            ].map((label: any) => new MessageButton(label))

            interaction.editReply({ content: null, embeds: [embed], components: [buttons] })

            return
        }

        embed.setTitle(`Pergunta ${game.currentStep + 1}:`)
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