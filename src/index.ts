import * as React from 'react';
import { some, each, cloneDeep, has, clone, forOwn } from 'lodash';
import { log } from './log';
import { ml } from './utils';

const LAST = '__pure_□_proxy_chain_last';
const BOX = '__pure_□_object';
const PATH = '__pure_□_path';
const PROXY = '__pure_□_proxy';
const PARENT = '__pure_□_parent';
const OBSERVERS = '__pure_□_observers';
const ROUND_UPDATED = '__pure_□_round_updated';
const ROUND_HIT = '__pure_□_round_hit';
const KEY_IN_PARENT = '__pure_□_key_in_parent';

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

export class PureBox<State> {
  private _stateProxy: State;
  private _state: State;
  private _observersToNotify: (() => void)[] = [];
  private _queuedUpdates: (() => void)[] = [];
  private _mutatingObj: any;
  private _round: number;
  private _options: IPureBoxOptions;
  private _history: IOperation[] = [];
  private _diffLoggerActive: boolean = true;

  constructor(initialState: State, options: IPureBoxOptions = defaultOptions) {
    this._options = cloneDeep(options);
    this._state = cloneDeep(initialState);
    this._stateProxy = this._proxy(this._state);
  }

  public get state() {
    return this._stateProxy;
  }

  public at<T>(stateChild: T) {
    if (
      stateChild.constructor === Number ||
      stateChild.constructor === String ||
      stateChild.constructor === Boolean
    ) {
      throw Error(
        ml`[PUREBOX] 'at' takes an object that is a child of the box state. The
        primitive value you gave is not an object. Try passing in the parent
        of this property instead.`
      );
    }
    if (stateChild[BOX] !== this) {
      throw Error(
        ml`[PUREBOX] The object you passed in is not part of this box object's
        state. Make sure you are passing in an object accessible through
        something like: [nameOfYourBox].state.some.property.that.is.an.object`
      );
    }
    return {
      update: (operationName: string, updater: (stateChild: T) => T) => {
        stateChild[BOX]._updateAt(operationName, stateChild, updater);
      },
      observe: (observer: (stateChild?: T) => void) => {
        stateChild[BOX]._observeAt(stateChild, observer);
      },
    };
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

  public update(operationName: string, updater: (state: State) => State) {
    this._updateAt(operationName, this._stateProxy, updater);
  }

  public observe(observer: (state?: State) => void) {
    this._observeAt(this._stateProxy, observer);
  }

  private _observeAt<T>(stateChild: T, observer: (obj?: T) => void) {
    stateChild[OBSERVERS].push(observer);
  }

  private _updateAt<T>(
     operationName: string, stateChild: T, updater: (stateChild: T) => T
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
    operationName: string, obj: T, updater: (obj: T) => T
  ) {

    // Ensure object to modify is part of state tree
    if (obj === null) {
      throw Error(
        ml`[PUREBOX] Error with operation "${operationName}". The object
        you provided was null.`
      );
    }
    if (!this._isPartOfStateTree(obj)) {
      throw Error(
        ml`[PUREBOX] Error with operation ${operationName} The object you
        provided to the box's update method does not appear to be a part 
        of the state's tree.`
      );
    }
    if (operationName === void 0) {
      throw Error(
        ml`[PUREBOX] No operation name provided. An operation name must be
        provided when updating the state.`
      );
    }
    if (operationName.trim() === '') {
      throw Error(
        ml`[PUREBOX] Invalid operation name. The operation name must not be an
        empty or blank string`
      );
    }

    // Reset observers to notify
    this._observersToNotify = [];

    // Run the updater
    this._history.push({
      round: this._round,
      name: operationName.trim(), diffs: [],
    });

    const objParent = obj[PARENT];
    const objKeyInParent = obj[KEY_IN_PARENT];
    this._mutatingObj = this._proxy(clone(obj), objParent, objKeyInParent);
    forOwn(this._mutatingObj, child => {
      if (child[PROXY] !== void 0) {
        child[PARENT] = this._mutatingObj;
      }
    });
    const updateResult = updater(this._mutatingObj);
    if (updateResult === this._mutatingObj) {
      this._diffLoggerActive = false;
    }
    this._mutatingObj = objParent;
    objParent[objKeyInParent] = updateResult;
    this._mutatingObj = void 0;
    this._diffLoggerActive = true;

    // Log updates
    if (this._options.devMode && this._options.logging) {
      log.operation(this._currentOperation());
    }

    // Notify observers
    each(this._observersToNotify, observer => observer());
  }

  private _currentOperation() {
    return this._history[this._history.length - 1];
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

  private _proxy<T>(
    node: T, parent: any = this._stateProxy, keyInParent: string = ''
  ) {
    if (
      node === null  || node === void 0  || node[PROXY] !== void 0 ||
      (typeof node !== 'object' && typeof node !== 'function')
    ) {
      return node;
    }

    let child;
    if (Array.isArray(parent)) {
      child = `[${keyInParent}]`;
    } else {
      child = `.${keyInParent}`;
    }
    let path = parent === void 0 ? 'state' : parent[PATH] + child;
    let roundUpdated;
    let roundHit;
    let observers = [];

    const specialProxyValues = [];
    specialProxyValues[OBSERVERS] = () => observers;
    specialProxyValues[PATH] = () => path;
    specialProxyValues[ROUND_UPDATED] = () => roundUpdated;
    specialProxyValues[PARENT] = () => parent;
    specialProxyValues[ROUND_HIT] = () => roundHit;
    specialProxyValues[KEY_IN_PARENT] = () => keyInParent;
    specialProxyValues[BOX] = () => this;

    const nodeProxy = new Proxy(node, {
      get: (target, key) => {
        if (has(specialProxyValues, key) &&
            specialProxyValues[key].constructor === Function) {
          return specialProxyValues[key]();
        }
        return target[key];
      },
      set: (target, key, value) => {
        if (this._mutatingObj === void 0) {
          throw Error(
            ml`[PUREBOX] Mutating the state outside of the PureBox update
            method is not allowed.`
          );
        }

        if (key === ROUND_HIT) {
          roundHit = value;
          return true;
        }

        if (key === ROUND_UPDATED) {
          roundUpdated = value;
          return true;
        }

        if (key === PARENT) {
          parent = value;
          return true;
        }

        let oldVal = target[key];

        if (oldVal === value) {
          return true;
        }

        let proxyChain = new Proxy([target[PROXY]], {
          get: (t, k) => k === LAST ? t[t.length - 1] : t[k],
        });
        target[key] = this._proxy(value, proxyChain[LAST], key as string);

        let hitMutatingObject = false;
        do {
          if (proxyChain[LAST][ROUND_HIT] === this._round ||
              proxyChain[LAST] === this._mutatingObj) {
            hitMutatingObject = true;
            proxyChain.forEach(item => item[ROUND_HIT] = this._round);
          }
          each(proxyChain[LAST][OBSERVERS], observer => {
            this._observersToNotify.push(() => observer(proxyChain[LAST]));
          });
          proxyChain[LAST][ROUND_UPDATED] = this._round;
          proxyChain.push(proxyChain[LAST][PARENT]);
        } while (
          proxyChain[LAST] !== void 0 &&
          proxyChain[LAST][ROUND_UPDATED] !== this._round
        );

        if (!hitMutatingObject) {
          throw Error(
            ml`[PUREBOX] Error while executing operation
            "${this._currentOperation().name}". Only the object provided in the
            update method is mutable.`
          );
        }
        if (this._diffLoggerActive) {
          this._recordDiff(target[PROXY], key, value, oldVal);
        }
        return true;
      },
    });

    Object.defineProperty(node, PROXY, {
      value: nodeProxy,
    });

    let keys = Object.keys(node);
    for (let k of keys) {
      node[k] = this._proxy(node[k], nodeProxy, k);
    }

    return nodeProxy;
  }

  private _recordDiff(obj, key, newValue, previousValue) {
    if (Array.isArray(obj) && key === 'length' && newValue < previousValue) {
      let removedItemIndex = newValue;
      while (removedItemIndex < previousValue) {
        this._currentOperation().diffs.push({
          updateType: 'remove', path: obj[PATH] + '[' + removedItemIndex + ']',
          newValue: void 0, previousValue: obj[removedItemIndex],
        });
        removedItemIndex++;
      }
    }
    let updateType: 'add' | 'remove' | 'modify';
    if (newValue === void 0) {
      updateType = 'remove';
    } else if (previousValue === void 0) {
      updateType = 'add';
    } else {
      updateType = 'modify';
    }
    let child;
    if (Array.isArray(obj) && isNaN(key)) {
      child = `["${key}"]`;
    } else if (Array.isArray(obj)) {
      child = `[${key}]`;
    } else {
      child = `.${key}`;
    }
    this._currentOperation().diffs.push({
      updateType, newValue: cloneDeep(newValue),
      previousValue: cloneDeep(previousValue),
      path: obj[PATH] + child,
    });
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
