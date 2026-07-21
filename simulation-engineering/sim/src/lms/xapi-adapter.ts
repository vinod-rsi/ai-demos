import type { LearnerSession, LmsAdapter, StatementLite, SuspendData } from './adapter';

/**
 * xAPI (TinCan) adapter skeleton, replacing TinCanEventListener.cs.
 *
 * NO endpoint is hard-coded: the LRS endpoint, auth, actor and activity IRI
 * must be injected by the hosting page / launch parameters (e.g. via
 * TinCan launch query string or a config file), exactly like the Unity build
 * reads them from KAT-BackpackConfig/Knet at runtime.
 *
 * State (suspend data) uses the xAPI activity-state document API.
 */
export interface XapiConfig {
  endpoint: string;
  /** value for the Authorization header, e.g. "Basic <base64>". */
  authorization: string;
  actor: { mbox?: string; account?: { homePage: string; name: string }; name?: string };
  activityId: string;
  registration?: string;
}

const VERB_IRIS: Record<StatementLite['verb'], string> = {
  launched: 'http://adlnet.gov/expapi/verbs/launched',
  progressed: 'http://adlnet.gov/expapi/verbs/progressed',
  answered: 'http://adlnet.gov/expapi/verbs/answered',
  completed: 'http://adlnet.gov/expapi/verbs/completed',
  passed: 'http://adlnet.gov/expapi/verbs/passed',
  failed: 'http://adlnet.gov/expapi/verbs/failed',
};

const STATE_ID = 'suspend-data';

export class XapiLmsAdapter implements LmsAdapter {
  constructor(private config: XapiConfig) {}

  private headers(): Record<string, string> {
    return {
      Authorization: this.config.authorization,
      'X-Experience-API-Version': '1.0.3',
      'Content-Type': 'application/json',
    };
  }

  private stateUrl(): string {
    const params = new URLSearchParams({
      activityId: this.config.activityId,
      agent: JSON.stringify(this.config.actor),
      stateId: STATE_ID,
    });
    if (this.config.registration) params.set('registration', this.config.registration);
    return `${this.config.endpoint.replace(/\/$/, '')}/activities/state?${params}`;
  }

  async initialize(): Promise<LearnerSession> {
    let suspendData: SuspendData | null = null;
    const res = await fetch(this.stateUrl(), { headers: this.headers() });
    if (res.ok) suspendData = (await res.json()) as SuspendData;
    return {
      learnerId: this.config.actor.account?.name ?? this.config.actor.mbox ?? 'unknown',
      learnerName: this.config.actor.name ?? 'Learner',
      suspendData,
    };
  }

  async saveSuspendData(data: SuspendData): Promise<void> {
    await fetch(this.stateUrl(), {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(data),
    });
  }

  async clearSuspendData(): Promise<void> {
    await fetch(this.stateUrl(), { method: 'DELETE', headers: this.headers() });
  }

  async sendStatement(statement: StatementLite): Promise<void> {
    const body = {
      actor: this.config.actor,
      verb: { id: VERB_IRIS[statement.verb], display: { 'en-US': statement.verb } },
      object: { id: statement.objectId, objectType: 'Activity' },
      ...(statement.result ? { result: statement.result } : {}),
      ...(this.config.registration
        ? { context: { registration: this.config.registration } }
        : {}),
    };
    await fetch(`${this.config.endpoint.replace(/\/$/, '')}/statements`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
  }

  async setComplete(success: boolean): Promise<void> {
    await this.sendStatement({
      verb: success ? 'passed' : 'failed',
      objectId: this.config.activityId,
      result: { success },
    });
  }
}
