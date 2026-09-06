class Env {
  public readonly DATABASE_URL: string;
  public readonly WEBAPP_URL: string;
  public readonly SERVER_URL: string;
  public readonly PORT: number;
  public readonly RESEND_API_KEY: string | undefined;
  public readonly COOKIE_SECRET: string;
  public NODE_ENV: "development" | "test" | "production";
  public readonly GITHUB_CLIENT_ID: string;
  public readonly GITHUB_CLIENT_SECRET: string;
  public readonly GITHUB_CALLBACK_URL: string;
  public TEST_DATABASE_URL?: string | undefined;

  constructor() {
    this.NODE_ENV = Env.#getNodeEnv();

    this.DATABASE_URL = Env.#getEnv("DATABASE_URL");
    this.WEBAPP_URL = Env.#getEnv("WEBAPP_URL");
    this.SERVER_URL = Env.#getEnv("SERVER_URL");
    this.PORT = Env.#getNumberEnv("PORT");

    this.RESEND_API_KEY =
      this.NODE_ENV === "production"
        ? Env.#getEnv("RESEND_API_KEY")
        : process.env["RESEND_API_KEY"];
    this.COOKIE_SECRET = Env.#getEnv("COOKIE_SECRET");

    this.GITHUB_CLIENT_ID = Env.#getEnv("GITHUB_CLIENT_ID");
    this.GITHUB_CLIENT_SECRET = Env.#getEnv("GITHUB_CLIENT_SECRET");
    this.GITHUB_CALLBACK_URL = Env.#getEnv("GITHUB_CALLBACK_URL");

    this.TEST_DATABASE_URL = Env.#getTestEnv("TEST_DATABASE_URL");
  }

  static #getEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
      throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
  }

  static #getTestEnv(name: string): string | undefined {
    if (process.env["NODE_ENV"] === "test") {
      if (!process.env[name]) {
        throw new Error(
          `Missing environment variable for test environment: ${name}`,
        );
      }
    }
    return process.env[name];
  }

  static #getNumberEnv(name: string): number {
    const value = Env.#getEnv(name);
    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      throw new Error(`Environment variable ${name} must be a number`);
    }

    return numberValue;
  }

  static #getNodeEnv(): "development" | "test" | "production" {
    const value = process.env["NODE_ENV"] ?? "development";

    if (value !== "development" && value !== "test" && value !== "production") {
      throw new Error("NODE_ENV must be one of: development, test, production");
    }

    return value;
  }
}

const env = new Env();

export { env };
