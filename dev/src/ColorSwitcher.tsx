import * as React from 'react';
import { box, Color } from './store';

interface IProps {
  color: Color;
}

export const ColorSwitcher = box.pureComponent(({color}: IProps) =>
  <div className='color-switcher'>
    {color === 'DARK' ? 'DARK' : 'LIGHT'} MODE
    <button onClick={() => switchMode(color)}>Switch Mode</button>
  </div>
);

function switchMode(color: Color) {
  box.at(box.state.view)
  .update('Switch Color Theme', view => {
    view.color = color === 'DARK' ? 'LIGHT' : 'DARK';
    return view;
  });
}
