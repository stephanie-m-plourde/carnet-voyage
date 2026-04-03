const { test, expect } = require('@playwright/test');

// ── HOME PAGE ───────────────────────────────────────────
test.describe('Page d\'accueil', () => {
  test('affiche le hero avec le titre', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('.hero-title')).toContainText('Voir le monde');
  });

  test('affiche le eyebrow', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-eyebrow')).toContainText('2 adultes');
    await expect(page.locator('.hero-eyebrow')).toContainText('soif d\'aventure');
  });

  test('affiche les voyages', async ({ page }) => {
    await page.goto('/');
    const slides = page.locator('.voyage-slide');
    await expect(slides.first()).toBeVisible();
    const count = await slides.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('chaque voyage a un nom et des dates', async ({ page }) => {
    await page.goto('/');
    const firstSlide = page.locator('.voyage-slide').first();
    await expect(firstSlide.locator('.voyage-slide-name')).toBeVisible();
    await expect(firstSlide.locator('.voyage-slide-dates')).toBeVisible();
  });

  test('le bouton Nos aventures scrolle vers les voyages', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hero-cta').click();
    await page.waitForTimeout(1000);
    const voyagesSection = page.locator('#voyages-list');
    await expect(voyagesSection).toBeInViewport();
  });
});

// ── NAVIGATION ──────────────────────────────────────────
test.describe('Navigation', () => {
  test('affiche le logo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.nav-logo')).toContainText('Carnets de voyage');
  });

  test('la barre de recherche est visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#nav-search-input')).toBeVisible();
  });

  test('la recherche retourne des résultats', async ({ page }) => {
    await page.goto('/');
    await page.fill('#nav-search-input', 'Tokyo');
    await page.waitForTimeout(500);
    const panel = page.locator('#search-panel');
    await expect(panel).toBeVisible();
  });

  test('naviguer vers À propos', async ({ page }) => {
    await page.goto('/');
    await page.locator('#nav-apropos-link').click();
    await expect(page.locator('#view-apropos')).toHaveClass(/active/);
  });

  test('naviguer vers Contact', async ({ page }) => {
    await page.goto('/');
    await page.locator('#nav-contact-link').click();
    await expect(page.locator('#view-contact')).toHaveClass(/active/);
  });

  test('le toggle thème fonctionne', async ({ page }) => {
    await page.goto('/');
    await page.locator('#theme-toggle').click();
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('light');
    await page.locator('#theme-toggle').click();
    const themeDark = await page.locator('html').getAttribute('data-theme');
    expect(themeDark).toBe('dark');
  });
});

// ── VOYAGE DETAIL ───────────────────────────────────────
test.describe('Détail voyage', () => {
  test('cliquer sur un voyage ouvre la page détail', async ({ page }) => {
    await page.goto('/');
    await page.locator('.voyage-slide-name').first().click();
    await expect(page.locator('#view-voyage')).toHaveClass(/active/);
    await expect(page.locator('.voyage-detail-name')).toBeVisible();
  });

  test('le breadcrumb est visible dans le détail voyage', async ({ page }) => {
    await page.goto('/');
    await page.locator('.voyage-slide-name').first().click();
    await expect(page.locator('#view-voyage .breadcrumb')).toBeVisible();
  });
});

// ── ADMIN ───────────────────────────────────────────────
test.describe('Admin', () => {
  async function loginAdmin(page) {
    await page.goto('/');
    await page.locator('.nav-admin-btn').click();
    await page.fill('#admin-pw', 'admin123');
    await page.locator('#login-modal .btn-primary').click();
    await expect(page.locator('#view-admin')).toHaveClass(/active/, { timeout: 10000 });
    // Wait for admin data to load
    await page.waitForTimeout(2000);
  }

  test('la modale de login s\'affiche', async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav-admin-btn').click();
    await expect(page.locator('#login-modal')).toBeVisible();
  });

  test('login avec mauvais mot de passe échoue', async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav-admin-btn').click();
    await page.fill('#admin-pw', 'wrongpassword');
    await page.locator('#login-modal .btn-primary').click();
    await page.waitForTimeout(500);
    await expect(page.locator('#login-error')).toBeVisible();
  });

  test('login avec bon mot de passe réussit', async ({ page }) => {
    await loginAdmin(page);
  });

  test('le dashboard affiche les statistiques', async ({ page }) => {
    await loginAdmin(page);
    const voyagesCount = await page.locator('#st-voyages').textContent();
    expect(parseInt(voyagesCount)).toBeGreaterThanOrEqual(1);
  });

  test('la liste des voyages est accessible', async ({ page }) => {
    await loginAdmin(page);
    await page.evaluate(() => showPanel('voyages-list'));
    await page.waitForTimeout(500);
    const panel = page.locator('#panel-voyages-list');
    await expect(panel).not.toHaveCSS('display', 'none');
  });

  test('la liste des articles est accessible', async ({ page }) => {
    await loginAdmin(page);
    await page.evaluate(() => showPanel('articles-list'));
    await page.waitForTimeout(500);
    const panel = page.locator('#panel-articles-list');
    await expect(panel).not.toHaveCSS('display', 'none');
  });

  test('le panneau mot de passe est accessible', async ({ page }) => {
    await loginAdmin(page);
    await page.evaluate(() => showPanel('password-edit'));
    await page.waitForTimeout(500);
    const panel = page.locator('#panel-password-edit');
    await expect(panel).not.toHaveCSS('display', 'none');
  });
});

// ── API ─────────────────────────────────────────────────
test.describe('API', () => {
  test('GET /api/health retourne ok', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('GET /api/voyages retourne les voyages', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/voyages');
    expect(res.ok()).toBeTruthy();
    const voyages = await res.json();
    expect(voyages.length).toBeGreaterThanOrEqual(1);
    expect(voyages[0]).toHaveProperty('name');
  });

  test('GET /api/articles retourne les articles publiés', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/articles');
    expect(res.ok()).toBeTruthy();
    const articles = await res.json();
    expect(Array.isArray(articles)).toBeTruthy();
    for (const a of articles) {
      expect(a.status).toBe('published');
    }
  });

  test('POST /api/auth/login avec bon mot de passe', async ({ request }) => {
    const res = await request.post('http://localhost:3000/api/auth/login', {
      data: { password: 'admin123' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('token');
  });

  test('POST /api/auth/login avec mauvais mot de passe', async ({ request }) => {
    const res = await request.post('http://localhost:3000/api/auth/login', {
      data: { password: 'wrong' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/articles/admin sans token échoue', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/articles/admin');
    expect(res.status()).toBe(401);
  });

  test('GET /api/settings retourne les paramètres', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/settings');
    expect(res.ok()).toBeTruthy();
    const settings = await res.json();
    expect(settings).toHaveProperty('ap-subtitle');
  });
});
