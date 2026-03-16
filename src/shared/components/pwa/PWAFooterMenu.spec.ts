/* eslint-disable vue/one-component-per-file */
/* @vitest-environment jsdom */

import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cloneVNode, defineComponent, h, isVNode, ref } from 'vue'

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')

  return {
    ...actual,
    RouterLink: defineComponent({
      name: 'RouterLink',
      props: {
        to: { type: String, required: true },
      },
      setup(props, { slots, attrs }) {
        return () => h('a', { href: props.to, ...attrs }, slots.default?.())
      },
    }),
  }
})

// ------------------- HOIST-SAFE HELPERS -------------------
const hoisted = vi.hoisted(() => ({
  mockIcon: (name: string) =>
    defineComponent({ name, setup: () => () => h('i', { 'data-icon': name }) }),
}))

// ------------------- MOCKS -------------------

vi.mock('UiKit/components/Base/VNavigationMenu', () => {
  return {
    VNavigationMenuLink: defineComponent({
      name: 'VNavigationMenuLink',
      props: { href: { type: String, required: false, default: undefined } },
      setup(props, { slots, attrs }) {
        return () => {
          const children = slots.default?.() ?? []
          const isAsChild = 'as-child' in attrs || 'asChild' in attrs

          if (isAsChild && children[0] && isVNode(children[0])) {
            return cloneVNode(children[0], {
              ...attrs,
              class: attrs.class,
            })
          }

          return h('a', { href: props.href, ...attrs }, children)
        }
      },
    }),
  }
})

vi.mock('UiKit/assets/images/menu_common/home.svg', () => ({ default: hoisted.mockIcon('HomeIcon') }))
vi.mock('UiKit/assets/images/menu_common/investments.svg', () => ({ default: hoisted.mockIcon('InvestmentIcon') }))
vi.mock('UiKit/assets/images/menu_common/portfolio.svg', () => ({ default: hoisted.mockIcon('PortfolioIcon') }))
vi.mock('UiKit/assets/images/menu_common/wallet.svg', () => ({ default: hoisted.mockIcon('WalletIcon') }))
vi.mock('UiKit/assets/images/menu_common/percent.svg', () => ({ default: hoisted.mockIcon('EarnIcon') }))
vi.mock('UiKit/assets/images/menu_common/help.svg', () => ({ default: hoisted.mockIcon('HelpIcon') }))
vi.mock('UiKit/assets/images/menu_common/faq.svg', () => ({ default: hoisted.mockIcon('FaqIcon') }))

vi.mock('InvestCommon/domain/config/links', () => ({
  urlHome: '/home',
  urlOffers: '/offers',
  urlHowItWorks: '/how-it-works',
  urlFaq: '/faq',
  urlProfilePortfolio:   (id: string | number | null | undefined) => `/profile/${id}/portfolio`,
  urlProfileSummary:     (id: string | number | null | undefined) => `/profile/${id}/summary`,
  urlProfileWallet:      (id: string | number | null | undefined) => `/profile/${id}/wallet`,
  urlProfileEarn:        (id: string | number | null | undefined) => `/profile/${id}/earn`,
  urlProfileTabSummary:  (id: string | number | null | undefined) => `/profile/${id}/account?tab=summary`,
  urlProfileTabPortfolio:(id: string | number | null | undefined) => `/profile/${id}/account?tab=portfolio`,
  urlProfileTabWallet:   (id: string | number | null | undefined) => `/profile/${id}/account?tab=wallet`,
  urlProfileTabEarn:     (id: string | number | null | undefined) => `/profile/${id}/account?tab=earn`,
}))

vi.mock('InvestCommon/config/env', () => ({
  default: {
    FRONTEND_URL: 'https://example.test/dashboard',
    FRONTEND_URL_DASHBOARD: 'https://example.test/dashboard',
  },
}))

// Pinia-stores через storeToRefs()
const userLoggedInRef = ref(false)
const selectedUserProfileIdRef = ref<string | number>('u-1')
const notificationsSidebarOpenRef = ref(false)

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({ userLoggedIn: userLoggedInRef }),
}))
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({ selectedUserProfileId: selectedUserProfileIdRef }),
}))

vi.mock('InvestCommon/features/notifications/store/useNotifications', () => ({
  useNotifications: () => ({
    isSidebarOpen: notificationsSidebarOpenRef,
  }),
}))

