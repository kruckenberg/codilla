import type { FileSystemTree } from "@webcontainer/api";
export type { EditorView } from "@codemirror/view";
export type { Terminal } from "@xterm/xterm";
export type {
  FileNode,
  FileSystemTree,
  WebContainerProcess,
} from "@webcontainer/api";

export type { API } from "./API";
export type { IO } from "./IO";

export type MetaJSON = {
  exports: string[];
  file_system: FileSystemTree;
  has_tests: boolean;
  lesson_id: string;
  next_lesson: {
    title: string;
    link: string;
  };
  starter_code: string;
  user: {
    authenticated: boolean;
  };
};
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
