/**
 * 이중 연결 리스트 (Doubly Linked List).
 *
 * 배열과 달리 중간 삽입/삭제가 O(1). LRU 캐시, undo 히스토리,
 * 작업 큐 등 빈번한 삽입/삭제가 필요한 곳에 적합하다.
 *
 * @example
 * const list = new LinkedList<number>();
 * list.pushBack(1).pushBack(2).pushBack(3);
 *
 * list.toArray();              // [1, 2, 3]
 * list.popFront();             // 1
 * list.pushFront(0);
 * list.toArray();              // [0, 2, 3]
 *
 * @example
 * // 노드 참조로 O(1) 삭제
 * const node = list.pushBack(42);
 * list.remove(node);
 *
 * @example
 * // 이터레이터
 * for (const val of list) {
 *   console.log(val);
 * }
 *
 * @complexity
 * - pushFront/pushBack/popFront/popBack: O(1)
 * - remove(node): O(1)
 * - find: O(n)
 * - toArray: O(n)
 */

export interface ListNode<T> {
  value: T;
  prev: ListNode<T> | null;
  next: ListNode<T> | null;
}

function createNode<T>(value: T): ListNode<T> {
  return { value, prev: null, next: null };
}

export class LinkedList<T> implements Iterable<T> {
  private head: ListNode<T> | null = null;
  private tail: ListNode<T> | null = null;
  private _size = 0;

  /** 리스트의 요소 수 */
  get size(): number {
    return this._size;
  }

  /** 리스트가 비어 있는지 확인한다. */
  isEmpty(): boolean {
    return this._size === 0;
  }

  /** 맨 앞에 값을 추가한다. 노드를 반환한다. */
  pushFront(value: T): ListNode<T> {
    const node = createNode(value);
    if (this.head === null) {
      this.head = this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
    this._size++;
    return node;
  }

  /** 맨 뒤에 값을 추가한다. 노드를 반환한다. */
  pushBack(value: T): ListNode<T> {
    const node = createNode(value);
    if (this.tail === null) {
      this.head = this.tail = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    }
    this._size++;
    return node;
  }

  /** 맨 앞 값을 제거하고 반환한다. 비어있으면 undefined. */
  popFront(): T | undefined {
    if (this.head === null) return undefined;
    const value = this.head.value;
    this.head = this.head.next;
    if (this.head === null) {
      this.tail = null;
    } else {
      this.head.prev = null;
    }
    this._size--;
    return value;
  }

  /** 맨 뒤 값을 제거하고 반환한다. 비어있으면 undefined. */
  popBack(): T | undefined {
    if (this.tail === null) return undefined;
    const value = this.tail.value;
    this.tail = this.tail.prev;
    if (this.tail === null) {
      this.head = null;
    } else {
      this.tail.next = null;
    }
    this._size--;
    return value;
  }

  /** 맨 앞 값을 반환한다 (제거하지 않음). */
  peekFront(): T | undefined {
    return this.head?.value;
  }

  /** 맨 뒤 값을 반환한다 (제거하지 않음). */
  peekBack(): T | undefined {
    return this.tail?.value;
  }

  /** 특정 노드 앞에 값을 삽입한다. */
  insertBefore(node: ListNode<T>, value: T): ListNode<T> {
    const newNode = createNode(value);
    newNode.next = node;
    newNode.prev = node.prev;
    if (node.prev !== null) {
      node.prev.next = newNode;
    } else {
      this.head = newNode;
    }
    node.prev = newNode;
    this._size++;
    return newNode;
  }

  /** 특정 노드 뒤에 값을 삽입한다. */
  insertAfter(node: ListNode<T>, value: T): ListNode<T> {
    const newNode = createNode(value);
    newNode.prev = node;
    newNode.next = node.next;
    if (node.next !== null) {
      node.next.prev = newNode;
    } else {
      this.tail = newNode;
    }
    node.next = newNode;
    this._size++;
    return newNode;
  }

  /** 노드를 제거한다. O(1). */
  remove(node: ListNode<T>): void {
    if (node.prev !== null) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    if (node.next !== null) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
    node.prev = null;
    node.next = null;
    this._size--;
  }

  /** 조건을 만족하는 첫 노드를 반환한다. */
  findNode(predicate: (value: T) => boolean): ListNode<T> | undefined {
    let current = this.head;
    while (current !== null) {
      if (predicate(current.value)) return current;
      current = current.next;
    }
    return undefined;
  }

  /** 리스트를 뒤집는다 (in-place). */
  reverse(): this {
    let current = this.head;
    while (current !== null) {
      const tmp = current.next;
      current.next = current.prev;
      current.prev = tmp;
      current = tmp;
    }
    const tmp = this.head;
    this.head = this.tail;
    this.tail = tmp;
    return this;
  }

  /** 모든 요소를 제거한다. */
  clear(): void {
    this.head = null;
    this.tail = null;
    this._size = 0;
  }

  /** 배열로 변환한다. */
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current !== null) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  /** 역순 배열로 변환한다. */
  toArrayReverse(): T[] {
    const result: T[] = [];
    let current = this.tail;
    while (current !== null) {
      result.push(current.value);
      current = current.prev;
    }
    return result;
  }

  /** 이터레이터. */
  *[Symbol.iterator](): Iterator<T> {
    let current = this.head;
    while (current !== null) {
      yield current.value;
      current = current.next;
    }
  }

  /** 배열에서 LinkedList를 생성한다. */
  static from<T>(values: Iterable<T>): LinkedList<T> {
    const list = new LinkedList<T>();
    for (const v of values) list.pushBack(v);
    return list;
  }
}
