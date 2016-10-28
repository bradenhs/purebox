import { IState } from './store';
import * as React from 'react';
import { ColorSwitcher } from './ColorSwitcher';
import { ItemCreator } from './ItemCreator';

interface IAppProps {
  state: IState;
}

export const App = ({state}: IAppProps) =>
  <div className={getAppClassName(state)}>
    <ColorSwitcher color={state.view.color}/>
    Hello this is a test application.
    <ItemCreator/>
    {state.model.items.forEach(item => <div>{item.text}</div>)}
  </div>;

function getAppClassName(state: IState) {
  return `test-app ${state.view.color === 'DARK' ? 'dark' : 'light'}`;
}

