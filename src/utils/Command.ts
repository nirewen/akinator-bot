import {
    ApplicationCommandOption,
    ApplicationCommandPermissionData,
    CommandInteraction,
} from 'discord.js'
import { Bot } from 'index'

export interface Command {
    name: string
    description: string
    options: ApplicationCommandOption[]
    default_permission: boolean
    permissions: ApplicationCommandPermissionData[]
    run(bot: Bot, interaction: CommandInteraction): Promise<void>
}
