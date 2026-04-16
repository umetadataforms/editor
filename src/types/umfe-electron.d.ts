type TabularGenerateResult = {
  data: Record<string, unknown>;
  sourcePath: string;
  fileName: string;
};

type TabularFileSelection = {
  canceled: boolean;
  filePath?: string;
};

declare global {
  interface Window {
    umfe?: {
      selectTabularFile: () => Promise<TabularFileSelection>;
    generateTabularMetadata: (options: { filePath: string; format: 'v0.0.2' | 'vc' }) => Promise<TabularGenerateResult>;
    };
  }
}

export {};
