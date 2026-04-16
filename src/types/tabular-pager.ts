export type TabularPager = {
  isTabularSchema: boolean;
  isTabularVcSchema: boolean;
  pageSize: number;
  setTabularPage: (kind: 'fields' | 'variables', page: number) => void;
};
