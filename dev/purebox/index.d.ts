/// <reference types="react" />
import * as React from 'react';
export interface IPureBoxOptions {
    devMode: boolean;
    logging: boolean;
    debugger: string;
}
export interface IProviderProps<T> {
    app: (props: {
        state: T;
    }) => JSX.Element;
}
export interface IDiff {
    updateType: 'add' | 'remove' | 'modify';
    path: string;
    newValue: string;
    previousValue: string;
}
export interface IOperation {
    round: number;
    name: string;
    diffs: IDiff[];
}
export declare class PureBox<State> {
    private _stateProxy;
    private _state;
    private _observersToNotify;
    private _queuedUpdates;
    private _mutatingObj;
    private _round;
    private _options;
    private _history;
    private _diffLoggerActive;
    constructor(initialState: State, options?: IPureBoxOptions);
    readonly state: State;
    pureComponent<T>(component: (props: T) => JSX.Element): React.ClassicComponentClass<T>;
    update(operationName: string, updater: (state: State) => State): void;
    observe(observer: (state?: State) => void): void;
    private _observeAt<T>(stateChild, observer);
    private _updateAt<T>(operationName, stateChild, updater);
    private _isPartOfStateTree(obj);
    private _update<T>(operationName, obj, updater);
    private _currentOperation();
    private _runNextUpdate();
    private _proxy<T>(node, parent?, keyInParent?);
    private _recordDiff(obj, key, newValue, previousValue);
    StateProvider: React.ClassicComponentClass<IProviderProps<State>>;
}
export declare function at<T>(stateChild: T): {
    update: (operationName: string, updater: (stateChild: T) => T) => void;
    observe: (observer: (stateChild?: T) => void) => void;
};
