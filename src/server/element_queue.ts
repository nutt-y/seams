/**
 * A response queue that keeps track of the messages to be sent to the client
 */
export class ElementQueue<T> extends EventTarget {
  private queue: T[] = []; // The queue for the messages to send

  public static readonly Events = {
    // The events available to subscribe to
    ITEMSADDED: "itemadded",
  };

  /**
   * Enqueue an element
   * @param item The item to add to the queue
   */
  public enqueueElement(items: T[]): void {
    this.queue.push(...items);

    const event = new CustomEvent(ElementQueue.Events.ITEMSADDED, {
      detail: { items, queue: [...this.queue] },
    });

    this.dispatchEvent(event);
  }

  /**
   * Get all elements queued
   */
  public getAll(): T[] {
    return [...this.queue];
  }
}
