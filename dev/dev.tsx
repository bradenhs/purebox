import * as asdf from './purebox/';

interface IModel {
  name: string;
}

interface IView {
  color: string;
}

interface IState {
  model: IModel;
  view: IView;
}


