/**
 * FIFO(선입선출) 큐.
 * 내부적으로 head 포인터를 사용해 dequeue를 O(1)로 처리한다.
 * (배열의 shift()는 O(n)이므로 사용하지 않는다.)
 *
 * @example
 * const q = new Queue([1, 2, 3]);
 * q.enqueue(4);
 * q.dequeue();  // 1
 * q.peek();     // 2
 */
export class Queue<T> {
  private items: T[] = [];
  private head = 0;

  constructor(initial: T[] = []) {
    this.items = [...initial];
  }

  /** 큐의 끝에 요소를 추가한다. O(1) */
  enqueue(item: T): this {
    this.items.push(item);
    return this;
  }

  /** 큐의 앞에서 요소를 꺼내 반환한다. 비어 있으면 undefined. O(1) */
  dequeue(): T | undefined {
    if (this.head >= this.items.length) return undefined;
    const item = this.items[this.head];
    this.head++;
    // 절반 이상을 소비했으면 배열을 정리해 메모리 누수 방지
    if (this.head > this.items.length / 2) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return item;
  }

  /** 다음에 꺼낼 요소를 반환하되 제거하지 않는다. O(1) */
  peek(): T | undefined {
    return this.items[this.head];
  }

  /** 큐가 비어 있는지 확인한다. */
  get isEmpty(): boolean {
    return this.head >= this.items.length;
  }

  /** 현재 큐에 남아 있는 요소 수. */
  get size(): number {
    return this.items.length - this.head;
  }

  /** 큐를 비운다. */
  clear(): void {
    this.items = [];
    this.head = 0;
  }

  /** 요소들을 FIFO 순서로 배열로 반환한다. */
  toArray(): T[] {
    return this.items.slice(this.head);
  }
}
