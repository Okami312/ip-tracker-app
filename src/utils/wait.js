export const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (ms <= 0) {
      resolve();
      return;
    }

    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
