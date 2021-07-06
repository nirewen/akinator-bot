declare module 'aki-api' {
    class Aki {
        public currentStep: number
        public region: string
        public uri: string
        public urlApiWs: string
        public uriObj: string
        public noUri: string
        public noSession: string
        public progress: number
        public childMode: { childMod: boolean; softConstraint: string; questionFilter: string }
        public question: string
        public answers: any[]

        public constructor(region: string, childMode?: boolean)

        public start(): Promise<void>
        public step(answerId: string): Promise<void>
        public back(): Promise<void>
        public win(): Promise<void>
    }

    const regions: string[]
}
