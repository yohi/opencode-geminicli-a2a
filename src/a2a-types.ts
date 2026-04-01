export interface Part {
  text?: string;
  // 他のメディアタイプは拡張可能
}

export interface Message {
  role: "ROLE_USER" | "ROLE_AGENT";
  parts: Part[];
  messageId?: string;
  taskId?: string;
}

export interface SendMessageRequest {
  message: Message;
}

export interface TaskStatus {
  state: "TASK_STATE_PENDING" | "TASK_STATE_WORKING" | "TASK_STATE_COMPLETED" | "TASK_STATE_FAILED";
  timestamp?: string;
}

export interface Artifact {
  artifactId: string;
  parts: Part[];
}

export interface Task {
  id: string;
  status: TaskStatus;
  artifacts?: Artifact[];
}

export interface StreamResponse {
  task?: Task;
  message?: Message;
  statusUpdate?: { taskId: string; status: TaskStatus };
  artifactUpdate?: { taskId: string; artifact: Artifact };
}
