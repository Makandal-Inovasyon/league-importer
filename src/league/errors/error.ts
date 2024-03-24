export class ErrorResponse extends Error {
  constructor(public message: string) {
    super(message);
  }
}
