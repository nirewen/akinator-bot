class Event {
    name: string
    run: (...args: any) => void
    ran: number

    constructor(name: string, run: (...args: any) => void) {
        this.name = name
        this.run = run
        this.ran = 0
    }
}

export default Event
