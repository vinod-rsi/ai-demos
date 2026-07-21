import type { LearnerSession, LmsAdapter, StatementLite, SuspendData } from './adapter';

/**
 * Dev-mode adapter: suspend data in localStorage, statements to the console
 * and an in-memory log (visible in the debug panel).
 */
export class LocalStorageLmsAdapter implements LmsAdapter {
  readonly statements: StatementLite[] = [];
  private courseId = '';

  private get key(): string {
    return `threejs-port:suspend:${this.courseId}`;
  }

  initialize(courseId: string): Promise<LearnerSession> {
    this.courseId = courseId;
    let suspendData: SuspendData | null = null;
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) suspendData = JSON.parse(raw) as SuspendData;
    } catch {
      suspendData = null;
    }
    return Promise.resolve({
      learnerId: 'local-dev',
      learnerName: 'Local Developer',
      suspendData,
    });
  }

  saveSuspendData(data: SuspendData): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify(data));
    return Promise.resolve();
  }

  clearSuspendData(): Promise<void> {
    localStorage.removeItem(this.key);
    return Promise.resolve();
  }

  sendStatement(statement: StatementLite): Promise<void> {
    this.statements.push(statement);
    console.info('[lms]', statement.verb, statement.objectId, statement.result ?? '');
    return Promise.resolve();
  }

  setComplete(success: boolean): Promise<void> {
    return this.sendStatement({
      verb: success ? 'passed' : 'failed',
      objectId: this.courseId,
    });
  }
}
