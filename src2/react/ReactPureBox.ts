import { PureBoxBase } from '../PureBoxBase';

export class ReactPureBox<State> extends PureBoxBase<State> {
  public static createBox<T>(initialState: T) {
    return new ReactPureBox(initialState);
  }
}
