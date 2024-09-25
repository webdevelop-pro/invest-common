
// eslint-disable-next-line
import linkedInIcon from 'InvestCommon/assets/images/social/linkedin1.svg?url';
// eslint-disable-next-line
import facebookIcon from 'InvestCommon/assets/images/social/facebook1.svg?url';
// eslint-disable-next-line
import instagramIcon from 'InvestCommon/assets/images/social/instagram1.svg?url';
// eslint-disable-next-line
import githubIcon from 'InvestCommon/assets/images/social/github1.svg?url';
// eslint-disable-next-line
import twitterIcon from 'InvestCommon/assets/images/social/x-twitter.svg?url';

export const LINKEDIN = {
  icon: linkedInIcon,
  iconName: 'linkedin',
  href: 'https://www.linkedin.com/company/webdevelop-pro',
  name: 'LinkedIn',
  shareHref: 'https://www.linkedin.com/sharing/share-offsite/?url=',
} as const;

export const FACEBOOK = {
  icon: facebookIcon,
  iconName: 'facebook',
  href: 'https://www.facebook.com/WebdevelopPro',
  name: 'Facebook',
  shareHref: 'https://www.facebook.com/sharer.php?u=',
} as const;

export const INSTAGRAM = {
  icon: instagramIcon,
  iconName: 'instagram',
  href: 'https://www.instagram.com/webdevelop.pro',
  name: 'Instagram',
} as const;


export const TWITTER = {
  icon: twitterIcon,
  iconName: 'twitter',
  shareHref: 'https://twitter.com/intent/tweet?url=',
  name: 'Twitter',
} as const;

export const GITHUB = {
  icon: githubIcon,
  iconName: 'github',
  href: 'https://github.com/webdevelop-pro',
  name: 'Github',
} as const;
