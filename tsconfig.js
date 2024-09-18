{
  "compileOnSave": false,
  "compilerOptions": {
    "ignoreDeprecations": "5.0",
    "baseUrl": ".",
    "incremental": false,
    "noImplicitAny": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react",
    "moduleResolution": "Node",
    "target": "ES2020",
    "module": "CommonJS",
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "strictBindCallApply": true,
    "lib": ["dom", "dom.iterable", "esnext"],
    "noUnusedLocals": true,
    "strict": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "allowJs": true
  },
  "ts-node": {
    "transpileOnly": true,
    "files": true,
    "compilerOptions": {
      "types": ["node"]
    }
  },
  "vueCompilerOptions": {
    "target": 3
  },
  "exclude": ["dist", "**/dist", "node_modules", "**/node_modules"],
  "include": ["src/**/*", "src/**/*.vue", "template/**/*", "template/**/*.vue"]
}
