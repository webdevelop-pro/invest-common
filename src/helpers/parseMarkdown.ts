import { IAuthor, IMarkdownOptions } from 'InvestCommon/types/api/blog';
import { urlize } from './general';

export function parseTopOptions(markdown: string): IAuthor | IMarkdownOptions | null {
  const metadata: Partial<IAuthor> = {};
  const favoriteTagsMatch = markdown.match(/favoriteTags:\s*\[([\s\S]*?)\]/);
  const tagsMatch = markdown.match(/tags:\s*\[([\s\S]*?)\]/);

  if (favoriteTagsMatch) {
    const favoriteTagsStr = favoriteTagsMatch[1];
    metadata.favoriteTags = favoriteTagsStr
      .split(',')
      .map((tag) => tag.trim().replace(/['"]+/g, ''));
    markdown = markdown.replace(favoriteTagsMatch[0], ''); // Remove favoriteTags from markdown
  }

  if (tagsMatch) {
    const favoriteTagsStr = tagsMatch[1];
    metadata.tags = favoriteTagsStr
      .split(',')
      .map((tag) => tag.trim().replace(/['"]+/g, ''));
    markdown = markdown.replace(tagsMatch[0], ''); // Remove favoriteTags from markdown
  }

  const lines = markdown.split('\n');
  lines.forEach((line) => {
    const match = line.match(/^(.*?):\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replaceAll('"', '');

      if (key === 'draft') {
        if (value === 'false') {
          metadata[key] = false;
        } else if (value === 'true') {
          metadata[key] = true;
        }
      } else {
        metadata[key] = value;
      }
    }
  });

  metadata.slug = urlize(metadata.title);

  return metadata as IAuthor;
}

export default function parse(markdown: string) {
  const separator = '---';
  // const topOptions = {} as IMarkdownOptions;
  const topOptionsStr = markdown.substring(markdown.indexOf(separator) + 3, markdown.lastIndexOf(separator));
  // const temp = topOptionsStr.trim().split('\',\n').map((item) => item.replaceAll('\'', '').split(':')) as [];
  const content = markdown.replace(topOptionsStr, '').replaceAll(separator, '').trim();

  const topOptions = parseTopOptions(topOptionsStr);

  return {
    content,
    ...topOptions,
  };
}
