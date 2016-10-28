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
  at(() => box.state.view)
  .update('Switch Color Theme', view => {
    view.color = color === 'DARK' ? 'LIGHT' : 'DARK';
    return view;
  });
  // console.log(box.state.view.color);
  // at('LIGHT')
  // .update('Funny', () => 'DARK');
  // at(() => box.state.view.color)
  // .update('Make Dark', () => 'DARK');
  // at(() => view.color).update('Switch Color Theme', () => 'DARK');
  // box.update('Switch Color Theme', state =>
  // update('asdf', () => box.state, state => {
  //})  
  // );
  //
}
