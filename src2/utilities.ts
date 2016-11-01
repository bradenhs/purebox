import { PARENT } from './constants';

export function ml(strings: TemplateStringsArray, ...values: Object[]) {
  let output = '';
  for (let i = 0; i < values.length; i++) {
    output += strings[i] + values[i];
  }
  output += strings[values.length];
  let lines = output.split(/(?:\r\n|\n|\r)/);
  return lines.map((line) => {
    return line.replace(/^\s+/gm, '');
  }).join(' ').trim();
}

export function isPartOfStateTree(node: Object, root: Object) {
  while (node !== root && node !== void 0) {
    node = node[PARENT];
  }
  return node !== void 0;
}

export function validateUpdate()