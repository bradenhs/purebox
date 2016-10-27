import { createBox } from '../purebox/';

export interface IItem {
  text: string;
  checked: boolean;
  created: Date;
}

export interface IModel {
  listName: string;
  items: IItem[];
}

export type Color = 'DARK' | 'LIGHT';

export enum Sort {
  NEWEST_FIRST, OLDEST_FIRST,
}

export interface IView {
  color: Color;
  sort: Sort;

}

export interface IState {
  model: IModel;
  view: IView;
}

const initialState: IState = {
  model: {
    listName: '',
    items: [],
  },
  view: {
    color: 'LIGHT',
    sort: Sort.NEWEST_FIRST,
  },
};

export const box = createBox(initialState);

// blue 558ABB (light) 0095DD
// yellow FFE070 (light) FFF4CC
// red F08A81 (light) FAD7D4
// green 4E9E86 (light) 71D1B3
// grey DDE4E9
// light EEEEEE
// dark 666

const pureBoxStyle: string = [
  'background: #558ABB',
  'color: #EEEEEE',
  'padding: 2px 6px',
  'border-radius: 3px 0 0 3px',
  'font-weight: 200',
].join(';');

const operationStyle: string = [
  'background: #DDE4E9',
  'color: #666',
  'padding: 2px 6px',
  'border-radius: 0 3px 3px 0',
  'font-weight: 200',
].join(';');

const diffIdStyle: string = [
  'background: #FFE070',
  'border-radius: 3px',
  'margin-right: 5px',
  'padding: 2px 6px',
  'color: #666',
  'font-weight: 200',
].join(';');

const removeIndicatorStyle = [
  'color: #900',
  'margin-left: 5px',
  'font-size: 14px',
].join(';');

const removeAmountStyle = [
  'color: #900',
  'font-size: 7px',
].join(';');

const addIndicatorStyle = [
  'color: #070',
  'margin-left: 5px',
  'font-size: 14px',
].join(';');

const changeIndicatorStyle = [
  'color: #009',
  'margin-left: 5px',
  'font-size: 14px',
].join(';');

interface IChange {
  op: 'add' | 'remove' | 'change';
  key: string;
  value: any;
}

const changes = [
  { op: 'add', key: 'state.model.color', value: 'LIGHT' },
];

(console as any).groupCollapsed(
  '%c0%cPureBox%cAdd Tweet%c ✖%c✖%c7%c✚%c↔%c↔%c✚',
  diffIdStyle,
  pureBoxStyle,
  operationStyle,
  removeIndicatorStyle,
  removeIndicatorStyle,
  removeAmountStyle,
  addIndicatorStyle,
  changeIndicatorStyle,
  changeIndicatorStyle,
  addIndicatorStyle,
);
console.log('%cThis is styling', operationStyle);
console.groupEnd();
