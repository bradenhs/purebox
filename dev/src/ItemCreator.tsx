import * as React from 'react';
import { box } from './store';

export const ItemCreator = box.pureComponent(() =>
  <div className='item-creator'>
    <textarea/>
    <button onClick={() => addItem()}>Add</button>
  </div>
);

function addItem() {
  box.at(box.state.model)
  .update('Add Item', model => {
    model.items.push({
      created: new Date(),
      checked: false,
      text: 'Hello',
    });
    return model;
  });
}
