export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export type TaskChecklist = ChecklistItem[] | ChecklistGroup[];

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface Activity {
  id: string;
  text: string;
  action?: 
    | 'completed' 
    | 'uncompleted'
    | 'work:start'
    | 'work:pause'
    | 'work:resume'
    | 'work:stop'
    | 'work:enable'
    | 'work:disable';
  userId?: string;
  user: string;
  initials: string;
  color: string;
  date: string;
  type: 'activity';
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  order: number;
  mirrorGroupId?: string;
  projectId?: string;
  assigneeId?: string;
  assignee?: {
    name: string;
  };
  labels?: string[];
  checklist?: TaskChecklist;
  checklistTotal?: number;
  checklistCompleted?: number;
  members?: string[];
  memberCount?: number;
  dueDate?: string;
  coverColor?: string;
  attachments?: Attachment[];
  attachmentCount?: number;
  comments?: any[];
  activities?: Activity[];
}

export interface Column {
  id: string;
  title: string;
  archived?: boolean;
}
