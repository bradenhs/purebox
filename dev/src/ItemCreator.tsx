import * as React from 'react';
import { box } from './store';

export const ItemCreator = box.pureComponent(() =>
  <div className='item-creator'>
    <textarea/>
    <button onClick={() => addItem()}>Add</button>
  </div>
);

function addItem() {
  box.at(box.state.model.items)
  .update('Add Item', items => {
    items.push({
      created: new Date(),
      checked: false,
      text: 'Hello',
    });
    console.log(items[items.length - 1].created.valueOf());
    return items;
  });
}
