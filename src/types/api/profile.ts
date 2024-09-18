export interface IProfileStatus {
  [key: string]: {
    icon?: string;
    text: string;
    class: string;
  };
}

interface IProfileListAction {
  type: string;
  text: string;
}

export interface IProfileList {
  id: number;
  label: string;
  value: string;
  action?: IProfileListAction;
}

export type TStatus = 'processing' | 'manual-review' | 'updates-required';

export interface IStatusVerification {
  id: number;
  status: TStatus;
  icon: string;
  title: string;
  text: string;
  btnText?: string;
  btnLink?: string;
}
