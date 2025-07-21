export interface IMail {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments: {
    items?: string[];
    gold?: number;
  };
  sentAt: Date;
  expiresAt: Date;
  read: boolean;
  collected: boolean;
}