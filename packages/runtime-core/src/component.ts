import { reactive } from "@vue3/reactivity"

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
        proxy: null
    }
    return instance
}

const publicProperty = {
    $attrs: i => i.attrs
}


export function setupComponent(instance) {
    initProps(instance, instance.vnode.props)

    instance.proxy = new Proxy(instance, {
        get(target, key) {
            if (key in target.data) {
                return target.data[key]
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