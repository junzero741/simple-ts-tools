// 객체 변환 매퍼 (Projection / Object Mapper).
//
// 소스 객체를 대상 형태로 선언적으로 매핑한다.
// API 응답 → DTO, DB row → 도메인 모델, GraphQL → 뷰 모델 등에 활용.
//
// const toUserDTO = createProjection<DbUser, UserDTO>({
//   id: "id",
//   fullName: (src) => `${src.firstName} ${src.lastName}`,
//   email: "email",
//   isActive: (src) => src.status === "active",
// });
//
// const dto = toUserDTO(dbRow);
// const dtos = toUserDTO.many(dbRows);

export type FieldMapping<TSrc, TDst, K extends keyof TDst> =
  | keyof TSrc & string
  | ((source: TSrc) => TDst[K]);

export type ProjectionMap<TSrc, TDst> = {
  [K in keyof TDst]: FieldMapping<TSrc, TDst, K>;
};

export interface Projection<TSrc, TDst> {
  (source: TSrc): TDst;
  many(sources: TSrc[]): TDst[];
  partial(source: Partial<TSrc>): Partial<TDst>;
}

export function createProjection<TSrc extends Record<string, unknown>, TDst extends Record<string, unknown>>(
  mapping: ProjectionMap<TSrc, TDst>,
): Projection<TSrc, TDst> {
  function project(source: TSrc): TDst {
    const result: Record<string, unknown> = {};

    for (const [dstKey, mapper] of Object.entries(mapping)) {
      if (typeof mapper === "function") {
        result[dstKey] = (mapper as (source: TSrc) => unknown)(source);
      } else {
        result[dstKey] = source[mapper as string];
      }
    }

    return result as TDst;
  }

  const projection = project as Projection<TSrc, TDst>;

  projection.many = (sources: TSrc[]): TDst[] => {
    return sources.map(project);
  };

  projection.partial = (source: Partial<TSrc>): Partial<TDst> => {
    const result: Record<string, unknown> = {};

    for (const [dstKey, mapper] of Object.entries(mapping)) {
      if (typeof mapper === "function") {
        try {
          result[dstKey] = (mapper as (source: TSrc) => unknown)(source as TSrc);
        } catch {
          // 부분 소스에서 접근 불가능한 필드는 건너뜀
        }
      } else {
        const srcKey = mapper as string;
        if (srcKey in source) {
          result[dstKey] = (source as Record<string, unknown>)[srcKey];
        }
      }
    }

    return result as Partial<TDst>;
  };

  return projection;
}

/**
 * 두 Projection을 합성한다. A → B → C.
 */
export function composeProjections<A extends Record<string, unknown>, B extends Record<string, unknown>, C extends Record<string, unknown>>(
  first: Projection<A, B>,
  second: Projection<B, C>,
): Projection<A, C> {
  const composed = ((source: A): C => {
    return second(first(source));
  }) as Projection<A, C>;

  composed.many = (sources: A[]): C[] => sources.map(composed);
  composed.partial = (source: Partial<A>): Partial<C> => {
    return second.partial(first.partial(source) as Partial<B>);
  };

  return composed;
}
