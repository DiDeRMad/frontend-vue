export interface IDialogue {
  id: string;
  text: string;
  speaker?: string;
  voice?: string;
  options?: {
    id: string;
    text: string;
    condition?: any;
    action?: any;
  }[];
}