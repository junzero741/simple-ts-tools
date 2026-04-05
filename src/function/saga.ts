// 사가 패턴 / 보상 트랜잭션 (Saga / Compensating Transaction).
//
// === 예상 사용처 ===
// - 분산 트랜잭션 — 주문→결제→배송→알림 중 하나 실패 시 역순 보상
// - 회원가입 플로우 — DB 저장→이메일 발송→외부 API 호출, 실패 시 롤백
// - 파일 업로드 파이프라인 — 업로드→썸네일 생성→DB 기록, 실패 시 파일 삭제
// - 배포 파이프라인 — 빌드→테스트→배포→DNS 변경, 실패 시 이전 버전 복원
// - 결제 프로세스 — 재고 차감→결제→영수증 발행, 결제 실패 시 재고 복원
// - 데이터 마이그레이션 — 여러 테이블 순차 변환, 실패 시 원복
//
// const result = await saga()
//   .step("deduct-stock",
//     () => deductStock(orderId, items),
//     () => restoreStock(orderId, items),  // 보상 액션
//   )
//   .step("charge-payment",
//     () => chargePayment(orderId, amount),
//     () => refundPayment(orderId, amount),
//   )
//   .step("send-notification",
//     () => sendOrderEmail(orderId),
//     // 보상 없음 — 알림은 롤백 불필요
//   )
//   .execute();
//
// if (!result.ok) {
//   console.log(result.failedStep);    // "charge-payment"
//   console.log(result.compensated);   // ["deduct-stock"]
// }

export interface SagaStep {
  name: string;
  action: () => unknown | Promise<unknown>;
  compensate?: () => void | Promise<void>;
}

export interface SagaResult {
  ok: boolean;
  completedSteps: string[];
  failedStep?: string;
  error?: unknown;
  compensated: string[];
  compensationErrors: Array<{ step: string; error: unknown }>;
}

export interface SagaBuilder {
  /** 실행 스텝 + 보상 액션을 추가한다. */
  step(
    name: string,
    action: () => unknown | Promise<unknown>,
    compensate?: () => void | Promise<void>,
  ): SagaBuilder;

  /** 사가를 실행한다. 실패 시 완료된 스텝의 보상을 역순 실행. */
  execute(): Promise<SagaResult>;
}

export function saga(): SagaBuilder {
  const steps: SagaStep[] = [];

  const builder: SagaBuilder = {
    step(name, action, compensate) {
      steps.push({ name, action, compensate });
      return builder;
    },

    async execute(): Promise<SagaResult> {
      const completedSteps: string[] = [];
      const compensated: string[] = [];
      const compensationErrors: Array<{ step: string; error: unknown }> = [];

      for (const step of steps) {
        try {
          await step.action();
          completedSteps.push(step.name);
        } catch (error) {
          // 실패 — 보상 트랜잭션 역순 실행
          for (let i = completedSteps.length - 1; i >= 0; i--) {
            const completedName = completedSteps[i];
            const completedStep = steps.find((s) => s.name === completedName);
            if (completedStep?.compensate) {
              try {
                await completedStep.compensate();
                compensated.push(completedName);
              } catch (compError) {
                compensationErrors.push({ step: completedName, error: compError });
              }
            }
          }

          return {
            ok: false,
            completedSteps,
            failedStep: step.name,
            error,
            compensated,
            compensationErrors,
          };
        }
      }

      return {
        ok: true,
        completedSteps,
        compensated: [],
        compensationErrors: [],
      };
    },
  };

  return builder;
}
