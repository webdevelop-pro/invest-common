type IPlaid = {
  create: (args: unknown) => unknown;
}

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
  interface Window {
    Plaid: any | IPlaid;
  }
  const analytics: IAnalytics;
}

export default global;
