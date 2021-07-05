import fs from 'fs'
import path from 'path'
import Discord, { ApplicationCommand, ApplicationCommandResolvable, User } from 'discord.js'
import dotenv from 'dotenv'
import JSONdb from 'simple-json-db'
import { Command } from 'types/Command'
import Language from 'types/Language'
import languages from './data/languages.json'

dotenv.config()

export class Bot extends Discord.Client {
    commands = new Map()
    db = new JSONdb(path.join(__dirname, '..', 'db.json'))

    constructor() {
        super({
            intents: ['GUILDS', 'GUILD_MESSAGES'],
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

        await bot.application?.commands.fetch()

        const commands = fs.readdirSync(path.join(__dirname, 'commands'))

        for (let file of commands) {
            let { permissions, ...command }: Command = require(path.join(__dirname, 'commands', file))
            let cmd: ApplicationCommand

            if (process.argv.includes('--deploy')) cmd = await bot.application?.commands.create(command)!
            else cmd = bot.application?.commands.cache.find(c => c.name === command.name)!

            if (permissions)
                bot.guilds.cache.forEach(async guild => {
                    bot.application?.commands.permissions.add({
                        guild: guild.id,
                        command: cmd?.id as ApplicationCommandResolvable,
                        permissions,
                    })
                })

            this.commands.set(command.name, command)
        }
    }

    getLanguage(user: User) {
        let userLang = (this.db.get(user.id) as any) || 'pt'
        let langs = languages as { [key: string]: Language }

        return langs[userLang]
    }

    async login() {
        await this.initEvents()

        await super.login(process.env.TOKEN)

        return ''
    }
}

const bot = new Bot()

bot.login()
