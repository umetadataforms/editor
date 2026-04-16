export type ItemReorderController = {
  moveItem: (kind: 'fields' | 'variables', fromIndex: number, toIndex: number) => void;
};
