import Discord, { ApplicationCommand, ApplicationCommandResolvable, User } from 'discord.js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import JSONdb from 'simple-json-db'
import Event from './Event'
import Logger from './Logger'
import Command from 'types/Command'
import Language from 'types/Language'
import languages from 'data/languages.json'

class Bot extends Discord.Client {
    commands = new Map<string, Command>()
    events = new Map<string, Event>()
    logger = new Logger()
    db = new JSONdb(path.join(__dirname, '..', '..', 'db.json'))

    constructor() {
        super({
            intents: ['GUILDS', 'GUILD_MESSAGES'],
        })

        dotenv.config()
    }

    async loadEvents() {
        const files = fs.readdirSync(path.join(__dirname, '..', 'events'))

        for (let file of files) {
            let [name] = file.split('.')
            let { run } = await import(path.join(__dirname, '..', 'events', file))

            this.events.set(name, new Event(name, run))

            this.on(name, function (this: Bot) {
                this.events.get(name)!.run.call(this, ...arguments)
                this.events.get(name)!.ran++
            })
        }
    }

    async loadCommands() {
        if (!this.application?.owner) await this.application?.fetch()

        await this.application?.commands.fetch()

        const commands = fs.readdirSync(path.join(__dirname, '..', 'commands'))

        for (let file of commands) {
            let command: Command = require(path.join(__dirname, '..', 'commands', file))
            let cmd: ApplicationCommand

            if (process.argv.includes('--deploy')) {
                cmd = await this.application?.commands.create(command)!
            } else {
                cmd = this.application?.commands.cache.find(c => c.name === command.name)!
            }

            if (command.permissions)
                this.guilds.cache.forEach(async guild => {
                    this.application?.commands.permissions.add({
                        guild: guild.id,
                        command: cmd?.id as ApplicationCommandResolvable,
                        permissions: command.permissions,
                    })
                })

            command.run = command.run.bind(this)

            this.commands.set(command.name, command)
        }
    }

    getLanguage(user: User) {
        let userLang = (this.db.get(user.id) as any) || 'pt'
        let langs = languages as { [key: string]: Language }

        return langs[userLang]
    }

    login(token: string): any {
        this.logger.logBold('Logando...', 'green')

        super.login(token).catch(error => {
            this.logger.error(error, 'LOGIN ERROR')
        })
    }

    async start() {
        try {
            await this.loadEvents()
            await this.loadCommands()
            this.login(process.env.TOKEN!)
        } catch (e) {
            this.logger.error(e, 'START ERROR')
        }
    }
}

export default Bot
