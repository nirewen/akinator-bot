export const sliceIntoChunks = (arr: any[], chunkSize: number) => {
    const res = []
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize)
        res.push(chunk)
    }
    return res
}

export const progressBar = (p: number, l: number = 30) => {
    let filled = Math.floor((p * 30) / 100)
    let rest = 30 - filled

    return Number(p.toFixed(2)) + '% ' + '█'.repeat(filled) + '░'.repeat(rest)
}
