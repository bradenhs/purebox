import { PureBoxBase } from './PureBoxBase';

export class PureBox<State> extends PureBoxBase<State> {
  public static createBox<T>(initialState: T) {
    return new PureBox(initialState);
  }

  public viewUpdated() {
    this._runNextUpdate();
  }
}
