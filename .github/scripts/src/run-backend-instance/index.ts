import * as Bun from "bun";

let backendProcess: Bun.Subprocess | undefined;

const BACKEND_URL = "http://localhost:8080/api";
const MAX_ATTEMPTS = 30;
const RETRY_DELAY_MS = 2000;
const SHUTDOWN_TIMEOUT_MS = 2000;

async function main(): Promise<void> {
  try {
    backendProcess = Bun.spawn(
      ["./mvnw", "-Dspring-boot.run.profiles=ci", "spring-boot:run"],
      {
        env: { ...process.env },
        stdin: "ignore",
        stdout: Bun.file("backend.log"),
        stderr: Bun.file("backend-error.log"),
      },
    );

    const ready = await waitForBackend();

    if (!ready) {
      throw new Error("Backend failed to start in time.");
    }

    console.log("Backend is ready.");
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exitCode = 1;
  } finally {
    await terminateBackend();
  }
}

async function waitForBackend(): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (backendProcess && backendProcess.exitCode !== null) {
      console.error(
        `Backend exited before becoming ready with code ${backendProcess.exitCode}.`,
      );

      return false;
    }

    try {
      const response = await fetch(BACKEND_URL);

      if (response.ok) {
        const data = (await response.json()) as { success?: boolean };

        if (data.success === true) {
          return true;
        }
      }
    } catch {
      // The backend is not ready yet
    }

    console.log(`Waiting for backend... (${attempt}/${MAX_ATTEMPTS})`);
    await Bun.sleep(RETRY_DELAY_MS);
  }

  return false;
}

async function terminateBackend(): Promise<void> {
  const processToStop = backendProcess;

  if (!processToStop) {
    return;
  }

  try {
    if (processToStop.exitCode === null) {
      processToStop.kill("SIGTERM");

      const exitedGracefully = await Promise.race([
        processToStop.exited.then(() => true),
        Bun.sleep(SHUTDOWN_TIMEOUT_MS).then(() => false),
      ]);

      if (!exitedGracefully && processToStop.exitCode === null) {
        console.warn("Backend did not stop gracefully. Forcing shutdown.");

        processToStop.kill("SIGKILL");
        await processToStop.exited;
      }
    }
  } finally {
    await printLog("BACKEND LOGS", "backend.log");
    await printLog("BACKEND ERROR LOGS", "backend-error.log");

    backendProcess = undefined;
  }
}

async function printLog(title: string, path: string): Promise<void> {
  console.log(`=== ${title} ===`);

  const file = Bun.file(path);

  if (!(await file.exists())) {
    console.log("No log file was created.");
  } else {
    const contents = await file.text();
    console.log(contents.trim() || "Log file is empty.");
  }

  console.log(`=== ${title} END ===`);
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exitCode = 1;
});