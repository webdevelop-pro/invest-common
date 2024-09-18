import parse from 'InvestCommon/helpers/parseMarkdown';
import { IPostContent } from 'InvestCommon/types/api/blog';

const modules = import.meta.glob('@/blog/*.md', { as: 'raw' });
const markdownItems: IPostContent[] = [];

Object.keys(modules).forEach((path: string) => {
  // eslint-disable-next-line promise/always-return
  void modules[path]().then((mod) => {
    const item = parse(mod);
    // eslint-disable-next-line promise/always-return
    if (!item?.draft) markdownItems.push(item);
  // eslint-disable-next-line promise/always-return
  }).then(() => {
    markdownItems.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA > dateB ? -1 : 1;
    });
  });
});

markdownItems.sort((a, b) => {
  const dateA = new Date(a.date).getTime();
  const dateB = new Date(b.date).getTime();
  return dateA > dateB ? -1 : 1;
});

// GET BLOG POSTS
export const fetchGetAllBlogPosts = () => Promise.resolve(markdownItems);
export const fetchGetOneBlogPost = (slug: string) => {
  const getOne = markdownItems.find((item) => item.slug === slug);
  return Promise.resolve(getOne);
};
