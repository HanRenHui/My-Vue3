export function IsObject(obj: Record<string, any>) {
    return typeof obj === 'object' && obj !== null
}