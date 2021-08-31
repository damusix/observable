export interface ListenerCallback {
    (event: string, fn: Function): ObservableInstance;
}
export interface EmitterCallback {
    (event: string, ...args: any[]): ObservableInstance;
}
export declare type ObservableInstance = {
    on: ListenerCallback;
    one: ListenerCallback;
    off: ListenerCallback;
    trigger: EmitterCallback;
    $_cleanup: Function;
};
export default class Observable {
    private _callbacks;
    private _target;
    constructor(target?: any);
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
    extend(component: any, prefix?: string): ObservableInstance;
    on(event: string, listener: Function): any;
    one(event: string, listener: Function): any;
    off(event: string, listener: Function): any;
    trigger(event: string, ...args: any[]): any;
}
