import { MessageButton, MessageEmbed } from 'discord.js'
import { Aki } from 'aki-api'
import Guess from 'types/Guess'
import Language from 'types/Language'

class Akinator {
    private game: Aki
    private lang: Language

    constructor(language: Language) {
        this.lang = language
        this.game = new Aki(this.lang.code)
    }

    public async start() {
        await this.game.start()

        return this
    }

    public async answer(choice: string) {
        await this.game.step(choice)

        return this
    }

    public async correct() {
        await this.game.back()

        return this
    }

    public async win() {
        await this.game.win()

        return this
    }

    public get embed() {
        return new MessageEmbed().setColor('YELLOW')
    }

    public get step() {
        return this.game.currentStep
    }

    public get progress() {
        return this.game.progress
    }

    public get answers() {
        const { answers } = this.game
        const { correct } = this.lang.texts

        return [
            [
                new MessageButton({ customId: '0', label: answers[0], style: 'PRIMARY', emoji: '861383283321733161' }),
                new MessageButton({ customId: '1', label: answers[1], style: 'PRIMARY', emoji: '861383283015417877' }),
                new MessageButton({ customId: '3', label: answers[3], style: 'PRIMARY', emoji: '861383283144654938' }),
            ],
            [
                new MessageButton({ customId: '2', label: answers[2], style: 'PRIMARY', emoji: '861383282981339167' }),
                new MessageButton({ customId: '4', label: answers[4], style: 'PRIMARY', emoji: '861383283110838273' }),
                new MessageButton({
                    customId: 'back',
                    label: correct,
                    style: 'DANGER',
                    emoji: '861383281940758528',
                    disabled: this.step === 0,
                }),
            ],
        ]
    }

    public get question() {
        const { question } = this.lang.texts

        return this.embed
            .setTitle(`${question} ${this.step + 1}:`)
            .setDescription(this.game.question)
            .setFooter(this.progressBar)
    }

    public get guesses() {
        const { question, ranked } = this.lang.texts.guess

        return this.game.answers.map(g => {
            const guess = g as Guess

            return this.embed
                .setTitle(question)
                .setDescription(`**${guess.name}**\n${guess.description}\n${ranked} **#${guess.ranking}**`)
                .setImage(guess.absolute_picture_path)
                .setFooter('')
        })
    }

    public get minGuesses() {
        return this.guesses.map(e => {
            const image = e.image!.url

            return e.setThumbnail(image).setImage('')
        })
    }

    public get guessQuestion() {
        const { question } = this.lang.texts.guess

        return this.embed.setTitle(question).setDescription(':thinking:')
    }

    public get success() {
        const { title, description } = this.lang.texts.guess.right

        return new MessageEmbed({ title, description, color: 'GREEN' })
    }

    public get failure() {
        const { title, description } = this.lang.texts.guess.wrong

        return new MessageEmbed({ title, description, color: 'RED' })
    }

    private get progressBar() {
        const progress = Number(this.progress)
        const length = 30

        const filled = Math.floor((progress * length) / 100)
        const rest = length - filled

        return `${progress.toFixed(2)}% ${'█'.repeat(filled)}${'▁'.repeat(rest)}`
    }
}

export default Akinator
