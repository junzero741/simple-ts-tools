interface TrieNode {
  children: Map<string, TrieNode>;
  isEnd: boolean;
  count: number; // 이 노드를 경유하는 단어 수 (delete 지원용)
}

function createNode(): TrieNode {
  return { children: new Map(), isEnd: false, count: 0 };
}

/**
 * Trie(접두사 트리) 자료구조.
 *
 * 문자열 집합에 대해 insert/search/delete를 O(L) (L=단어 길이)에 처리하며,
 * `suggest()`로 주어진 접두사로 시작하는 모든 단어를 O(P + K) (P=접두사 길이, K=결과 수)에 반환한다.
 *
 * 주요 사용처:
 * - 검색창 자동완성 (suggest)
 * - 프리픽스 유효성 확인 (startsWith)
 * - 사전/금지어 목록 관리 (insert + search)
 * - IP 주소 라우팅, 파일 경로 탐색
 *
 * @example
 * const trie = new Trie(["apple", "app", "apply", "apt"]);
 * trie.search("app");          // true
 * trie.startsWith("app");      // true
 * trie.suggest("app");         // ["app", "apple", "apply"]  (삽입 순 아닌 사전순)
 * trie.delete("apple");
 * trie.suggest("app");         // ["app", "apply"]
 */
export class Trie {
  private readonly root: TrieNode = createNode();
  private _size = 0;

  constructor(words?: string[]) {
    if (words) {
      for (const word of words) this.insert(word);
    }
  }

  /**
   * 단어를 삽입한다.
   * 이미 존재하는 단어는 중복 삽입되지 않는다.
   * @complexity O(L)
   */
  insert(word: string): this {
    if (this.search(word)) return this;

    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, createNode());
      }
      node = node.children.get(char)!;
      node.count++;
    }
    node.isEnd = true;
    this._size++;
    return this;
  }

  /**
   * 단어가 정확히 존재하는지 확인한다.
   * @complexity O(L)
   */
  search(word: string): boolean {
    const node = this._traverse(word);
    return node?.isEnd === true;
  }

  /**
   * 주어진 접두사로 시작하는 단어가 하나라도 있으면 true.
   * @complexity O(L)
   */
  startsWith(prefix: string): boolean {
    return this._traverse(prefix) !== null;
  }

  /**
   * 주어진 접두사로 시작하는 모든 단어를 사전순으로 반환한다.
   * @param prefix 검색할 접두사. 빈 문자열이면 전체 단어 반환.
   * @param limit 최대 반환 개수. 미지정 시 전체.
   * @complexity O(P + K) — P=접두사 길이, K=결과 단어 수의 총 문자 수
   */
  suggest(prefix = "", limit?: number): string[] {
    const startNode = this._traverse(prefix);
    if (!startNode) return [];

    const results: string[] = [];
    this._collect(startNode, prefix, results, limit ?? Infinity);
    return results;
  }

  /**
   * 단어를 삭제한다. 존재하지 않으면 false 반환.
   * @complexity O(L)
   */
  delete(word: string): boolean {
    if (!this.search(word)) return false;

    let node = this.root;
    for (const char of word) {
      const child = node.children.get(char)!;
      child.count--;
      if (child.count === 0) {
        node.children.delete(char);
        this._size--;
        return true;
      }
      node = child;
    }
    node.isEnd = false;
    this._size--;
    return true;
  }

  /** 저장된 단어 수. */
  get size(): number {
    return this._size;
  }

  /** 저장된 단어가 없으면 true. */
  get isEmpty(): boolean {
    return this._size === 0;
  }

  /** 모든 단어를 사전순으로 반환한다. */
  toArray(): string[] {
    return this.suggest("");
  }

  // --- private helpers ---

  private _traverse(str: string): TrieNode | null {
    let node = this.root;
    for (const char of str) {
      const child = node.children.get(char);
      if (!child) return null;
      node = child;
    }
    return node;
  }

  private _collect(
    node: TrieNode,
    prefix: string,
    results: string[],
    limit: number
  ): void {
    if (results.length >= limit) return;
    if (node.isEnd) results.push(prefix);

    // Map의 키를 정렬해서 사전순 보장
    for (const [char, child] of [...node.children.entries()].sort((a, b) =>
      a[0] < b[0] ? -1 : 1
    )) {
      if (results.length >= limit) return;
      this._collect(child, prefix + char, results, limit);
    }
  }
}
