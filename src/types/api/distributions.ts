import { IInvest } from './invest';
import { IOffer } from './offers';

export interface IDistributionsDocuments {
    id: number;
    url: string;
    name: string;
    filename: string;
    mime: string;
    bucket_path: string;
    updated_at: string;
    meta_data: {
      big: string;
      small: string;
      medium: string;
      size: number;
    };
  }

export interface IDistributionsData {
    id: number;
    amount: number;
    total_amount: number;
    status: string;
    investment_id: number;
    profile_id: number;
    updated_at: string;
    documents: IDistributionsDocuments[];
    investment: IInvest;
    created_at: string;
}


export interface IDistributionsMeta {
  geografic_data: number[];
  geografic_labels: string[];
  performance_data: number[];
  performance_labels: number[] | string[];
}
