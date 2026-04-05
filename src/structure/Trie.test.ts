import { describe, expect, it } from "vitest";
import { Trie } from "./Trie";

describe("Trie", () => {
  describe("생성자", () => {
    it("초기 단어 배열로 생성할 수 있다", () => {
      const trie = new Trie(["apple", "app", "apply"]);
      expect(trie.size).toBe(3);
      expect(trie.search("app")).toBe(true);
      expect(trie.search("apple")).toBe(true);
    });

    it("인자 없이 빈 Trie를 생성할 수 있다", () => {
      const trie = new Trie();
      expect(trie.isEmpty).toBe(true);
      expect(trie.size).toBe(0);
    });
  });

  describe("insert", () => {
    it("단어를 삽입하면 size가 증가한다", () => {
      const trie = new Trie();
      trie.insert("hello");
      expect(trie.size).toBe(1);
      trie.insert("world");
      expect(trie.size).toBe(2);
    });

    it("중복 삽입은 무시된다", () => {
      const trie = new Trie();
      trie.insert("hello");
      trie.insert("hello");
      expect(trie.size).toBe(1);
    });

    it("체이닝을 지원한다", () => {
      const trie = new Trie();
      trie.insert("a").insert("b").insert("c");
      expect(trie.size).toBe(3);
    });

    it("빈 문자열을 삽입할 수 있다", () => {
      const trie = new Trie();
      trie.insert("");
      expect(trie.search("")).toBe(true);
    });
  });

  describe("search", () => {
    it("삽입한 단어는 true를 반환한다", () => {
      const trie = new Trie(["apple", "app"]);
      expect(trie.search("apple")).toBe(true);
      expect(trie.search("app")).toBe(true);
    });

    it("없는 단어는 false를 반환한다", () => {
      const trie = new Trie(["apple"]);
      expect(trie.search("appl")).toBe(false);  // 접두사이지만 단어 아님
      expect(trie.search("application")).toBe(false); // 없음
      expect(trie.search("")).toBe(false);
    });

    it("접두사는 search에서 false다", () => {
      const trie = new Trie(["application"]);
      expect(trie.search("app")).toBe(false); // 접두사
      expect(trie.search("application")).toBe(true);
    });
  });

  describe("startsWith", () => {
    it("등록된 단어의 접두사이면 true", () => {
      const trie = new Trie(["apple", "application"]);
      expect(trie.startsWith("app")).toBe(true);
      expect(trie.startsWith("appl")).toBe(true);
      expect(trie.startsWith("apple")).toBe(true);
    });

    it("없는 접두사이면 false", () => {
      const trie = new Trie(["apple"]);
      expect(trie.startsWith("banana")).toBe(false);
      expect(trie.startsWith("apples")).toBe(false); // apple+s는 없음
    });

    it("빈 접두사는 항상 true (비어있지 않은 Trie)", () => {
      const trie = new Trie(["hello"]);
      expect(trie.startsWith("")).toBe(true);
    });

    it("빈 Trie에서 빈 접두사는 true (루트 노드 도달)", () => {
      const trie = new Trie();
      expect(trie.startsWith("")).toBe(true);
    });
  });

  describe("suggest", () => {
    it("접두사로 시작하는 모든 단어를 사전순으로 반환한다", () => {
      const trie = new Trie(["apple", "app", "apply", "apt", "banana"]);
      expect(trie.suggest("app")).toEqual(["app", "apple", "apply"]);
    });

    it("정확한 단어도 결과에 포함된다", () => {
      const trie = new Trie(["app", "apple"]);
      const result = trie.suggest("app");
      expect(result).toContain("app");
      expect(result).toContain("apple");
    });

    it("없는 접두사면 빈 배열을 반환한다", () => {
      const trie = new Trie(["apple"]);
      expect(trie.suggest("xyz")).toEqual([]);
    });

    it("빈 접두사면 전체 단어를 사전순으로 반환한다", () => {
      const trie = new Trie(["cat", "apple", "banana"]);
      expect(trie.suggest()).toEqual(["apple", "banana", "cat"]);
    });

    it("limit으로 결과 수를 제한할 수 있다", () => {
      const trie = new Trie(["app", "apple", "apply", "application"]);
      const result = trie.suggest("app", 2);
      expect(result).toHaveLength(2);
      expect(result).toEqual(["app", "apple"]); // 사전순 앞 2개
    });

    it("결과가 사전순으로 정렬된다", () => {
      const trie = new Trie(["az", "aa", "ab", "a"]);
      expect(trie.suggest("a")).toEqual(["a", "aa", "ab", "az"]);
    });
  });

  describe("delete", () => {
    it("존재하는 단어를 삭제하면 true", () => {
      const trie = new Trie(["apple", "app"]);
      expect(trie.delete("apple")).toBe(true);
      expect(trie.search("apple")).toBe(false);
      expect(trie.size).toBe(1);
    });

    it("없는 단어 삭제는 false", () => {
      const trie = new Trie(["apple"]);
      expect(trie.delete("banana")).toBe(false);
    });

    it("접두사를 공유하는 단어 삭제 시 다른 단어는 유지된다", () => {
      const trie = new Trie(["app", "apple", "apply"]);
      trie.delete("apple");
      expect(trie.search("apple")).toBe(false);
      expect(trie.search("app")).toBe(true);   // 유지
      expect(trie.search("apply")).toBe(true); // 유지
      expect(trie.size).toBe(2);
    });

    it("단어 삭제 후 suggest에서 제외된다", () => {
      const trie = new Trie(["app", "apple", "apply"]);
      trie.delete("apple");
      expect(trie.suggest("app")).toEqual(["app", "apply"]);
    });

    it("단어를 모두 삭제하면 isEmpty가 true", () => {
      const trie = new Trie(["hello"]);
      trie.delete("hello");
      expect(trie.isEmpty).toBe(true);
    });
  });

  describe("toArray", () => {
    it("모든 단어를 사전순으로 반환한다", () => {
      const trie = new Trie(["cat", "apple", "banana", "app"]);
      expect(trie.toArray()).toEqual(["app", "apple", "banana", "cat"]);
    });

    it("빈 Trie는 빈 배열을 반환한다", () => {
      expect(new Trie().toArray()).toEqual([]);
    });
  });

  describe("실사용 시나리오", () => {
    it("검색창 자동완성", () => {
      const trie = new Trie([
        "react", "react-dom", "react-router",
        "redux", "redux-thunk",
        "recoil", "rematch",
      ]);

      expect(trie.suggest("re")).toEqual([
        "react", "react-dom", "react-router",
        "recoil", "redux", "redux-thunk", "rematch",
      ]);

      expect(trie.suggest("redu")).toEqual(["redux", "redux-thunk"]);
      expect(trie.suggest("rec")).toEqual(["recoil"]);
    });

    it("자동완성 결과 수 제한 (드롭다운 UI)", () => {
      const trie = new Trie([
        "김철수", "김영희", "김민준", "김지은", "김수현", "김도윤",
      ]);

      const suggestions = trie.suggest("김", 3);
      expect(suggestions).toHaveLength(3);
    });

    it("금지어 목록 관리", () => {
      const blocklist = new Trie(["spam", "scam", "hack"]);

      function containsBlocked(text: string): boolean {
        return text.split(" ").some(word => blocklist.search(word.toLowerCase()));
      }

      expect(containsBlocked("this is spam")).toBe(true);
      expect(containsBlocked("hello world")).toBe(false);
    });

    it("자동완성 후 항목 제거", () => {
      const history = new Trie(["검색어1", "검색어2", "검색어3"]);
      history.delete("검색어2");
      expect(history.suggest("검색")).toEqual(["검색어1", "검색어3"]);
    });

    it("파일 경로 프리픽스 검색", () => {
      const paths = new Trie([
        "src/components/Button.tsx",
        "src/components/Input.tsx",
        "src/hooks/useAuth.ts",
        "src/utils/format.ts",
      ]);

      expect(paths.suggest("src/components")).toEqual([
        "src/components/Button.tsx",
        "src/components/Input.tsx",
      ]);

      expect(paths.suggest("src/hooks")).toEqual(["src/hooks/useAuth.ts"]);
    });
  });
});
