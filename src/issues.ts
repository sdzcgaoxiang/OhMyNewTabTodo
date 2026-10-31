export interface IssuePayload {
  code: string;
  values?: Record<string, string | number>;
}

export class AppIssue extends Error implements IssuePayload {
  constructor(
    readonly code: string,
    message: string,
    readonly values?: Record<string, string | number>,
  ) {
    super(message);
    this.name = 'AppIssue';
  }
}

export const issue = (
  code: string,
  message: string,
  values?: Record<string, string | number>,
): AppIssue => new AppIssue(code, message, values);

export function issuePayload(error: unknown): IssuePayload | undefined {
  if (!(error instanceof AppIssue)) return undefined;
  return { code: error.code, ...(error.values ? { values: error.values } : {}) };
}
