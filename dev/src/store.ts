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
