import { ml, isPartOfStateTree } from './utilities';
import { cloneDeep, has, each, clone, forOwn } from 'lodash';
import { PATH, PROXY, PARENT, KEY_IN_PARENT } from './constants';

export abstract class PureBoxBase<State> {
  private _stateProxy: State;
  private _mutatingNode: Object;
  private _queuedUpdates: (() => void)[] = [];
  private _observersToNotify: (() => void)[] = [];
  private _round: number = 0;
  private _diffLoggerActive: boolean = true;

  protected constructor(initialState: State) {
    this._stateProxy = this._proxy(cloneDeep(initialState));
  }

  /**
   * Pushes an update onto the update queue. Updates are dequeued after the
   * previous update runs and all resulting view changes are complete.
   * @param operation Concise description of what the update function does.
   * @param update Function used to update the state.
   */
  public dispatch(operation: string, update: (state?: State) => State) {
    this._queuedUpdates.push(() => {
      this._runUpdate(this._stateProxy, operation, update);
    });
    if (this._queuedUpdates.length === 1) {
      this._runNextUpdate();
    }
  }

  protected _runNextUpdate() {
    if (this._queuedUpdates.length > 0) {
      this._queuedUpdates.shift()();
    } else {
      this._round++;
    }
  }

  private _runUpdate(
    node: Object, operation: string, update: (node: Object) => Object
  ) {
    this._ensureUpdateIsValid(node, operation, update);

    // Reset observers to notify
    this._observersToNotify = [];

    // Replace the node to be mutated
    this._mutatingNode = node;
    const nodeParent = this._mutatingNode[PARENT];
    const nodeKeyInParent = this._mutatingNode[KEY_IN_PARENT];
    this._mutatingNode = this._proxy(
      clone(this._mutatingNode), nodeParent, nodeKeyInParent
    );
    forOwn(this._mutatingNode, child => {
      if (child[PROXY] !== void 0) {
        child[PARENT] = this._mutatingNode;
      }
    });

    // Run the operation
    const operationResult = update(this._mutatingNode);
    
    // Hook the mutated node back into the state 
    if (operationResult === this._mutatingNode) {
      this._diffLoggerActive = false;
    }
    this._mutatingNode = nodeParent;
    this._mutatingNode[nodeKeyInParent] = operationResult;
    this._mutatingNode = void 0;
    this._diffLoggerActive = true;

    // Log updates
    // TODO

    // Notify observers
    each(this._observersToNotify, observer => observer());
  }

  private _ensureUpdateIsValid(
    node: Object, operation: string, update: (node: Object) => Object
  ) {
    if (this._mutatingNode !== void 0) {
      throw new Error(`[PUREBOX] An update may not dispatch another update.`);
    }
    if (operation === void 0) {
      throw new Error(
        ml`[PUREBOX] No operation name provided. An operation name must be
        provided when updating the state.`
      );
    }
    if (operation.trim() === '') {
      throw new Error(
        ml`[PUREBOX] Invalid operation name. The operation name must not be an
        empty or blank string`
      );
    }
    if (!isPartOfStateTree(node, this._stateProxy)) {
      throw new Error(
        ml`[PUREBOX] Error with operation ${operation}. The value you
        provided to the box's update method does not appear to be a part 
        of the state's tree.`
      );
    }
    if (update === void 0) {
      throw new Error('the update must be defined');
    }
  }

  private _proxy<T>(
    node: T, parent: Object = this._stateProxy, keyInParent: string = ''
  ) {
    if (
      node === null || node === void 0 || node[PROXY] !== void 0 ||
      (typeof node !== 'object' && typeof node !== 'function') ||
      node.constructor === Date
    ) {
      return node;
    }

    let child = Array.isArray(parent) ? `[${keyInParent}]` : `.${keyInParent}`;
    const path = parent === void 0 ? 'state' : parent[PATH] + child;

    const specialProxyValues = [];
    specialProxyValues[PATH] = () => path;

    const nodeProxy = new Proxy(node, {
      get: (target, key) => {
        if (has(specialProxyValues, key) &&
            specialProxyValues[key].constructor === Function) {
          return specialProxyValues[key]();
        }
        return target[key];
      },
      set: (target, key, value) => {
        if (this._mutatingNode === void 0) {
          throw Error(
            ml`[PUREBOX] Mutating the state outside of the PureBox update method
            is not allowed.`
          );
        }
        target[key] = value;
        return true;
      },
    });

    Object.defineProperty(node, PROXY, {
      value: nodeProxy,
    });

    let keys = Object.keys(node);
    for (let key of keys) {
      node[key] = this._proxy(node[key], nodeProxy, key);
    }

    return nodeProxy;
  }
}
