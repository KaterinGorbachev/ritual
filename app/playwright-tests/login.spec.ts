import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker/locale/en';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD

test.describe('dashboard access control', () => {
  test('dashboard can not be opened by not authorised person', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(/Вход/)
    await expect(page.getByRole('button', { name: 'Выйти' })).toHaveCount(0)
  })

  test('proxy answers with a redirect, not with the page', async ({ request }) => {
    // maxRedirects: 0 → we see the proxy's own response, before any HTML renders
    const response = await request.get('/dashboard?tab=services', { maxRedirects: 0 })

    expect(response.status()).toBe(307)
    expect(response.headers()['location']).toMatch(/\/admin$/) // the query string was dropped
  })

  test('nested dashboard paths are also blocked', async ({ request }) => {
    const response = await request.get('/dashboard/anything', { maxRedirects: 0 })
    expect(response.status()).toBe(307)
    expect(response.headers()['location']).toMatch(/\/admin$/)
  })
})

test.describe('login to CMS system', () => {
  test.beforeEach('go to admin page', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('h1')).toHaveText(/Управление контентом/)
  })

  test('login with valid credentials passes', async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set');

    await test.step('fill email', async () => {
      const emailBox = page.getByTestId('login-email-field')
      await expect(emailBox.locator('label')).toHaveText(/Электронная почта/)
      await expect(emailBox.locator('input[name="email"]')).toBeVisible()
      await emailBox.locator('input[name="email"]').fill(ADMIN_EMAIL!)


    })

    await test.step('fill password', async () => {
      const passwordBox = page.getByTestId('login-password-field')
      await expect(passwordBox.locator('label')).toHaveText(/Пароль/)
      await expect(passwordBox.locator('input[name="password"]')).toBeVisible()
      await passwordBox.locator('input[name="password"]').fill(ADMIN_PASSWORD!)

    })

    await test.step('sumbit and land on dashboard', async () => {
      const submitButton = page.getByTestId('login-submit')
      await submitButton.click()
      //await expect(submitButton).toHaveAttribute('disabled');
      await expect(page).toHaveURL(/\/dashboard$/)

    })

  })

  test('login with wrong credentials fails with error message', async ({ page }) => {
    await test.step('enter wrong email', async () => {
      const emailBox = page.getByTestId('login-email-field')
      await expect(emailBox.locator('label')).toHaveText(/Электронная почта/)
      await expect(emailBox.locator('input[name="email"]')).toBeVisible()
      await emailBox.locator('input[name="email"]').fill('wrong@email.com')
      // check that html check passed as valid input
      expect(await emailBox.locator('input[name="email"]').evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(true)
      // error message from Browser is empty
      expect(await emailBox.locator('input[name="email"]').evaluate((el: HTMLInputElement) => el.validationMessage)).toBe('')

    })

    await test.step('enter wrong password', async () => {
      const passwordBox = page.getByTestId('login-password-field')
      await expect(passwordBox.locator('label')).toHaveText(/Пароль/)
      await expect(passwordBox.locator('input[name="password"]')).toBeVisible()
      await passwordBox.locator('input[name="password"]').fill('wrong-password6')

    })

    await test.step('sumbit and land on dashboard', async () => {
      const submitButton = page.getByTestId('login-submit')
      await submitButton.click()
      await expect(page).toHaveURL(/\/admin$/)
      await expect(page.getByTestId('login-error')).toBeVisible()
      await expect(page.getByTestId('login-error')).toHaveText('Неверная почта или пароль. Проверьте раскладку клавиатуры и попробуйте снова')

    })

  })

  test('login with wrong email fails with error message', async ({ page }) => {
    test.skip(!ADMIN_PASSWORD, 'E2E_ADMIN_PASSWORD not set');

    await test.step('enter wrong email', async () => {
      const emailBox = page.getByTestId('login-email-field')
      await expect(emailBox.locator('label')).toHaveText(/Электронная почта/)
      await expect(emailBox.locator('input[name="email"]')).toBeVisible()
      await emailBox.locator('input[name="email"]').fill('zim.Mail@gmail.com')
      // check that html check passed as valid input
      expect(await emailBox.locator('input[name="email"]').evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(true)
      // error message from Browser is empty
      expect(await emailBox.locator('input[name="email"]').evaluate((el: HTMLInputElement) => el.validationMessage)).toBe('')

    })

    await test.step('enter wrong password', async () => {
      const passwordBox = page.getByTestId('login-password-field')
      await expect(passwordBox.locator('label')).toHaveText(/Пароль/)
      await expect(passwordBox.locator('input[name="password"]')).toBeVisible()
      await passwordBox.locator('input[name="password"]').fill(ADMIN_PASSWORD!)

    })

    await test.step('sumbit and land on dashboard', async () => {
      const submitButton = page.getByTestId('login-submit')
      await submitButton.click()
      await expect(page).toHaveURL(/\/admin$/)
      await expect(page.getByTestId('login-error')).toBeVisible()
      await expect(page.getByTestId('login-error')).toHaveText('Неверная почта или пароль. Проверьте раскладку клавиатуры и попробуйте снова')

    })

  })

  test('login with wrong password fails with error message', async ({ page }) => {
    test.skip(!ADMIN_EMAIL, 'E2E_ADMIN_PASSWORD not set');

    await test.step('enter wrong email', async () => {
      const emailBox = page.getByTestId('login-email-field')
      await expect(emailBox.locator('label')).toHaveText(/Электронная почта/)
      await expect(emailBox.locator('input[name="email"]')).toBeVisible()
      await emailBox.locator('input[name="email"]').fill(ADMIN_EMAIL!)

    })

    await test.step('enter wrong password', async () => {
      const passwordBox = page.getByTestId('login-password-field')
      await expect(passwordBox.locator('label')).toHaveText(/Пароль/)
      await expect(passwordBox.locator('input[name="password"]')).toBeVisible()
      await passwordBox.locator('input[name="password"]').fill('12345678')

    })

    await test.step('sumbit and land on dashboard', async () => {
      const submitButton = page.getByTestId('login-submit')
      await submitButton.click()
      await expect(page).toHaveURL(/\/admin$/)
      await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10000 })
      await expect(page.getByTestId('login-error')).toHaveText('Неверная почта или пароль. Проверьте раскладку клавиатуры и попробуйте снова')

    })

  })

  test('empty email fails with Browser error message', async ({ page }) => {
    const emailBox = page.getByTestId('login-email-field')
    const emailInput = emailBox.locator('input[name="email"]')

    await test.step('fill password', async () => {
      const passwordBox = page.getByTestId('login-password-field')
      await expect(passwordBox.locator('label')).toHaveText(/Пароль/)
      await expect(passwordBox.locator('input[name="password"]')).toBeVisible()
      await passwordBox.locator('input[name="password"]').fill(faker.internet.password())

    })

    await test.step('sumbit and land on dashboard', async () => {
      const submitButton = page.getByTestId('login-submit')
      await submitButton.click()
      await expect(page).toHaveURL(/\/admin$/)
      expect(await(emailInput.evaluate(((el: HTMLInputElement) => el.validity.valueMissing)))).toBe(true)
      expect(await(emailInput.evaluate(((el: HTMLInputElement) => el.validity.valueMissing)))).not.toBe('')

    })


  })

  test('empty password fails with Browser error message', async ({ page }) => {
    const emailBox = page.getByTestId('login-email-field')
    const emailInput = emailBox.locator('input[name="email"]')
    const passwordBox = page.getByTestId('login-password-field')
    const passwordInput = passwordBox.locator('input[name="password"]') 

    await test.step('enter fake email', async () => {      
      await expect(emailBox.locator('label')).toHaveText(/Электронная почта/)
      await expect(emailInput).toBeVisible()
      await emailInput.fill(faker.internet.email())
    })
    

    await test.step('sumbit and land on dashboard', async () => {
      const submitButton = page.getByTestId('login-submit')
      await submitButton.click()
      await expect(page).toHaveURL(/\/admin$/)
      expect(await(passwordInput.evaluate(((el: HTMLInputElement) => el.validity.valueMissing)))).toBe(true)
      expect(await(passwordInput.evaluate(((el: HTMLInputElement) => el.validity.valueMissing)))).not.toBe('')
    })


  })

  test('email field has type="email"', async ({ page }) => {
    const emailBox = page.getByTestId('login-email-field')
    const emailInput = emailBox.locator('input[name="email"]')
    await expect(emailInput).toHaveAttribute("type", "email")

  })

  test('password field has type="password"', async ({ page }) => {
    const passwordBox = page.getByTestId('login-password-field')
    const passwordInput = passwordBox.locator('input[name="password"]') 
    await expect(passwordInput).toHaveAttribute("type", "password")

  })


})
