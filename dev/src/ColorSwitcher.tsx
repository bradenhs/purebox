import * as React from 'react';
import { box, Color } from './store';

interface IProps {
  color: Color;
}

export const ColorSwitcher = box.pureComponent(({color}: IProps) =>
  <div className='color-switcher'>
    {color === 'DARK' ? 'DARK' : 'LIGHT'} MODE
    <button onClick={() => switchMode()}>Switch Mode</button>
  </div>
);

function switchMode() {
  box.at(box.state.view.color)
  .update('No!', () => 'DARK');
  // box.at(box.state.view.color)
  // .update('Switch Color Theme', c => c === 'DARK' ? 'LIGHT' : 'DARK');
}
