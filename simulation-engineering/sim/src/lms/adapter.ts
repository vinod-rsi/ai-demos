/**
 * LMS / xAPI boundary. The Unity build talks to Knet + TinCan
 * (KnetLoader.cs, TinCanEventListener.cs); this port isolates everything the
 * app needs behind LmsAdapter so dev runs use local storage and production
 * can plug in an xAPI/SCORM adapter without touching app code.
 *
 * Suspend data mirrors the Unity model: the Konverse selected path IS the
 * durable conversation state — replaying it through Conversation.selectPath()
 * restores a session.
 */

export interface LearnerSession {
  learnerId: string;
  learnerName: string;
  /** Previously saved state, if any. */
  suspendData: SuspendData | null;
}

export interface SuspendData {
  version: 1;
  courseId: string;
  selectedPath: string;
  turnNumber: number;
  completed: boolean;
  success: boolean;
  savedAtIso: string;
}

/** Minimal xAPI-shaped statement; concrete adapters expand to full xAPI. */
export interface StatementLite {
  verb: 'launched' | 'progressed' | 'answered' | 'completed' | 'passed' | 'failed';
  objectId: string;
  result?: {
    success?: boolean;
    response?: string;
    extensions?: Record<string, unknown>;
  };
}

export interface LmsAdapter {
  initialize(courseId: string): Promise<LearnerSession>;
  saveSuspendData(data: SuspendData): Promise<void>;
  clearSuspendData(): Promise<void>;
  sendStatement(statement: StatementLite): Promise<void>;
  setComplete(success: boolean): Promise<void>;
}
