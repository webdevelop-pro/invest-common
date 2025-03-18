import env from 'InvestCommon/global';
import { DEFAULT_DESCRIPTION, DEFAULT_PAGE_TITLE } from 'InvestCommon/helpers/enums/routes';
import { setHSPageView } from 'InvestCommon/helpers/hubspot';

export interface IPageData {
  seo_description?: string;
  seo_title: string;
  canonical?: string;
}

interface ITagItem {
  content: string;
  name?: string;
  property?: string;
}
export const usePageSeo = () => {
  function setMetaContent(key: string, meta: ITagItem) {
    const element: HTMLElement | null = document.head.querySelector(`meta[${key}="${meta.name || meta.property}"]`);
    if (element instanceof HTMLMetaElement) {
      element.content = meta.content;
    }
  }

  function setTitle(pageData: IPageData) {
    const newTitle = pageData?.seo_title || `${DEFAULT_PAGE_TITLE}`;
    document.title = `${newTitle}`;
    const ogTitle = { property: 'og:title', content: document.title };

    setMetaContent('property', ogTitle);
    // hubspot page view
    setHSPageView(window.location.pathname);
  }

  function setRobotsAll() {
    const element: HTMLElement | null = document.head.querySelector('meta[robots]');
    if (element instanceof HTMLMetaElement) {
      element.content = 'noindex, nofollow';
    } else {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, nofollow';
      document.head.appendChild(meta);
    }
  }

  // function setOgImage(pageData: IPageData) {
  //   // const url = pageData?.thumbnail?.coverage?.url || `${seo.defaultImage}`;
  //   const url = `${seo.defaultImage}`;
  //   const ogImage = { property: 'og:image', content: url };

  //   setMetaContent('property', ogImage);
  // }

  function setUrl(pageData: IPageData) {
    let canonical = pageData?.canonical;
    if (!pageData?.canonical?.includes('http')) canonical = `${env.FRONTEND_URL}${pageData?.canonical}`;
    const path = canonical || `${env.FRONTEND_URL}${window.location.pathname}`;
    const ogUrl = { property: 'og:url', content: path };
    // set canonical url
    let link: HTMLLinkElement | null = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      if (link instanceof HTMLLinkElement) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
    }
    link.href = path;
    // set og:url
    setMetaContent('property', ogUrl);
  }

  function setMetaTags(pageData: IPageData) {
    const seoTags = [
      {
        name: 'description',
        content: pageData?.seo_description || DEFAULT_DESCRIPTION,
      },
      {
        property: 'og:description',
        content: pageData?.seo_description || DEFAULT_DESCRIPTION,
      },
    ];
    seoTags.forEach((singleTag: ITagItem) => {
      Object.keys(singleTag).forEach((key: string) => {
        setMetaContent(key, singleTag);
      });
    });
  }

  function setMetaData(pageData: IPageData) {
    setTitle(pageData);
    setMetaTags(pageData);
    setUrl(pageData);
  }

  return {
    setMetaContent,
    setTitle,
    setUrl,
    setMetaTags,
    setMetaData,
    setRobotsAll,
  };
};
