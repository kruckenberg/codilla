export type { Terminal } from "@xterm/xterm";
export type {
  FileNode,
  FileSystemTree,
  WebContainerProcess,
} from "@webcontainer/api";

export type Logger = (message: string) => void;
export type JSONReport = {
  failures: [];
  passes: [];
  pending: [];
  stats: {
    suites: number;
    tests: number;
    passes: number;
    pending: number;
    failures: number;
  };
  tests: {
    title: string;
    fullTitle: string;
    duration: number;
    currentRetry: number;
    err: {
      actual: unknown;
      expected: unknown;
      message: string;
      operator: string;
      stack: string;
    };
  }[];
};
