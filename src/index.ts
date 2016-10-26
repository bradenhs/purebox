import * as React from 'react';
import { some, each, cloneDeep } from 'lodash';

const BOX = '__pure_box_object';
const PROXY = '__pure_box_proxy';
const PARENT = '__pure_box_parent';
const OBSERVERS = '__pure_box_observers';
const ROUND_UPDATED = '__pure_box_round_updated';

//  ┌──────────┐
//  │          │
//  │   PURE   │
//  │          │
//  └──────────┘

export interface IPureBoxOptions {
  devMode: boolean;
  logging: boolean;
  debugger: string;
}

const defaultOptions: IPureBoxOptions = {
  devMode: true,
  logging: true,
  debugger: void 0,
};

interface IProviderState<T> {
  state: T;
}

export interface IProviderProps<T> {
  app: (props: {state: T}) => JSX.Element;
}

export interface IPureBox<State> {
  state: State;
  pureComponent<T>(
    component: (props: T) => JSX.Element
  ):React.ClassicComponentClass<T>;
  update(operationName: string, updater: (state: State) => void): void;
  observe(observer: (state?: State) => void);
  StateProvider: React.ClassicComponentClass<IProviderProps<State>>;
}

class PureBox<State> implements IPureBox<State> {
  private _stateProxy: State;
  private _state: State;
  private _observersToNotify: (() => void)[] = [];
  private _queuedUpdates: (() => void)[] = [];
  private _mutating: boolean = false;
  private _round: number;
  private _options: IPureBoxOptions;

  constructor(initialState: State, options: IPureBoxOptions = defaultOptions) {
    this._options = cloneDeep(options);
    this._state = cloneDeep(initialState);
    this._stateProxy = this._proxy(this._state);
  }

  public get state() {
    return this._stateProxy;
  }

  public pureComponent<T>(component: (props: T) => JSX.Element) {
    const getRound = () => this._round;
    return React.createClass<T, {}>({
      shouldComponentUpdate(nextProps) {
        return some(nextProps, (prop, key) => {
          if (prop !== this.props[key]) {
            return true;
          }
          if (typeof prop === 'object') {
            return prop[ROUND_UPDATED] === getRound();
          } else {
            return this.props[key] !== prop;
          }
        });
      },
      render() {
        return component(this.props);
      },
    });
  }

  public update(operationName: string, updater: (state: State) => void) {
    this._updateAt(operationName, this._stateProxy, updater);
  }

  public observe(observer: (state?: State) => void) {
    this._observeAt(this._stateProxy, observer);
  }

  private _observeAt<T>(stateChild: T, observer: (obj?: T) => void) {
    stateChild[OBSERVERS].push(observer);
  }

  private _updateAt<T>(
     operationName: string, stateChild: T, updater: (stateChild: T) => void
  ) {
    // Push the update to the update queue. If it's the only item on the queue
    // dequeue immediately.
    if (this._queuedUpdates.push(() => {
      this._update(operationName, stateChild, updater);
    }) === 1) {
     this._runNextUpdate();
    }
  }

  private _isPartOfStateTree(obj: Object) {
    if (obj === this._stateProxy) {
      return true;
    }
    let node = obj[PARENT];
    while (node !== this._stateProxy && node !== void 0) {
      node = node[PARENT];
    }
    return true;
  }

  private _update<T>(
    logMessage: string, obj: T, updater: (obj: T) => void
  ) {
    // Log updates
    if (this._options.devMode && this._options.logging) {
      console.log(logMessage);
    }

    // Ensure object to modify is part of state tree
    if (obj === null) {
      throw Error('The object you provided was null');
    }
    if (!this._isPartOfStateTree(obj)) {
      throw Error(
        `The object you provided to the box's update method does not appear to
        be a part of the state's tree.`
      );
    }

    // Reset observers to notify
    this._observersToNotify = [];

    // Run the updater
    this._mutating = true;
    updater(obj);
    this._mutating = false;

    // Store differences between old and updated
    // TODO

    // Notify observers
    each(this._observersToNotify, observer => observer());
  }

