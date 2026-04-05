import { describe, it, expect, vi } from "vitest";
import { saga } from "./saga";

describe("saga", () => {
  describe("성공 시나리오", () => {
    it("모든 스텝을 순서대로 실행한다", async () => {
      const order: string[] = [];

      const result = await saga()
        .step("a", () => { order.push("a"); })
        .step("b", () => { order.push("b"); })
        .step("c", () => { order.push("c"); })
        .execute();

      expect(result.ok).toBe(true);
      expect(result.completedSteps).toEqual(["a", "b", "c"]);
      expect(order).toEqual(["a", "b", "c"]);
      expect(result.compensated).toEqual([]);
    });

    it("async 스텝을 지원한다", async () => {
      const result = await saga()
        .step("async", async () => {
          await new Promise((r) => setTimeout(r, 5));
        })
        .execute();

      expect(result.ok).toBe(true);
    });
  });

  describe("실패 + 보상", () => {
    it("실패 시 완료된 스텝의 보상을 역순으로 실행한다", async () => {
      const compensations: string[] = [];

      const result = await saga()
        .step("stock",
          () => {},
          () => { compensations.push("stock-restored"); },
        )
        .step("payment",
          () => { throw new Error("insufficient funds"); },
          () => { compensations.push("payment-refunded"); },
        )
        .step("notify",
          () => {},
          () => { compensations.push("notify-cancelled"); },
        )
        .execute();

      expect(result.ok).toBe(false);
      expect(result.failedStep).toBe("payment");
      expect((result.error as Error).message).toBe("insufficient funds");

      // payment는 실패했으므로 보상 안 함
      // stock만 보상 (역순)
      expect(result.compensated).toEqual(["stock"]);
      expect(compensations).toEqual(["stock-restored"]);

      // notify는 실행 안 됐으므로 completedSteps에 없음
      expect(result.completedSteps).toEqual(["stock"]);
    });

    it("보상이 없는 스텝은 건너뛴다", async () => {
      const result = await saga()
        .step("a", () => {})  // 보상 없음
        .step("b", () => {}, () => {})
        .step("c", () => { throw new Error("fail"); })
        .execute();

      expect(result.ok).toBe(false);
      expect(result.compensated).toEqual(["b"]); // a는 보상 없으므로 제외
    });

    it("여러 스텝 보상을 역순으로 실행한다", async () => {
      const order: string[] = [];

      await saga()
        .step("1", () => {}, () => { order.push("comp-1"); })
        .step("2", () => {}, () => { order.push("comp-2"); })
        .step("3", () => {}, () => { order.push("comp-3"); })
        .step("4", () => { throw new Error("fail"); })
        .execute();

      expect(order).toEqual(["comp-3", "comp-2", "comp-1"]);
    });
  });

  describe("보상 실패", () => {
    it("보상 자체가 실패해도 나머지 보상을 계속 실행한다", async () => {
      const result = await saga()
        .step("a", () => {}, () => {})
        .step("b", () => {}, () => { throw new Error("comp-fail"); })
        .step("c", () => {}, () => {})
        .step("d", () => { throw new Error("action-fail"); })
        .execute();

      expect(result.ok).toBe(false);
      expect(result.compensated).toContain("c");
      expect(result.compensated).toContain("a");
      expect(result.compensationErrors.length).toBe(1);
      expect(result.compensationErrors[0].step).toBe("b");
    });
  });

  describe("첫 스텝 실패", () => {
    it("첫 스텝 실패 시 보상할 것 없음", async () => {
      const result = await saga()
        .step("first", () => { throw new Error("immediate fail"); }, () => {})
        .execute();

      expect(result.ok).toBe(false);
      expect(result.completedSteps).toEqual([]);
      expect(result.compensated).toEqual([]);
    });
  });

  describe("빈 사가", () => {
    it("스텝 없으면 즉시 성공", async () => {
      const result = await saga().execute();
      expect(result.ok).toBe(true);
      expect(result.completedSteps).toEqual([]);
    });
  });

  describe("실전: 주문 프로세스", () => {
    it("결제 실패 시 재고 복원", async () => {
      let stock = 100;
      let charged = false;

      const result = await saga()
        .step("deduct-stock",
          () => { stock -= 5; },
          () => { stock += 5; },
        )
        .step("charge",
          () => { throw new Error("card declined"); },
          () => { charged = false; },
        )
        .step("send-email",
          () => {},
        )
        .execute();

      expect(result.ok).toBe(false);
      expect(result.failedStep).toBe("charge");
      expect(stock).toBe(100); // 재고 복원됨
      expect(result.compensated).toEqual(["deduct-stock"]);
    });
  });

  describe("실전: 회원가입 롤백", () => {
    it("이메일 발송 실패 시 DB 삭제", async () => {
      const db: string[] = [];

      const result = await saga()
        .step("create-user",
          () => { db.push("user-1"); },
          () => { db.pop(); },
        )
        .step("send-welcome-email",
          () => { throw new Error("SMTP error"); },
        )
        .execute();

      expect(result.ok).toBe(false);
      expect(db).toEqual([]); // 유저 삭제됨
    });
  });
});
