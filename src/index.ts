import fs from 'fs'
import path from 'path'
import Discord from 'discord.js'
import dotenv from 'dotenv'
import JSONdb from 'simple-json-db'

dotenv.config()

export class Bot extends Discord.Client {
    commands = new Map()
    db = new JSONdb(path.join(__dirname, 'db.json'))

    constructor () {
        super({
            intents: ['GUILDS', 'GUILD_MESSAGES']
        })
    }

    async initEvents() {
        const events = fs.readdirSync(path.join(__dirname, 'events'))

        for (let file of events) {
            let [name] = file.split('.')
            const { default: event } = require(path.join(__dirname, 'events', file))
            
            this.on(name, (...args) => event(this, ...args))
        }
    }

    async initCommands() {
        if (!bot.application?.owner) await bot.application?.fetch()
        const commands = fs.readdirSync(path.join(__dirname, 'commands'))

        for (let file of commands) {
            let command = require(path.join(__dirname, 'commands', file))

            bot.application?.commands.create(command)

            this.commands.set(command.name, command)
        }
    }

    async login() {
        await this.initEvents()

        await super.login(process.env.TOKEN)

        return ''
    }
}

const bot = new Bot()

bot.login()