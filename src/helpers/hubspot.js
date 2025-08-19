import { nanoid } from 'nanoid';

export function setHSPageView(path) {
  var _hsq = window._hsq = window._hsq || [];
  _hsq.push(['setPath', path]);
  _hsq.push(['trackPageView']);
}
export function setHSUserVisitor() {
  _hsq.push(['identify',{
    status: 'visitor',
    id: nanoid(),
  }]);
}
export function setHSUserContact(email) {
  _hsq.push(['identify',{
    email,
    status: 'contact',
  }]);
}
