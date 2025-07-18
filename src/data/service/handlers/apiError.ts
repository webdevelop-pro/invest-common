export interface APIErrorData {
  timestamp: Date;
  response: Response;
  statusCode: number;
  responseJson: any;
}

export class APIError extends Error {
  public data: APIErrorData;

  constructor(message: string, response: Response) {
    super(message);

    // Maintains proper stack trace (only in V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }

    this.name = 'APIError';
    this.data = {
      timestamp: new Date(),
      response: response.clone(),
      statusCode: response.status,
      responseJson: null,
    };

    // Initialize responseJson asynchronously
    this.initializeResponseJson();
  }

  public async initializeResponseJson() {
    try {
      this.data.responseJson = await this.data.response.clone().json();
      this.message = this.getDetailedMessage();
    } catch (error) {
      this.data.responseJson = null;
    }
  }

  getDetailedMessage(): string {
    const { responseJson } = this.data;
    if (responseJson) {
      const uiMessage = responseJson.ui?.messages?.find((m: any) => m.type === 'error')?.text;
      const uiNodeMessage = responseJson.ui?.nodes?.find((node: any) => node.messages?.some((m: any) => m.type === 'error'))?.messages?.find((m: any) => m.type === 'error')?.text;

      return responseJson.__error__
            || responseJson.message
            || uiMessage
            || uiNodeMessage
            || this.message;
    }
    return this.message;
  }

  isClientError(): boolean {
    return this.data.statusCode >= 400 && this.data.statusCode < 500;
  }

  isServerError(): boolean {
    return this.data.statusCode >= 500;
  }
}
