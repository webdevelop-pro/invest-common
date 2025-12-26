/* eslint-disable vue/one-component-per-file */
/* @vitest-environment jsdom */

import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref } from 'vue'

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
      props: { href: { type: String, required: true } },
      setup(props, { slots, attrs }) {
        return () => h('a', { href: props.href, ...attrs }, slots.default?.())
      },
    }),
  }
})

vi.mock('UiKit/assets/images/menu_common/home.svg',         () => ({ default: hoisted.mockIcon('HomeIcon') }))
vi.mock('UiKit/assets/images/menu_common/grid.svg',  () => ({ default: hoisted.mockIcon('DashboardIcon') }))
vi.mock('UiKit/assets/images/menu_common/notifications.svg', () => ({ default: hoisted.mockIcon('NotificationIcon') }))
vi.mock('UiKit/assets/images/menu_common/investments.svg',   () => ({ default: hoisted.mockIcon('InvestmentIcon') }))
vi.mock('UiKit/assets/images/menu_common/wallet.svg',       () => ({ default: hoisted.mockIcon('WalletIcon') }))
vi.mock('UiKit/assets/images/menu_common/cryptoq.svg',() => ({ default: hoisted.mockIcon('CryptoIcon') }))
vi.mock('UiKit/assets/images/menu_common/help.svg',        () => ({ default: hoisted.mockIcon('HowIcon') }))
vi.mock('UiKit/assets/images/menu_common/faq.svg',         () => ({ default: hoisted.mockIcon('FaqIcon') }))

vi.mock('InvestCommon/domain/config/links.ts', () => ({
  urlHome: '/home',
  urlOffers: '/offers',
  urlHowItWorks: '/how-it-works',
  urlFaq: '/faq',
  urlNotifications: '/notifications',
  urlProfilePortfolio:   (id: string | number | null | undefined) => `/profiles/${id}/portfolio`,
  urlProfileWallet:      (id: string | number | null | undefined) => `/profiles/${id}/wallet`,
  urlProfileCryptoWallet:(id: string | number | null | undefined) => `/profiles/${id}/crypto`,
}))

// Pinia-stores через storeToRefs()
const userLoggedInRef = ref(false)
const selectedUserProfileIdRef = ref<string | number>('u-1')
const notificationUnreadLengthRef = ref(0)

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({ userLoggedIn: userLoggedInRef }),
}))
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({ selectedUserProfileId: selectedUserProfileIdRef }),
}))

vi.mock('InvestCommon/features/notifications/store/useNotifications', () => ({
  useNotifications: () => ({
    notificationUnreadLength: notificationUnreadLengthRef,
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
  })

  it('renders guest menu (4 items) when logged out', () => {
    const wrapper = mountMenu({ currentPath: '/home' })

    const ul = wrapper.get('ul.pwamenu__list')
    expect(ul.classes()).toContain('cols-4')

    const links = wrapper.findAll('a.pwamenu__link')
    expect(links.length).toBe(4)

    const labels = links.map(a => a.text().trim())
    expect(labels).toEqual(['Home', 'Invest', 'Help', 'FAQ'])

    const hrefs = links.map(a => a.attributes('href'))
    expect(hrefs).toEqual(['/home', '/offers', '/how-it-works', '/faq'])
  })

  it('renders auth menu (5 items) when logged in', () => {
    userLoggedInRef.value = true
    selectedUserProfileIdRef.value = 'abc'

    const wrapper = mountMenu({ currentPath: '/profiles/abc/portfolio' })

    const ul = wrapper.get('ul.pwamenu__list')
    expect(ul.classes()).toContain('cols-5')

    const hrefs = wrapper.findAll('a.pwamenu__link').map(a => a.attributes('href'))
    expect(hrefs).toEqual([
      '/profiles/abc/portfolio',
      '/profiles/abc/wallet',
      '/offers',
      '/profiles/abc/crypto',
      '/notifications',
    ])

    const labels = wrapper.findAll('.pwamenu__label').map(n => n.text())
    expect(labels).toEqual(['Dashboard', 'Wallet', 'Invest', 'Crypto', 'Notifications'])
  })

  it('applies is-active when currentPath equals link target', () => {
    const wrapper = mountMenu({ currentPath: '/offers' })
    const offers = wrapper.findAll('a.pwamenu__link').find(a => a.attributes('href') === '/offers')!
    expect(offers.classes()).toContain('is-active')
  })

  it('applies is-active when currentPath is within link subpath', () => {
    const wrapper = mountMenu({ currentPath: '/offers/deal-1?x=1#hash' })
    const offers = wrapper.findAll('a.pwamenu__link').find(a => a.attributes('href') === '/offers')!
    expect(offers.classes()).toContain('is-active')
  })
  it('uses layout fallback when URL does not share the section path', () => {
    const wrapper = mountMenu({ currentPath: '/deal-1', currentLayout: 'offer-single' })
    const offers = wrapper.findAll('a.pwamenu__link').find(a => a.attributes('href') === '/offers')!
    expect(offers.classes()).toContain('is-active')
  })

  it('uses withBase only for active detection (href remains raw)', () => {
    const withBase = (to: string) => `/base${to}`
    const wrapper = mountMenu({ currentPath: '/base/offers', withBase })

    const el = wrapper.findAll('a.pwamenu__link').find(a => a.text().includes('Invest'))!
    expect(el.attributes('href')).toBe('/offers')
    expect(el.classes()).toContain('is-active')
  })

  it('reacts to selectedUserProfileId change', async () => {
    userLoggedInRef.value = true
    selectedUserProfileIdRef.value = 'p1'
    const wrapper = mountMenu({ currentPath: '/profiles/p1/wallet' })

    let wallet = wrapper.findAll('a.pwamenu__link').find(a => a.text().includes('Wallet'))!
    expect(wallet.attributes('href')).toBe('/profiles/p1/wallet')
    expect(wallet.classes()).toContain('is-active')

    selectedUserProfileIdRef.value = 'p2'
    await wrapper.vm.$nextTick()

    wallet = wrapper.findAll('a.pwamenu__link').find(a => a.text().includes('Wallet'))!
    expect(wallet.attributes('href')).toBe('/profiles/p2/wallet')
    expect(wallet.classes()).not.toContain('is-active')
  })

  it('structural sanity: nav/ul/li icons exist', () => {
    const wrapper = mountMenu({ currentPath: '/home' })
    expect(wrapper.get('nav[aria-label="PWA Bottom Menu"]')).toBeTruthy()

    const items = wrapper.findAll('li.pwamenu__item')
    expect(items.length).toBe(4)

    items.forEach(li => {
      const icon = li.find('[data-icon]')
      expect(icon.exists()).toBe(true)
    })
  })
}
describe('PWAFooterMenu (jsdom)', { environment: 'jsdom' }, () => {
    pwafMenuTests()
  })
  
describe('PWAFooterMenu (node)', { environment: 'node' }, () => {
  pwafMenuTests()
})
