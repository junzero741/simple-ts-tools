import { describe, it, expect } from "vitest";
import { createChangelog } from "./changelog";

type User = { name: string; email: string; age: number };
type Meta = { actor: string; reason?: string };

describe("createChangelog", () => {
  describe("record", () => {
    it("변경된 필드를 기록한다", () => {
      const log = createChangelog<User, Meta>();

      const changes = log.record(
        { name: "Alice", email: "a@b.com", age: 30 },
        { name: "Alice", email: "alice@new.com", age: 31 },
        { actor: "admin" },
      );

      expect(changes).toEqual([
        { field: "email", from: "a@b.com", to: "alice@new.com" },
        { field: "age", from: 30, to: 31 },
      ]);
      expect(log.size).toBe(1);
    });

    it("변경 없으면 기록하지 않는다", () => {
      const log = createChangelog<User>();
      const user = { name: "Alice", email: "a@b.com", age: 30 };
      const changes = log.record(user, { ...user });

      expect(changes).toEqual([]);
      expect(log.size).toBe(0);
    });

    it("timestamp를 기록한다", () => {
      let time = 1000;
      const log = createChangelog<User, Meta>({ now: () => time });

      log.record(
        { name: "A", email: "", age: 0 },
        { name: "B", email: "", age: 0 },
        { actor: "x" },
      );

      expect(log.entries[0].timestamp).toBe(1000);
    });

    it("meta를 기록한다", () => {
      const log = createChangelog<User, Meta>();
      log.record(
        { name: "A", email: "", age: 0 },
        { name: "B", email: "", age: 0 },
        { actor: "admin", reason: "typo" },
      );

      expect(log.entries[0].meta).toEqual({ actor: "admin", reason: "typo" });
    });
  });

  describe("ignoreFields", () => {
    it("지정된 필드를 무시한다", () => {
      const log = createChangelog<User>({ ignoreFields: ["age"] });

      const changes = log.record(
        { name: "A", email: "a@b.com", age: 30 },
        { name: "B", email: "a@b.com", age: 99 },
      );

      expect(changes).toEqual([{ field: "name", from: "A", to: "B" }]);
    });
  });

  describe("maxEntries", () => {
    it("최대 기록 수를 초과하면 오래된 것 제거", () => {
      const log = createChangelog<User>({ maxEntries: 2 });

      log.record({ name: "A", email: "", age: 0 }, { name: "B", email: "", age: 0 });
      log.record({ name: "B", email: "", age: 0 }, { name: "C", email: "", age: 0 });
      log.record({ name: "C", email: "", age: 0 }, { name: "D", email: "", age: 0 });

      expect(log.size).toBe(2);
      expect(log.entries[0].changes[0].to).toBe("C");
    });
  });

  describe("fieldHistory", () => {
    it("특정 필드의 변경 이력을 추출한다", () => {
      const log = createChangelog<User, Meta>();

      log.record(
        { name: "Alice", email: "", age: 30 },
        { name: "Bob", email: "", age: 30 },
        { actor: "user1" },
      );
      log.record(
        { name: "Bob", email: "", age: 30 },
        { name: "Charlie", email: "", age: 31 },
        { actor: "user2" },
      );

      const nameHistory = log.fieldHistory("name");
      expect(nameHistory).toEqual([
        { from: "Alice", to: "Bob", timestamp: expect.any(Number), meta: { actor: "user1" } },
        { from: "Bob", to: "Charlie", timestamp: expect.any(Number), meta: { actor: "user2" } },
      ]);

      const ageHistory = log.fieldHistory("age");
      expect(ageHistory.length).toBe(1);
    });

    it("변경 없는 필드는 빈 배열", () => {
      const log = createChangelog<User>();
      expect(log.fieldHistory("name")).toEqual([]);
    });
  });

  describe("reconstruct", () => {
    it("특정 시점의 상태를 복원한다", () => {
      const log = createChangelog<User>();
      const base = { name: "Alice", email: "a@b.com", age: 30 };

      log.record(base, { name: "Bob", email: "a@b.com", age: 30 });
      log.record(
        { name: "Bob", email: "a@b.com", age: 30 },
        { name: "Bob", email: "bob@new.com", age: 31 },
      );

      // index 0 → 첫 번째 변경까지 적용
      expect(log.reconstruct(base, 0)).toEqual({ name: "Bob", email: "a@b.com", age: 30 });

      // index 1 → 두 번째 변경까지 적용
      expect(log.reconstruct(base, 1)).toEqual({ name: "Bob", email: "bob@new.com", age: 31 });
    });
  });

  describe("clear", () => {
    it("이력을 초기화한다", () => {
      const log = createChangelog<User>();
      log.record(
        { name: "A", email: "", age: 0 },
        { name: "B", email: "", age: 0 },
      );
      log.clear();
      expect(log.size).toBe(0);
    });
  });

  describe("실전: 관리자 패널 감사 로그", () => {
    it("관리자가 사용자 정보를 변경한 이력", () => {
      const audit = createChangelog<User, Meta>();

      audit.record(
        { name: "Alice", email: "alice@old.com", age: 30 },
        { name: "Alice", email: "alice@new.com", age: 30 },
        { actor: "admin@company.com", reason: "email change request #1234" },
      );

      audit.record(
        { name: "Alice", email: "alice@new.com", age: 30 },
        { name: "Alice Kim", email: "alice@new.com", age: 31 },
        { actor: "admin@company.com", reason: "yearly update" },
      );

      expect(audit.size).toBe(2);
      expect(audit.fieldHistory("email").length).toBe(1);
      expect(audit.fieldHistory("name").length).toBe(1);
      expect(audit.entries[0].meta.reason).toContain("email change");
    });
  });
});