  private _runNextUpdate() {
    if (this._round === void 0) {
      this._round = 0;
    }
    if (this._queuedUpdates.length > 0) {
      this._queuedUpdates.shift()();
    } else {
      this._round++;
    }
  }

  private _proxy<T>(node: T, parent: any = this._stateProxy) {
    if (
      node === null  || node[PROXY] ||
      (typeof node !== 'object' && typeof node !== 'function')
    ) {
      return node;
    }

    Object.defineProperty(node, ROUND_UPDATED, {
      value: this._round,
      writable: true,
    });

    Object.defineProperty(node, OBSERVERS, {
      value: [],
      writable: true,
    });

    Object.defineProperty(node, PARENT, {
      value: parent,
    });

    let keys = Object.keys(node);
    for (let k of keys) {
      node[k] = this._proxy(node[k], node);
    }

    return new Proxy(node, {
      get: (target, key) => {
        if (key === PROXY) {
          return true;
        }
        if (key === BOX) {
          return this;
        }
        return target[key];
      },
      set: (target, key, value) => {
        if (!this._mutating) {
          throw Error('Can\'t touch this.');
        }
        let oldVal = target[key];
        target[key] = this._proxy(value, target);
        if (this._isPrimitive(oldVal) && target[key] === oldVal) {
          return true;
        }

        this._logDiff(target, key, value, oldVal);

        do {
          each(target[OBSERVERS], observer => {
            this._observersToNotify.push(() => observer(target));
          });
          target[ROUND_UPDATED] = this._round;
          target = target[PARENT];
        } while (target !== void 0 && target[ROUND_UPDATED] !== this._round);
        return true;
      },
    });
  }

  private _logDiff(obj, key, val, oldVal) {
    // add
    // replace
    // remove
    // copy
    // move

    if (Array.isArray(obj) && key === 'length' && val < oldVal) {
      let removedItemIndex = val;
      while (removedItemIndex < oldVal) {
        console.log('Removed index ' + removedItemIndex + ' from array');
        removedItemIndex++;
      }
    } else if (val === void 0) {
      console.log('removed');
    } else {
      console.log('Value changed to ' + JSON.stringify(val));
    }
  }

  private _isPrimitive(val) {
    return (
      val === void 0 ||
      val.constructor === Number ||
      val.constructor === String ||
      val.constructor === Boolean
    );
  }

  // tslint:disable-next-line
  public StateProvider = React.createClass<IProviderProps<State>, {}>({
    _addObserver: this.observe.bind(this),
    getState: () => this._stateProxy,
    componentDidUpdate: () => this._runNextUpdate(),
    componentWillMount() {
      this._addObserver(() => this.forceUpdate());
    },
    render() {
      return this.props.app({ state: this.getState() });
    },
  });
};

interface ICreateBoxParams<State> {
  initialState: State;
  options: IPureBoxOptions;
}

export function at<T>(stateChild: T) {
  if (
    stateChild.constructor === Number ||
    stateChild.constructor === String ||
    stateChild.constructor === Boolean
  ) {
    throw Error(
      '`at` takes an object that is a child of the box state. The primitive ' +
      'value you gave is not an object. Try passing in the parent of this ' +
      'property instead.'
    );
  }
  if (stateChild[BOX] === void 0) {
    throw Error(
      'The object you passed in is not part of any box object\'s state. Make ' +
      'sure you are passing in an object accessible through something like: ' +
      '[nameOfYourBox].state.some.property.that.is.an.object'
    );
  }
  return {
    update: (operationName: string, updater: (stateChild: T) => void) => {
      stateChild[BOX]._updateAt(operationName, stateChild, updater);
    },
    observe: (observer: (stateChild?: T) => void) => {
      stateChild[BOX]._observeAt(stateChild, observer);
    },
  };
}

export function createBox<T>(initialState: T, options?: IPureBoxOptions): IPureBox<T> {
  return new PureBox(initialState, options);
}
