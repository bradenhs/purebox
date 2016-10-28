import * as React from 'react';
import { box } from './store';
import { at } from '../purebox';

export const ItemCreator = box.pureComponent(() =>
  <div className='item-creator'>
    <textarea/>
    <button onClick={() => addItem()}>Add</button>
  </div>
);

function addItem() {
  at(box.state.model.items)
  .update('Add Item', items => {
    items.push({
      created: new Date(),
      checked: false,
      text: 'Hello',
    });
    return items;
  });
}
