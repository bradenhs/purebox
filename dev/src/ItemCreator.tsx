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
  at(box.state.model)
  .update('Add Item', model => {
    model.items = [
      {
        created: new Date(),
        text: 'hi',
        checked: false,
      },
    ];
    model.listName = 'Hello';
    return model;
  });
}
