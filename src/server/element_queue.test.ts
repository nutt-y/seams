import { assertEquals } from "@std/assert";
import { ElementQueue } from "./element_queue.ts";

Deno.test("ElementQueue enqueueElement adds items to queue", () => {
  const queue = new ElementQueue<string>();

  queue.enqueueElement(["a", "b", "c"]);

  const items = queue.getAll();
  assertEquals(items, ["a", "b", "c"]);
});

Deno.test("ElementQueue enqueueElement can add more items", () => {
  const queue = new ElementQueue<number>();

  queue.enqueueElement([1, 2]);
  queue.enqueueElement([3]);

  const items = queue.getAll();
  assertEquals(items, [1, 2, 3]);
});

Deno.test("ElementQueue getAll returns a copy", () => {
  const queue = new ElementQueue<string>();
  queue.enqueueElement(["original"]);

  const items = queue.getAll();
  items.push("modified");

  const items2 = queue.getAll();
  assertEquals(items2, ["original"]);
});

Deno.test("ElementQueue dispatches event on enqueue", () => {
  const queue = new ElementQueue<string>();
  let eventFired = false;

  queue.addEventListener(ElementQueue.Events.ITEMSADDED, () => {
    eventFired = true;
  });

  queue.enqueueElement(["test"]);

  assertEquals(eventFired, true);
});

Deno.test("ElementQueue event detail contains items and queue", () => {
  const queue = new ElementQueue<string>();
  let detail: { items: string[]; queue: string[] } | undefined;

  queue.addEventListener(ElementQueue.Events.ITEMSADDED, (e) => {
    detail = (e as CustomEvent<{ items: string[]; queue: string[] }>).detail;
  });

  queue.enqueueElement(["a", "b"]);

  assertEquals(detail?.items, ["a", "b"]);
  assertEquals(detail?.queue, ["a", "b"]);
});
