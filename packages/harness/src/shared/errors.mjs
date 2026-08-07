export class FoundationError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'FoundationError';
    this.code = code;
    this.details = details;
  }
}
