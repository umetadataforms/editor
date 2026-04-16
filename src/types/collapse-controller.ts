export type CollapseController = {
  collapseAll: (kind: 'fields' | 'variables') => void;
  expandItem: (kind: 'fields' | 'variables', index: number) => void;
  setInstantCollapse: (next: boolean) => void;
};
