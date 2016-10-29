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
  // box.state.model.items[0].name
  // item
  setTimeout(() => {
    console.log(box.state.model.items[0]);
  });
  // .update('asdf', item => {
  //   console.log(item.created.valueOf());
  //   return item;
  // });
  // let atColor = box.at(box.state.view.color);
  // if (box.state.view.color === 'LIGHT') {
  //   atColor.update('Make Dark', () => 'DARK');
  // } else {
  //   atColor.update('Make Light', () => 'LIGHT');
  // }
}
