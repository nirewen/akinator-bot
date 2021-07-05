import { ApplicationCommandPermissionData, CommandInteraction, Formatters } from 'discord.js'
import { Bot } from 'index'
import util from 'util'

util.inspect.colors.light_blue = [94, 39]
// @ts-ignore: RBG color code
util.inspect.colors.orange = ['38;5;214', 39]
util.inspect.styles = {
    // @ts-ignore: Unknown color name
    name: 'orange',
    string: 'green',
    number: 'cyan',
    date: 'magenta',
    regexp: 'red',
    boolean: 'light_blue',
    null: 'bold',
    undefined: 'grey',
    special: 'cyan',
}

export const name = 'eval'
export const description = 'Evaluates a JavaScript code'
export const options = [
    {
        name: 'code',
        type: 'STRING',
        description: 'The code to be executed',
        required: true,
    },
]
export const defaultPermission = false
export const permissions: ApplicationCommandPermissionData[] = [
    {
        id: '106915215592923136',
        type: 'USER',
        permission: true,
    },
]
export async function run(bot: Bot, interaction: CommandInteraction) {
    let { value: suffix }: any = interaction.options.get('code')

    let code = suffix?.replace(/^\u0060\u0060\u0060(js|javascript ?\n)?|\u0060\u0060\u0060$/g, '')
    let inspect = (e: string, colors?: any) => (typeof e === 'string' ? e : util.inspect(e, { depth: 0, colors }))

    try {
        let awaitResult: any = async (temp: any) => {
            if (temp && temp[Symbol.toStringTag] === 'AsyncFunction') return awaitResult(await temp())
            if (temp && temp instanceof Promise) return awaitResult(await temp)

            return temp
        }

        let result = eval(code)
        let type = result ? `[${result.constructor ? result.constructor.name : 'Object'}] => ` : ''
        let message = await awaitResult(result)
        let logMessage = `${type}${inspect(message, true)}`

        console.log(logMessage.split('\n').length > 1 ? '\n' + logMessage : logMessage, 'EVAL')

        if (message && message.length > 2000) message = 'Mensagem muito longa, veja o console'
        else message = `${type}${inspect(message)}`

        if (interaction.replied) return

        interaction.reply({
            content: Formatters.codeBlock('js', message),
            ephemeral: true,
        })
    } catch (error) {
        console.error(error)
        interaction
            .reply({
                content: Formatters.codeBlock('js', error),
                ephemeral: true,
            })
            .catch(err => console.log(err.message))
    }
}
