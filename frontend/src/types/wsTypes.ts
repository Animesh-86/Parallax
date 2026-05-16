export interface CodeEditMessage {
    projectId: string;
    userId: string;
    path: string;
    content: string;
    token?: string | null;
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
