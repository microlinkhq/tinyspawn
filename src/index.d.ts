import { ChildProcess, SpawnOptions } from 'child_process'

export interface TinyspawnOptions extends SpawnOptions {
  json?: boolean
  reject?: boolean
}

export interface TinyspawnResult<Stdout = string> extends Omit<ChildProcess, 'stdout' | 'stderr'> {
  stdout: Stdout
  stderr: string
  /** Only exists if `reject` was false and the child process exited with a non-zero code. */
  error?: Error
}

export interface TinyspawnPromise<Stdout = string>
  extends Promise<TinyspawnResult<Stdout>>,
    ChildProcess {}

export type {
  /** @deprecated Use `TinyspawnPromise` instead. */
  TinyspawnPromise as SubprocessPromise
}

type Tinyspawn<StdoutDefault> = [StdoutDefault] extends [string]
  ? {
      (
        input: string,
        args?: (string | false | null | undefined)[],
        options?: TinyspawnOptions & { json?: false | undefined }
      ): TinyspawnPromise<string>

      (
        input: string,
        options?: TinyspawnOptions & { json?: false | undefined }
      ): TinyspawnPromise<string>

      <Stdout = unknown>(
        input: string,
        args: (string | false | null | undefined)[] | undefined,
        options: TinyspawnOptions & { json: boolean }
      ): TinyspawnPromise<Stdout>

      <Stdout = unknown>(
        input: string,
        options: TinyspawnOptions & { json: boolean }
      ): TinyspawnPromise<Stdout>
    }
  : {
      (
        input: string,
        args: (string | false | null | undefined)[] | undefined,
        options: TinyspawnOptions & { json: false }
      ): TinyspawnPromise<string>

      (input: string, options: TinyspawnOptions & { json: false }): TinyspawnPromise<string>

      <Stdout = StdoutDefault>(
        input: string,
        args?: (string | false | null | undefined)[] | TinyspawnOptions,
        options?: TinyspawnOptions
      ): TinyspawnPromise<Stdout>
    }

declare const $: Tinyspawn<string> & {
  extend(defaults?: TinyspawnOptions & { json?: false | undefined }): Tinyspawn<string>
  extend(defaults: TinyspawnOptions & { json: boolean }): Tinyspawn<unknown>
  json: Tinyspawn<unknown>
}

export default $
