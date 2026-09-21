export function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }
  void import("@/server/env/validate").then(({ assertServerEnv }) => {
    assertServerEnv();
  });
}
