export interface IFilerItemMetaData {
  big: string;
  small: string;
  medium: string;
  size: number;
}

export interface IFilerItem {
  filename: string;
  id: number;
  meta_data: IFilerItemMetaData;
  mime: string;
  name: string;
  'object-data': string;
  'object-id': number;
  'object-name': string;
  'object-type': string;
  bucket_path: string;
  updated_at: string;
  url: string;
  user_id: number;
}

export interface IFilerItemFormatted extends IFilerItem {
    date: string;
    isNew: boolean;
    tagColor?: string;
    typeFormatted: string;
}
