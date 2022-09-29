import { getCurrentInstance } from './component'
export function provide(key, value) {
  const currentInstance = getCurrentInstance()
  if (!currentInstance) {
    return
  }
  // const { parent } = currentInstance
  const parentProvides =
    currentInstance.parent && currentInstance.parent.provides

  if (currentInstance.provides === parentProvides) {
    currentInstance.provides = Object.create(parentProvides)
  }

  currentInstance.provides[key] = value
}

export function inject(key, defaultValue) {
  const currentInstance = getCurrentInstance()
  if (!currentInstance) {
    return
  }

  const parentProvides =
    currentInstance.parent && currentInstance.parent.provides

  if (key && key in parentProvides) {
    return parentProvides[key]
  } else if (defaultValue) {
    return defaultValue
  }
}
