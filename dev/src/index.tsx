import { box } from './store';
import * as ReactDOM from 'react-dom';
import { App } from './app';
import * as React from 'react';

ReactDOM.render(
  <box.StateProvider app={App}/>,
  document.querySelector('#purebox-dev')
);
