export type A2ARoleNumeric = 0 | 1;
export type Role = "ROLE_USER" | "ROLE_AGENT" | A2ARoleNumeric;

export interface Part {
  text?: string;
  kind?: string; // For A2A 1.0 compatibility
  // 他のメディアタイプは拡張可能
}

export interface Message {
  role: Role;
  parts: Part[];
  messageId?: string;
  taskId?: string;
}

export interface SendMessageRequest {
  message: Message;
}

export type TaskState = 
  | "TASK_STATE_PENDING" 
  | "TASK_STATE_WORKING" 
  | "TASK_STATE_COMPLETED" 
  | "TASK_STATE_FAILED"
  | "TASK_STATE_SUBMITTED"
  | "TASK_STATE_INPUT_REQUIRED"
  | "task_state_completed"
  | "task_state_failed"
  | "input-required"
  | "submitted"
  | "completed"
  | "failed";

export interface TaskStatus {
  state: TaskState;
  timestamp?: string;
  message?: Message; // A2A 1.0: status can contain a message
  final?: boolean;
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
