/**
 * LIFO(후입선출) 스택.
 * 모든 연산이 O(1).
 *
 * @example
 * const s = new Stack([1, 2, 3]);
 * s.push(4);
 * s.pop();   // 4
 * s.peek();  // 3
 */
export class Stack<T> {
  private items: T[];

  constructor(initial: T[] = []) {
    this.items = [...initial];
  }

  /** 스택의 top에 요소를 추가한다. O(1) */
  push(item: T): this {
    this.items.push(item);
    return this;
  }

  /** 스택의 top에서 요소를 꺼내 반환한다. 비어 있으면 undefined. O(1) */
  pop(): T | undefined {
    return this.items.pop();
  }

  /** top 요소를 반환하되 제거하지 않는다. O(1) */
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  /** 스택이 비어 있는지 확인한다. */
  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  /** 현재 스택의 요소 수. */
  get size(): number {
    return this.items.length;
  }

  /** 스택을 비운다. */
  clear(): void {
    this.items = [];
  }

  /** 요소들을 bottom→top 순서로 배열로 반환한다. */
  toArray(): T[] {
    return [...this.items];
  }
}
