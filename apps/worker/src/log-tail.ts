/** Keeps the last `max` lines of a process's output, for `jobs.log_tail`. */
export class LogTail {
  readonly #max: number;
  readonly #lines: string[] = [];

  constructor(max = 200) {
    this.#max = max;
  }

  push(line: string): void {
    this.#lines.push(line);
    if (this.#lines.length > this.#max) this.#lines.shift();
  }

  toString(): string {
    return this.#lines.join("\n");
  }
}
