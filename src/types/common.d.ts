import { App } from 'vue';
import { Router } from 'vue-router';

export interface IInitPlugin {
  (app: App, options: {
    router: Router;
  }): void;
}

export type Plaid = unknown;