// Mock storeToRefs to handle refs properly
vi.mock('pinia', async () => {
  const actual = await vi.importActual('pinia')
  return {
    ...actual,
    storeToRefs: (store: any) => {
      if (!store) return {}
      const refs: any = {}
      for (const key in store) {
        if (store[key] && typeof store[key] === 'object' && 'value' in store[key]) {
          refs[key] = store[key]
        } else if (store[key] !== null && store[key] !== undefined) {
          refs[key] = { value: store[key] }
        }
      }
      return refs
    },
  }
})

// ------------------- IMPORT SUT -------------------
import PWAFooterMenu from './PWAFooterMenu.vue'

// ------------------- HELPERS -------------------
const mountMenu = (props?: Record<string, any>) =>
  mount(PWAFooterMenu, {
    props,
    attachTo: document.body,
  })

// ------------------- TESTS -------------------

function pwafMenuTests() {
  beforeEach(() => {
    userLoggedInRef.value = false
    selectedUserProfileIdRef.value = 'u-1'
    notificationsSidebarOpenRef.value = false
  })

  it('renders guest menu (4 items) when logged out', () => {
    const wrapper = mountMenu({ currentPath: '/home' })

    const ul = wrapper.get('ul.pwa-footer-menu__list')
    expect(ul.classes()).toContain('pwa-footer-menu__list--cols-4')

    const links = wrapper.findAll('a.pwa-footer-menu__link')
    expect(links.length).toBe(4)

    const labels = links.map(a => a.text().trim())
    expect(labels).toEqual(['Home', 'Invest', 'Help', 'FAQ'])

    const hrefs = links.map(a => a.attributes('href'))
    expect(hrefs).toEqual(['/home', '/offers', '/how-it-works', '/faq'])
  })

  it('renders auth menu (5 items) when logged in', () => {
    userLoggedInRef.value = true
    selectedUserProfileIdRef.value = 'abc'

    const wrapper = mountMenu({ currentPath: '/profile/abc/portfolio' })

    const ul = wrapper.get('ul.pwa-footer-menu__list')
    expect(ul.classes()).toContain('pwa-footer-menu__list--cols-5')

    const hrefs = wrapper.findAll('a.pwa-footer-menu__link').map(a => a.attributes('href'))
    expect(hrefs).toEqual([
      '/profile/abc/account?tab=summary',
      '/profile/abc/account?tab=portfolio',
      '/offers',
      '/profile/abc/account?tab=wallet',
      '/profile/abc/account?tab=earn',
    ])

    const labels = wrapper.findAll('.pwa-footer-menu__label').map(n => n.text())
    expect(labels).toEqual(['Home', 'Portfolio', 'Invest', 'Wallet', 'Earn'])
  })

  it('applies is-active when currentPath equals link target', () => {
    const wrapper = mountMenu({ currentPath: '/offers' })
    const offers = wrapper.findAll('a.pwa-footer-menu__link').find(a => a.attributes('href') === '/offers')!
    expect(offers.classes()).toContain('pwa-footer-menu__link--active')
    expect(offers.attributes('aria-current')).toBe('page')
  })

  it('applies is-active when currentPath is within link subpath', () => {
    const wrapper = mountMenu({ currentPath: '/offers/deal-1?x=1#hash' })
    const offers = wrapper.findAll('a.pwa-footer-menu__link').find(a => a.attributes('href') === '/offers')!
    expect(offers.classes()).toContain('pwa-footer-menu__link--active')
  })
  it('marks Portfolio active on account route when the portfolio tab is selected', () => {
    userLoggedInRef.value = true
    selectedUserProfileIdRef.value = 'abc'
    const wrapper = mountMenu({ currentPath: '/profile/abc/account?tab=portfolio' })
    const portfolio = wrapper.findAll('a.pwa-footer-menu__link').find(a => a.attributes('href') === '/profile/abc/account?tab=portfolio')!
    expect(portfolio.classes()).toContain('pwa-footer-menu__link--active')
  })

  it('uses withBase only for active detection (href remains raw)', () => {
    const withBase = (to: string) => `/base${to}`
    const wrapper = mountMenu({ currentPath: '/base/offers', withBase })

    const el = wrapper.findAll('a.pwa-footer-menu__link').find(a => a.text().includes('Invest'))!
    expect(el.attributes('href')).toBe('/offers')
    expect(el.classes()).toContain('pwa-footer-menu__link--active')
  })

  it('matches absolute menu urls against router paths', () => {
    userLoggedInRef.value = true
    selectedUserProfileIdRef.value = 'abc'

    const wrapper = mountMenu({ currentPath: '/profile/abc/account?tab=earn' })

    const earn = wrapper.findAll('a.pwa-footer-menu__link').find(a => a.attributes('href') === '/profile/abc/account?tab=earn')!
    expect(earn.classes()).toContain('pwa-footer-menu__link--active')
  })

  it('matches dashboard-prefixed paths against internal menu links', () => {
    userLoggedInRef.value = true
    selectedUserProfileIdRef.value = '1049'

    const wrapper = mountMenu({ currentPath: '/dashboard/profile/1049/account?tab=earn' })

    const earn = wrapper.findAll('a.pwa-footer-menu__link').find(a => a.attributes('href') === '/profile/1049/account?tab=earn')!
    expect(earn.classes()).toContain('pwa-footer-menu__link--active')
  })

  it('updates links when selectedUserProfileId changes without keeping a stale active state', async () => {
    userLoggedInRef.value = true
    selectedUserProfileIdRef.value = 'p1'
    const wrapper = mountMenu({ currentPath: '/profile/p1/account?tab=wallet' })

    let wallet = wrapper.findAll('a.pwa-footer-menu__link').find(a => a.text().includes('Wallet'))!
    expect(wallet.attributes('href')).toBe('/profile/p1/account?tab=wallet')
    expect(wallet.classes()).toContain('pwa-footer-menu__link--active')

    selectedUserProfileIdRef.value = 'p2'
    await wrapper.vm.$nextTick()

    wallet = wrapper.findAll('a.pwa-footer-menu__link').find(a => a.text().includes('Wallet'))!
    expect(wallet.attributes('href')).toBe('/profile/p2/account?tab=wallet')
    expect(wallet.classes()).not.toContain('pwa-footer-menu__link--active')
  })

  it('does not mark another account tab active when query tab differs', () => {
    userLoggedInRef.value = true
    selectedUserProfileIdRef.value = 'abc'

    const wrapper = mountMenu({ currentPath: '/profile/abc/account?tab=earn' })

    const summary = wrapper.findAll('a.pwa-footer-menu__link').find(a => a.attributes('href') === '/profile/abc/account?tab=summary')!
    const portfolio = wrapper.findAll('a.pwa-footer-menu__link').find(a => a.attributes('href') === '/profile/abc/account?tab=portfolio')!
    const earn = wrapper.findAll('a.pwa-footer-menu__link').find(a => a.attributes('href') === '/profile/abc/account?tab=earn')!

    expect(summary.classes()).not.toContain('pwa-footer-menu__link--active')
    expect(portfolio.classes()).not.toContain('pwa-footer-menu__link--active')
    expect(earn.classes()).toContain('pwa-footer-menu__link--active')
  })

  it('structural sanity: nav/ul/li icons exist', () => {
    const wrapper = mountMenu({ currentPath: '/home' })
    expect(wrapper.get('nav[aria-label="PWA Bottom Menu"]')).toBeTruthy()

    const items = wrapper.findAll('li.pwa-footer-menu__item')
    expect(items.length).toBe(4)

    items.forEach(li => {
      const icon = li.find('[data-icon]')
      expect(icon.exists()).toBe(true)
    })
  })

  it('hides menu on offer details layout', () => {
    const wrapper = mountMenu({ currentPath: '/offers/some-offer', currentLayout: 'offer-single' })
    expect(wrapper.find('nav[aria-label="PWA Bottom Menu"]').exists()).toBe(false)
  })

  it('hides menu when notifications sidebar is open', () => {
    notificationsSidebarOpenRef.value = true
    const wrapper = mountMenu({ currentPath: '/home' })
    expect(wrapper.find('nav[aria-label="PWA Bottom Menu"]').exists()).toBe(false)
  })

}
describe('PWAFooterMenu (jsdom)', { environment: 'jsdom' }, () => {
    pwafMenuTests()
  })
  
describe('PWAFooterMenu (node)', { environment: 'node' }, () => {
  pwafMenuTests()
})
