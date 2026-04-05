import { describe, expect, it } from "vitest";
import { Queue } from "./Queue";

describe("Queue", () => {
  it("FIFO 순서로 요소를 꺼낸다", () => {
    const q = new Queue([1, 2, 3]);
    expect(q.dequeue()).toBe(1);
    expect(q.dequeue()).toBe(2);
    expect(q.dequeue()).toBe(3);
  });

  it("enqueue는 끝에 추가한다", () => {
    const q = new Queue<number>();
    q.enqueue(10).enqueue(20).enqueue(30);
    expect(q.dequeue()).toBe(10);
    expect(q.dequeue()).toBe(20);
  });

  it("peek은 요소를 제거하지 않는다", () => {
    const q = new Queue([1, 2]);
    expect(q.peek()).toBe(1);
    expect(q.peek()).toBe(1);
    expect(q.size).toBe(2);
  });

  it("빈 큐에서 dequeue/peek은 undefined를 반환한다", () => {
    const q = new Queue<number>();
    expect(q.dequeue()).toBeUndefined();
    expect(q.peek()).toBeUndefined();
  });

  it("isEmpty와 size가 올바르게 동작한다", () => {
    const q = new Queue<number>();
    expect(q.isEmpty).toBe(true);
    expect(q.size).toBe(0);
    q.enqueue(1);
    expect(q.isEmpty).toBe(false);
    expect(q.size).toBe(1);
    q.dequeue();
    expect(q.isEmpty).toBe(true);
  });

  it("clear는 큐를 비운다", () => {
    const q = new Queue([1, 2, 3]);
    q.clear();
    expect(q.size).toBe(0);
    expect(q.isEmpty).toBe(true);
  });

  it("toArray는 FIFO 순서로 반환한다", () => {
    const q = new Queue([1, 2, 3]);
    q.enqueue(4);
    q.dequeue(); // 1 제거
    expect(q.toArray()).toEqual([2, 3, 4]);
  });

  it("dequeue 후 enqueue해도 FIFO 순서를 유지한다", () => {
    const q = new Queue([1, 2]);
    q.dequeue();
    q.enqueue(3);
    expect(q.toArray()).toEqual([2, 3]);
  });

  it("대량 dequeue 후 메모리 정리가 동작한다", () => {
    const q = new Queue<number>();
    for (let i = 0; i < 100; i++) q.enqueue(i);
    for (let i = 0; i < 60; i++) q.dequeue();
    // 60개 제거 후 내부 정리 발동 (head > length/2)
    expect(q.size).toBe(40);
    expect(q.peek()).toBe(60);
  });
});
