import { SPLIT_SEQUENCE } from "./constants.ts";

/**
 * Scan the buffer
 */
export async function* nextMessage(): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of Deno.stdin.readable) {
    // Append new data to buffer
    buffer += decoder.decode(chunk);

    // Try to extract the message from the buffer
    while (true) {
      const index = buffer.indexOf(SPLIT_SEQUENCE);

      if (index === -1) break; // Not enough data

      // Isolate the header
      const header = buffer.substring(0, index);
      const contentLengthBytes = header.slice("Content-Length: ".length);
      const contentLength = parseInt(contentLengthBytes, 10);

      if (Number.isNaN(contentLength)) {
        throw new Error("Invalid LSP Header");
      }

      // Calculate where this message ends
      const totalLength = header.length + SPLIT_SEQUENCE.length + contentLength;

      // Check if we have the full body of the buffer
      if (buffer.length < totalLength) {
        break; // Stop and wait for more chunks
      }

      // Extract the full message
      const fullMessage = buffer.substring(0, totalLength);
      const [_, message] = fullMessage.split(SPLIT_SEQUENCE);

      // Send it
      yield message;

      // Remove the processed message from the buffer
      buffer = buffer.substring(totalLength);
    }
  }
}

// Mutex lock that makes sure only one request is processed to stdout at a time
let sendLockResolve: (() => void) | null = null;
let sendLock = Promise.resolve();

/**
 * Send a reply
 * @param reply The response message to encode and send
 */
export async function sendReply(reply: Uint8Array<ArrayBuffer>) {
  await sendLock;

  sendLock = new Promise((resolve) => {
    sendLockResolve = resolve;
  });

  let offset = 0;

  while (offset < reply.length) {
    const content = reply.subarray(offset);
    const written = Deno.stdout.writeSync(content);

    offset += written;
  }

  sendLockResolve?.();
}
