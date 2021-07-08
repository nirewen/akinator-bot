import { ApplicationCommandOption, ApplicationCommandPermissionData, CommandInteraction } from 'discord.js'

export default interface Command {
    name: string
    description: string
    options: ApplicationCommandOption[]
    default_permission: boolean
    permissions: ApplicationCommandPermissionData[]
    run(interaction: CommandInteraction): Promise<void>
}
