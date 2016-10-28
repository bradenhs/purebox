import { IOperation } from './index';
import { styles } from './logStyles';

export const log = {
  operation(op: IOperation) {
    const additions = op.diffs.filter(
      diff => diff.updateType === 'add'
    ).length;
    const removals = op.diffs.filter(
      diff => diff.updateType === 'remove'
    ).length;
    const modifications = op.diffs.filter(
      diff => diff.updateType === 'modify'
    ).length;
    (console as any).groupCollapsed(
      `%c${op.round}%c${op.name} ` +
      `%c${additions}(+)%c${removals}(-)%c${modifications}(•)`,
      styles.round,
      styles.operationName,
      additions > 0 ? styles.addition : styles.muted,
      removals > 0 ? styles.removal : styles.muted,
      modifications > 0 ? styles.modification : styles.muted,
    );
    console.log(
      '%cadd%cremove%cmodify',
      styles.addition,
      styles.removal,
      styles.modification
    );
    op.diffs.forEach(({updateType, path, newValue, previousValue}) => {
      let formatters = {
        'undefined': '%s',
        'object': '%O',
        'boolean': '%s',
        'number': '%d',
        'string': '%s',
        'symbol': '%s',
        'function': '%O',
      };
      let updateTypeSymbol = {
        'add': '+',
        'remove': '-',
        'modify': '•',
      };
      console.log(
        `%c${updateTypeSymbol[updateType]}%c ${path} ` +
        `%c${formatters[typeof previousValue]}` +
        ` → ${formatters[typeof newValue]}`,
        {
          'add': styles.addition,
          'remove': styles.removal,
          'modify': styles.modification,
        }[updateType],
        styles.operationName,
        '',
        previousValue,
        newValue
      );
    });
    console.groupEnd();
  },
};
