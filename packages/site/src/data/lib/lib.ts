export class TypedResponse<T> extends Response {
  data: T;

  constructor(body: T, opts?: ResponseInit) {
    super(JSON.stringify(body), opts);
    this.data = body;
  }
}
