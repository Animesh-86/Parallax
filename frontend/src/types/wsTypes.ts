export interface CodeEditMessage {
    projectId: string;
    userId: string;
    path: string;
    content: string; // Used for full saves to backend
    token?: string | null;
    isDelta?: boolean;
    changes?: any[]; // Array of IModelContentChange from monaco
}

export interface RunCodeRequestWS {
    projectId: string;
    userId: string;
    filename: string;
    timeoutSeconds: number;
    token: string | null;
}

export type RunMessageType = 'RUN_STARTED' | 'RUN_OUTPUT' | 'RUN_FINISHED';

export interface RunCodeBroadcastMessage {
    sessionId?: string;
    type: RunMessageType;
    output?: string | null;
    exitCode?: number | null;
    triggeredBy?: string;
}
