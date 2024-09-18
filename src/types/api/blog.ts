export enum PostLinkTypes {
  cancelInvestment = 'can-i-cancel-my-investment'
}

export interface IMarkdownOptions {
  title: string;
  description: string;
  date: string;
  image: string;
  slug: string;
}

export interface IPostContent extends IMarkdownOptions {
  content: string;
}

export interface IAuthor {
  title: string;
  date: string;
  draft?: boolean;
  image: string;
  position?: string;
  description: string;
  favoriteTags?: string[];
  slug?: string;
}
