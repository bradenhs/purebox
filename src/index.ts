import * as React from 'react';
import { some, each, cloneDeep } from 'lodash';

const styles = {
  error: 'font-weight: bold; color: #900',
  operationName: [
    'color: #333',
    'padding: 0 4px',
  ].join(';'),
  round: [
    'padding: 0px 3px',
    'color: #666',
    'font-weight: 500',
  ].join(';'),
  addition: [
    'background: #090',
    'border-radius: 2px',
    'padding: 0px 3px',
    'color: #fff',
    'font-weight: 500',
    'margin-left: 3px',
  ].join(';'),
  removal: [
    'background: #700',
    'border-radius: 2px',
    'padding: 0px 3px',
    'color: #fff',
    'font-weight: 500',
    'margin-left: 3px',
  ].join(';'),
  modification: [
    'background: #009',
    'border-radius: 2px',
    'padding: 0px 3px',
    'color: #fff',
    'font-weight: 500',
    'margin-left: 3px',
  ].join(';'),
  noChanges: [
    'padding: 0px 3px',
    'color: #666',
    'font-style: italic',
    'font-weight: 500',
    'margin-left: 3px',
  ].join(';'),
};

const BOX = '__pure_box_object';
const PATH = '__pure_box_path';
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
  StateProvider: React.ClassicComponentClass<IProviderProps<State>>;
  pureComponent<T>(
    component: (props: T) => JSX.Element
  ): React.ClassicComponentClass<T>;
  update(operationName: string, updater: (state: State) => void): void;
  observe(observer: (state?: State) => void);
}

interface IDiff {
  updateType: 'add' | 'remove' | 'modify';
  path: string;
  newValue: string;
  previousValue: string;
}

interface IOperation {
  round: number;
  name: string;
  diffs: IDiff[];
}

class PureBox<State> implements IPureBox<State> {
  private _stateProxy: State;
  private _state: State;
  private _observersToNotify: (() => void)[] = [];
  private _queuedUpdates: (() => void)[] = [];
  private _mutating: boolean = false;
  private _round: number;
  private _options: IPureBoxOptions;
  private _history: IOperation[] = [];

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
    operationName: string, obj: T, updater: (obj: T) => void
  ) {

    // Ensure object to modify is part of state tree
    if (obj === null) {
      console.log(
        '%cPureBox: Error with operation ' + operationName,
        styles.error
      );
      throw Error('The object you provided was null');
    }
    if (!this._isPartOfStateTree(obj)) {
      console.log(
        '%cPureBox: Error with operation ' + operationName,
        styles.error
      );
      throw Error(
        `The object you provided to the box's update method does not appear to
        be a part of the state's tree.`
      );
    }
    if (operationName === void 0) {
      console.log(
        '%cPureBox: Error no operation name provided',
        styles.error
      );
      throw Error('An operation name must be provided when updating the state');
    }
    if (operationName.trim() === '') {
      console.log(
        '%cPureBox: Invalid operation name',
        styles.error
      );
      throw Error('The operation name must not be an empty or blank string');
    }

    // Reset observers to notify
    this._observersToNotify = [];

    // Run the updater
    this._history.push({
      round: this._round,
      name: operationName.trim(), diffs: [],
    });
    this._mutating = true;
    updater(obj);
    this._mutating = false;

    // Log updates
    if (this._options.devMode && this._options.logging) {
      this._logOperation(this._currentOperation());
    }

    // Notify observers
    each(this._observersToNotify, observer => observer());
  }

  private _logOperation(operation: IOperation) {
    const additions = operation.diffs.filter(
      diff => diff.updateType === 'add'
    ).length;
    const removals = operation.diffs.filter(
      diff => diff.updateType === 'remove'
    ).length;
    const modifications = operation.diffs.filter(
      diff => diff.updateType === 'modify'
    ).length;
    const updateTypeStyles = [];
    if (additions > 0) {
      updateTypeStyles.push(styles.addition);
    }
    if (removals > 0) {
      updateTypeStyles.push(styles.removal);
    }
    if (modifications > 0) {
      updateTypeStyles.push(styles.modification);
    }
    const noChanges = additions < 1 && removals < 1 && modifications < 1;
    if (noChanges) {
      updateTypeStyles.push(styles.noChanges);
    }
    (console as any).groupCollapsed(
      `%c${operation.round}%c${operation.name}` +
      (additions > 0 ? `%c${additions > 1 ? additions : ''}+` : '') +
      (removals > 0 ? `%c${removals > 1 ? removals : ''}-` : '') +
      (modifications > 0 ? `%c${modifications > 1 ? modifications : ''}•` : '') +
      (noChanges ? '%cNo changes' : ''),
      styles.round,
      styles.operationName,
      ...updateTypeStyles,
    );
    console.groupEnd();
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

    Object.defineProperty(node, PATH, {
      value: (parent === void 0 ? '' : (parent[PATH] || '') + '/' +
        Object.keys(parent).find(key => parent[key] === node)),
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
          console.log('%cPUREBOX ERROR:', styles.error);
          throw Error(
            'Mutating the state outside of the PureBox update method ' +
            'is not allowed.'
          );
        }
        let oldVal = target[key];
        target[key] = this._proxy(value, target);
        if (this._isPrimitive(oldVal) && target[key] === oldVal) {
          return true;
        }

        this._recordDiff(target, key, value, oldVal);

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

  private _recordDiff(obj, key, newValue, previousValue) {
    if (Array.isArray(obj) && key === 'length' && newValue < previousValue) {
      let removedItemIndex = newValue;
      while (removedItemIndex < previousValue) {
        this._currentOperation().diffs.push({
          updateType: 'remove', path: obj[PATH] + `[${removedItemIndex}]`,
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
    this._currentOperation().diffs.push({
      updateType, newValue: cloneDeep(newValue),
      previousValue: cloneDeep(previousValue),
      path: obj[PATH],
    });
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

export function createBox<T>(
  initialState: T, options?: IPureBoxOptions
): IPureBox<T> {
  return new PureBox(initialState, options);
}
