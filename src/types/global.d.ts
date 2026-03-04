interface IAnalytics {
  page: (a: string, b?: object) => void;
  track: (a: string, b?: object) => void;
}
declare global {
  interface NodeRequire {
    context: (
        directory: string,
        useSubdirectories: boolean,
        regExp: RegExp
    ) => unknown;
  }
  const analytics: IAnalytics;
}
export {};
