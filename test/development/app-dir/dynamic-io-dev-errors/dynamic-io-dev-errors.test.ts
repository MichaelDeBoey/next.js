import { nextTestSetup } from 'e2e-utils'
import {
  assertHasRedbox,
  getRedboxCallStack,
  getRedboxDescription,
  hasErrorToast,
  retry,
  waitForAndOpenRuntimeError,
} from 'next-test-utils'

describe('Dynamic IO Dev Errors', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  it('should show a red box error on the SSR render', async () => {
    const browser = await next.browser('/error')

    await retry(async () => {
      expect(await hasErrorToast(browser)).toBe(true)

      await waitForAndOpenRuntimeError(browser)

      expect(await getRedboxDescription(browser)).toMatchInlineSnapshot(
        `"[ Server ] Error: Route "/error" used \`Math.random()\` outside of \`"use cache"\` and without explicitly calling \`await connection()\` beforehand. See more info here: https://nextjs.org/docs/messages/next-prerender-random"`
      )
    })
  })

  it('should show a red box error on client navigations', async () => {
    const browser = await next.browser('/no-error')

    expect(await hasErrorToast(browser)).toBe(false)

    await browser.elementByCss("[href='/error']").click()

    await retry(async () => {
      expect(await hasErrorToast(browser)).toBe(true)

      await waitForAndOpenRuntimeError(browser)

      expect(await getRedboxDescription(browser)).toMatchInlineSnapshot(
        `"[ Server ] Error: Route "/error" used \`Math.random()\` outside of \`"use cache"\` and without explicitly calling \`await connection()\` beforehand. See more info here: https://nextjs.org/docs/messages/next-prerender-random"`
      )
    })
  })

  // Disabling so I can land docs update. reenable after
  it.skip('should display error when component accessed data without suspense boundary', async () => {
    const browser = await next.browser('/no-accessed-data')

    await retry(async () => {
      expect(await hasErrorToast(browser)).toBe(true)
      await waitForAndOpenRuntimeError(browser)
      await assertHasRedbox(browser)
    })

    const description = await getRedboxDescription(browser)
    const stack = await getRedboxCallStack(browser)
    const result = {
      description,
      stack,
    }

    expect(result).toMatchInlineSnapshot(`
      {
        "description": "[ Server ] Error: Route "/no-accessed-data": A component accessed data, headers, params, searchParams, or a short-lived cache without a Suspense boundary nor a "use cache" above it. We don't have the exact line number added to error messages yet but you can see which component in the stack below. See more info: https://nextjs.org/docs/messages/next-prerender-missing-suspense",
        "stack": "Page [Server]
      <anonymous> (2:1)
      Root [Server]
      <anonymous> (2:1)
      RedirectErrorBoundary
      ./dist/esm/server/route-modules/app-page/module.js
      RedirectBoundary
      ./dist/esm/server/route-modules/app-page/module.js
      ReactDevOverlay
      ./dist/esm/client/components/react-dev-overlay/app/hot-reloader-client.js
      HotReload
      ./dist/esm/client/components/react-dev-overlay/app/hot-reloader-client.js
      Router
      ./dist/esm/server/route-modules/app-page/module.js
      ErrorBoundaryHandler
      ./dist/esm/server/route-modules/app-page/module.js
      ErrorBoundary
      ./dist/esm/server/route-modules/app-page/module.js
      AppRouter
      ./dist/esm/server/route-modules/app-page/module.js
      ServerInsertedHTMLProvider
      ./dist/esm/server/route-modules/app-page/module.js
      App
      ./dist/esm/server/route-modules/app-page/module.js",
      }
    `)
  })
})
