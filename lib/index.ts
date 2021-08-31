const ALL_CALLBACKS = '*'
const define = Object.defineProperties

type CallbacksSet = Set<Function>;
type EventCallbacksMap = Map<string, CallbacksSet>

export interface ListenerCallback {
    (event: string, fn: Function): ObservableInstance
}

export interface EmitterCallback {
    (event: string, ...args: any[]): ObservableInstance
}

export type ObservableInstance = {
    on: ListenerCallback,
    one: ListenerCallback,
    off: ListenerCallback,
    trigger: EmitterCallback,
    $_cleanup: Function
};

const freezeProp = () => ({

    enumerable: false,
    writable: false,
    configurable: false,
})

const defineOpts = (value: any) => ({

    ...freezeProp(),
    value
});

const implementOne = (self: any, event: string, listener: Function) => {

    function on(...args: any[]) {

        self.off(event, on);
        listener.apply(self, args)
    }

    return self.on(event, on);
}

export default class Observable {

    private _callbacks: EventCallbacksMap = new Map();
    private _target: any = null;

    constructor(target?: any) {

        const self = this;
        this._target = target || this;

        if (target) {

            define(target, {
                on: defineOpts((ev: string, fn: Function) => self.on(ev, fn)),
                one: defineOpts((ev: string, fn: Function) => self.one(ev, fn)),
                off: defineOpts((ev: string, fn: Function) => self.off(ev, fn)),
                trigger: defineOpts((ev: string, ...args: any[]) => self.trigger(ev, ...args)),
                extend: defineOpts((component: any, prefix?: string) => self.extend(component, prefix)),
            });
        }
        else {

            define(this, {
                on: defineOpts(this.on),
                one: defineOpts(this.one),
                off: defineOpts(this.off),
                trigger: defineOpts(this.trigger),
                extend: defineOpts(this.extend),
                _callbacks: defineOpts(this._callbacks),
                _target: defineOpts(this._target),
            });
        }

        return this._target;
    }

    /**
     * Extends a give component to listen to this instance of observable's
     * events, and not it's own. Can have an optional prefix for dispatching
     * within it's own context, while still being able to be triggered by
     * the original instance's events.
     * @param component Component to wrap events around
     * @param prefix Prefix this component will dispatch and listen to
     *
     * @example
     *
     * const obs = new Observable();
     *
     * const modal = {};
     *
     * obs.extend(modal, 'modal');
     *
     * modal.on('open', () => {});
     *
     * obs.trigger('modal-open'); // opens modal
     * modal.trigger('open'); // calls the same event
     *
     * modal.$_cleanup(); // clears all event listeners
     */
    extend(component: any, prefix?: string): ObservableInstance {

        const self = this;
        let eventListeners: [string, Function][] = [];

        let namedEvent = (ev: string) => {

            return `${prefix}-${ev}`;
        };

        if (!prefix) {

            namedEvent = (ev) => ev;
        }

        define(component, {

            on: defineOpts(
                (ev: string, fn: Function) => {

                    eventListeners.push([ev, fn]);
                    return self.on(namedEvent(ev), fn);
                }
            ),

            one: defineOpts(
                (ev: string, fn: Function) => {

                    return implementOne(component, ev, fn);
                }
            ),

            off: defineOpts(
                (ev: string, fn: Function) => {

                    eventListeners = eventListeners.filter(
                        ([_ev, _fn]) => ev === _ev && fn === _fn
                    );

                    self.off(namedEvent(ev), fn)
                }
            ),

            trigger: defineOpts(
                (ev: string, ...args: any[]) => (

                    self.trigger(namedEvent(ev), ...args)
                )
            ),

            $_cleanup: defineOpts(
                () => {

                    for (const [event, listener] of eventListeners) {
                        component.off(event, listener);
                    }
                }
            )
        });

        return component;
    }

    on(event: string, listener: Function) {


        const stored = this._callbacks.get(event);

        if (stored) {
            stored.add(listener);
        } else {

            const fns: CallbacksSet = new Set();
            fns.add(listener);

            this._callbacks.set(event, fns);
        }

        return this._target;
    }

    one(event: string, listener: Function) {

        return implementOne(this, event, listener);
    }

    off(event: string, listener: Function) {

        if (event === ALL_CALLBACKS && !listener) {

            this._callbacks.clear()
        } else {

            if (listener) {
                const fns = this._callbacks.get(event)

                if (fns) {

                    fns.delete(listener)
                    if (fns.size === 0) this._callbacks.delete(event)
                }
            } else this._callbacks.delete(event)
        }

        return this._target;
    }

    trigger(event: string, ...args: any[]) {


        const fns = this._callbacks.get(event)

        if (fns) fns.forEach(fn => fn.apply(this, args))

        if (this._callbacks.get(ALL_CALLBACKS) && event !== ALL_CALLBACKS) {
            this.trigger(ALL_CALLBACKS, event, ...args)
        }

        return this._target;
    }

}