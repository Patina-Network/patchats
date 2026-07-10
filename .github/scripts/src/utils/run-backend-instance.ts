import * as Bun from "bun";

let backendProcess: Bun.Subprocess | undefined;

const BACKEND_URL = "http://localhost:8080/api";
const MAX_ATTEMPTS = 30;
const RETRY_DELAY_MS = 2000;

async function start(env: Record<string, string>) {
  try {
    backendProcess = Bun.spawn(
      ["./mvnw", "-Dspring-boot.run.profiles=ci", "spring-boot:run"],
      {
        env: { ...process.env, ...env },
        stdin: "ignore",
        stdout: Bun.file("backend.log"),
        stderr: Bun.file("backend-error.log"),
      },
    );

    const ready = await waitForBackend();

    if (!ready) {
      console.error("Backend failed to start in time.");
      await end();
      process.exit(1);
    }

    console.log("Backend is ready.");
  } catch (e) {
    console.error("Failed to start backend:", e);
    await end();
    process.exit(1);
  }
}

async function waitForBackend(): Promise<boolean> {
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    try {
      const response = await fetch(BACKEND_URL);

      if (response.ok) {
        const data = (await response.json()) as { success?: boolean };

        if (data.success === true) {
          return true;
        }
      }
    } catch {
      // Backend is not ready
    }

    console.log(`Waiting for backend... (${i}/${MAX_ATTEMPTS})`);
    await Bun.sleep(RETRY_DELAY_MS);
  }

  return false;
}

async function end() {
  if (backendProcess) {
    if (!backendProcess.killed) {
      backendProcess.kill();

      await new Promise((res) => {
        setTimeout(() => {
          res(null);
        }, 2000);
      });
    }
    console.log("=== BACKEND LOGS ===");
    const logs = await Bun.file("backend.log").text();
    logs
      .split("\n")
      .filter((s) => s.length > 0)
      .forEach((line) => console.log(line));
    console.log("=== BACKEND LOGS END ===");
  }
}

export const backend = {
  start,
  end,
};
