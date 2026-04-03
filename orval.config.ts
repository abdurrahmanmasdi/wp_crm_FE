import { defineConfig } from 'orval';

export default defineConfig({
  crm: {
    input: {
      target: process.env.OPENAPI_SPEC_URL || 'http://localhost:3000/docs-json',
    },
    output: {
      mode: 'split',
      target: 'src/api-generated/endpoints.ts',
      schemas: 'src/api-generated/model',
      client: 'react-query',
      clean: true,
      prettier: true,
      override: {
        query: {
          useQuery: true,
          useInfinite: false,
        },
      },
    },
  },
});
