import { proxyRefs, reactive } from "@vue3/reactivity"
import { ShapeFlags } from "@vue3/shared"

export let currentInstance = null
export function setCurrentInstance(instance) {
    currentInstance = instance
}

export function getCurrentInstance() {
    return currentInstance
}

const initProps = (instance, rawProps) => {
    const props = {}
    const attrs = {}
    for (let key in rawProps) {
        const v = rawProps[key]
        if (key in instance.propOptions) {
            props[key] = v
        } else {
            attrs[key] = v
        }
    }
    // 应该是shallowReactive 防止用户在子组件里修改props
    instance.props = reactive(props)
    instance.attrs = attrs
}

export function createComponentInstance(vnode) {
    const { render, props: propOptions } = vnode.type
    const instance = {
        data: null,
        render,
        is_mounted: false,
        vnode,
        subTree: null,
        update: null,
        propOptions,
        attrs: {},
        props: {},
        proxy: null,
        setupState: {}
    }
    return instance
}

const publicProperty = {
    $attrs: i => i.attrs,
    $slots: i => i.slots
}

function initSlots(instance, children) {
    if (instance.vnode.ShapeFlag & ShapeFlags.SLOTS_CHILDREN) {
        instance.slots = children
    }
}


export function setupComponent(instance) {
    const { props, children } = instance.vnode
    initProps(instance, props)

    initSlots(instance, children)

    instance.proxy = new Proxy(instance, {
        get(target, key) {
            if (key in target.data) {
                return target.data[key]
            } else if (key in target.setupState) {
                return target.setupState[key]
            } else if (key in target.props) {
                return target.props[key]
            } else {
                const getter = publicProperty[key]
                if (getter) {
                    return getter(target)
                }
            }
        },
        set(target, key, value) {
            if (key in target.data) {
                target.data[key] = value;
                return true
            } else if (key in target.setupState) {
                target.setupState[key] = value
                return true;
            } else if (key in target.props) {
                console.warn('no set props')
                return false
            }
            return false
        }
    })

    const data = instance.vnode.type.data
    if (data) {
        instance.data = reactive(data.call(instance.proxy))
    } else {
        instance.data = {}
    }

    const setup = instance.vnode.type.setup
    if (setup) {
        const setupContext = {}
        setCurrentInstance(instance)
        const setupResult = setup(instance.props, setupContext)
        setCurrentInstance(null)
        if (typeof setupResult === 'function') {
            instance.render = setupResult
        } else {
            instance.setupState = proxyRefs(setupResult)
        }
    }
}

export function hasPropChanged(preProps, nextProps) {
    const prePropKeys = Object.keys(preProps)
    const nextPropKeys = Object.keys(nextProps)
    if (prePropKeys.length !== nextPropKeys.length) return true
    for (let i = 0; i < nextPropKeys.length; i++) {
        const key = nextPropKeys[i]
        if (nextProps[key] !== preProps[key]) return true
    }

    return false
}


export function updateProps(preProps = {}, nextProps) {

    for (let key in nextProps) {
        if (nextProps[key] !== preProps[key]) {
            preProps[key] = nextProps[key]
        }
    }

    for (let key in preProps) {
        if (!(key in nextProps)) {
            delete preProps[key]
        }
    }
}