export class ParseError extends Error {
  name: string;

  constructor(message: string) {
    super(`ERROR: ${message}`);
    this.name = "ParseError";
  }
}

export class MissingExportError extends Error {
  name: string;

  constructor(message: string) {
    super(`ERROR: ${message}`);
    this.name = "MissingExportError";
  }
}
