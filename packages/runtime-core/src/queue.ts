const queue = []
let flushing = false
const p = Promise.resolve()
export function queueJob(job) {
    if (queue.includes(job)) {
        return
    } else {
        queue.push(job)
    }

    if (!flushing){
        flushing = true
        p.then(() => {
            let copy = queue.slice(0)
            copy.forEach(c => c())
            queue.length = 0
            copy = []
            flushing = false
        })
    }

}