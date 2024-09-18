
const getKey = (keyName: string) => (
  keyName
);

export class StorageService<T> {
  private key: string;

  constructor(
    private baseKey: string,
    prefix = '',
  ) {
    this.key = prefix ? `${prefix}-${baseKey}` : baseKey;
  }

  public get(): T | void;

  public get(defaults: T): T;

  public get(defaults?: T) {
    const key = getKey(this.key);

    const str = localStorage.getItem(key);

    if (defaults !== void 0 && str === null) return defaults;
    if (!str) return defaults;

    try {
      return JSON.parse(str) as T;
    } catch {
      return defaults;
    }
  }

  public set(data: unknown) {
    const key = getKey(this.key);

    if (typeof data === 'object') {
      const json = JSON.stringify(data);
      localStorage.setItem(key, json);
    } else {
      localStorage.setItem(key, data as string);
    }

    return this;
  }

  public remove() {
    const key = getKey(this.key);
    localStorage.removeItem(key);
    return this;
  }
}
