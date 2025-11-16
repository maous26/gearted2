import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL", {
      // Provide a dummy URL for build phase when DATABASE_URL is not available
      // The real DATABASE_URL will be used at runtime for migrations and queries
      default: "postgresql://dummy:dummy@localhost:5432/dummy"
    }),
  },
});
