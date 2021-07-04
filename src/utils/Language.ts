export default interface Language {
    code: string
    emoji: string
    name: string
    native: string
    texts: {
        correct: string
        yes: string
        no: string
        question: string
        guess: {
            question: string
            ranked: string
            right: {
                title: string
                description: string
            },
            wrong: {
                title: string
                description: string
            }
        }
    }
}