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
  box.at((() => {
    console.log(box.state.view.color);
    return 'LIGHT';
  })())
  .update(
    'Switch Theme',
    color => color === 'DARK' ? 'LIGHT' : 'DARK'
  );
}
