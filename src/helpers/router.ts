import { RouteLocation } from 'vue-router';

const tablet = 768;

export function hasSameInMatched(route1: RouteLocation, route2: RouteLocation) {
  return route1.matched.some((m1) => route2.matched.some((m2) => m1.name === m2.name));
}

export function isSkipScrollTab(to: RouteLocation, from: RouteLocation) {
  const hasMeta = to.meta.skipScrollTab || from.meta.skipScrollTab;
  const hasMetaTablet = (to.meta.skipScrollTabTablet || from.meta.skipScrollTabTablet)
    && document.documentElement.clientWidth <= tablet;
  return (hasMeta || hasMetaTablet) && hasSameInMatched(to, from);
}
