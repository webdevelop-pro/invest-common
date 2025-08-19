declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '*.scss' {
  const styles: Record<string, string>;

  export default styles;
}

declare module '*.svg' {
  const component: string;
  export default component;
}

declare module 'vue-svg-inline-plugin' {
  import type { Plugin } from 'vue';
  const plugin: Plugin;
  export default plugin;
}

declare module 'hellosign-embedded';

declare module "*.md";

declare module 'marked';
