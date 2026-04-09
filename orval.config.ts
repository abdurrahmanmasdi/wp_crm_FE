import { defineConfig } from 'orval';

export default defineConfig({
  crm: {
    input: {
      target: process.env.OPENAPI_SPEC_URL || 'http://localhost:3000/docs-json',
    },
    output: {
      mode: 'tags',
      target: 'src/api-generated/endpoints/index.ts',
      schemas: 'src/api-generated/model',
      client: 'react-query',
      clean: true,
      prettier: true,
      override: {
        mutator: {
          path: 'src/lib/api-custom-instance.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useInfinite: false,
        },
      },
    },
  },
});
