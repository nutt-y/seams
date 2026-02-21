import { exit } from "node:process";
import type winston from "winston";
import { SPLIT_SEQUENCE } from "./constants.ts";
import type { LSPRequestMessage } from "./methods/message.types.ts";

/**
 * Encodes the message to be used
 * @param message The message to encode and send
 * @returns message as a string
 */
export const encodeMessage = (
  message: unknown,
  logger: winston.Logger,
): Uint8Array<ArrayBuffer> => {
  try {
    const messageString = JSON.stringify(message);
    const body = new TextEncoder().encode(messageString);
    const header = new TextEncoder().encode(
      `Content-Length: ${body.length}\r\n\r\n`,
    );

    // Create buffer of complete send
    const out = new Uint8Array(header.length + body.length);
    out.set(header, 0);
    out.set(body, header.length);

    return out;
  } catch (error) {
    logger.error("error in encodeMessage: ", error);
    exit(1);
  }
};

/**
 * Decode the message into a readable format
 * @param message The message to decode
 * @para logger The logger for logging info
 * @returns a tuple with the first value being the method and the second with the content
 */
export const decodeMessage = (
  message: string,
  logger: winston.Logger,
): LSPRequestMessage => {
  let content: LSPRequestMessage = {
    id: -1,
    jsonrpc: "",
    method: "",
  };

  try {
    content = JSON.parse(message);
  } catch (error) {
    logger.info(`Error decoding message: ${error}`);
  }

  return content;
};

/**
 * Split the incoming data and parse it correctly based on the format required
 * @param data The data scanned
 */
export const split = (
  data: string,
): { error: boolean; advance: number; token: string } => {
  const parts = data.split(SPLIT_SEQUENCE);

  // Not the right format
  if (parts.length !== 2) {
    return {
      error: true,
      advance: 0,
      token: "",
    };
  }

  const [header, _] = parts;

  // Get the length of the content
  const contentLengthBytes = header.slice("Content-Length: ".length);
  const contentLength = parseInt(contentLengthBytes, 10);

  // Not the right number format
  if (Number.isNaN(contentLength)) {
    return {
      advance: 0,
      error: true,
      token: "",
    };
  }

  // Get the current length
  const totalLength = header.length + SPLIT_SEQUENCE.length + contentLength;

  return {
    advance: totalLength,
    token: data.slice(0, totalLength),
    error: false,
  };
};
