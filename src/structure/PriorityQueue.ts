/**
 * 이진 최소 힙(min-heap) 기반 우선순위 큐.
 *
 * priority 값이 낮을수록 먼저 꺼낸다 (min-heap).
 * 같은 priority는 enqueue 순서대로 처리 (FIFO tiebreak).
 *
 * 시간 복잡도:
 * - enqueue: O(log n)
 * - dequeue: O(log n)
 * - peek:    O(1)
 */
export class PriorityQueue<T> {
  private heap: Array<{ value: T; priority: number; seq: number }> = [];
  private seq = 0;

  get size(): number {
    return this.heap.length;
  }

  get isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /** 값을 우선순위와 함께 삽입한다. */
  enqueue(value: T, priority: number): void {
    this.heap.push({ value, priority, seq: this.seq++ });
    this.siftUp(this.heap.length - 1);
  }

  /** 우선순위가 가장 낮은(= 숫자가 작은) 값을 꺼낸다. 비어있으면 undefined. */
  dequeue(): T | undefined {
    if (this.isEmpty) return undefined;
    const top = this.heap[0].value;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  /** 꺼내지 않고 다음 값만 조회한다. */
  peek(): T | undefined {
    return this.heap[0]?.value;
  }

  /** 현재 큐의 모든 값을 우선순위 순서로 반환한다 (비파괴). */
  toArray(): T[] {
    return [...this.heap]
      .sort((a, b) => a.priority - b.priority || a.seq - b.seq)
      .map((n) => n.value);
  }

  private less(i: number, j: number): boolean {
    const a = this.heap[i];
    const b = this.heap[j];
    return a.priority < b.priority || (a.priority === b.priority && a.seq < b.seq);
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private siftUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.less(i, parent)) {
        this.swap(i, parent);
        i = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.less(left, smallest)) smallest = left;
      if (right < n && this.less(right, smallest)) smallest = right;
      if (smallest !== i) {
        this.swap(i, smallest);
        i = smallest;
      } else {
        break;
      }
    }
  }
}
