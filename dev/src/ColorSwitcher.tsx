import * as React from 'react';
import { at } from '../purebox';
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
  at(box.state.view)
  .update('Switch the Color', view => {
    view.color = color === 'DARK' ? 'LIGHT' : 'DARK';
  });
}