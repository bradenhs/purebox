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
export interface IPureBox<State> {
    state: State;
    StateProvider: React.ClassicComponentClass<IProviderProps<State>>;
    pureComponent<T>(component: (props: T) => JSX.Element): React.ClassicComponentClass<T>;
    update(operationName: string, updater: (state: State) => void): void;
    observe(observer: (state?: State) => void): any;
}
export declare function at<T>(stateChild: T): {
    update: (operationName: string, updater: (stateChild: T) => void) => void;
    observe: (observer: (stateChild?: T) => void) => void;
};
export declare function createBox<T>(initialState: T, options?: IPureBoxOptions): IPureBox<T>;
