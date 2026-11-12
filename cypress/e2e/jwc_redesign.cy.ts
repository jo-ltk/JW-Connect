/// <reference types="cypress" />

/*
End-to-end check of the JW Connect screens (home and schedule workspace),
using the TEST mode demo congregation (start the app with
VITE_APP_MODE="TEST" on port 4050).

TEST mode wipes and re-seeds IndexedDB on every page load, so the spec moves
between screens by changing the hash, never by reloading.
*/

const APP = 'http://localhost:4050';

const DESKTOP: [number, number] = [1280, 900];
const MOBILE: [number, number] = [390, 844];

const goTo = (hash: string) =>
  cy.window().then((win) => {
    win.location.hash = hash;
  });

const readTable = <T>(table: string) =>
  cy.window().then(
    (win) =>
      new Cypress.Promise<T[]>((resolve, reject) => {
        const open = win.indexedDB.open('organized');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const request = db
            .transaction(table, 'readonly')
            .objectStore(table)
            .getAll();
          request.onsuccess = () => {
            db.close();
            resolve(request.result as T[]);
          };
          request.onerror = () => reject(request.error);
        };
      })
  );

/**
 * A fixed bar is really reachable: it lies inside the viewport and the
 * element under its centre belongs to it (nothing covers it).
 */
const shouldBeOnTop = (selector: string) =>
  cy.get(selector).should(($el) => {
    const el = $el[0];
    const rect = el.getBoundingClientRect();
    const doc = el.ownerDocument;

    expect(rect.top, 'top inside viewport').to.be.gte(0);
    expect(rect.bottom, 'bottom inside viewport').to.be.lte(
      doc.documentElement.clientHeight + 1
    );

    // a point on the first child, so the gap between items is not tested
    const child = el.firstElementChild as HTMLElement;
    const target = child.getBoundingClientRect();
    const hit = doc.elementFromPoint(
      target.left + target.width / 2,
      target.top + target.height / 2
    );

    expect(el.contains(hit), `${selector} is not covered`).to.eq(true);
  });

const weekLabel = () => cy.get('[data-testid="jwc-week-label"]').invoke('text');

// MUI layout code can trigger this harmless browser notice in the test runner
Cypress.on('uncaught:exception', (error) =>
  error.message.includes('ResizeObserver') ? false : undefined
);

// one demo session for the whole spec: a new page load would re-seed the data
describe('JW Connect', { testIsolation: false }, () => {
  before(() => {
    cy.viewport(...DESKTOP);
    cy.visit(`${APP}/#/`);
    cy.contains('button', /start testing/i, { timeout: 180000 }).click();
    cy.wait(2000);
    cy.get('body').then(($body) => {
      const ok = $body.find('[role="dialog"] button:contains("OK")');
      if (ok.length) cy.wrap(ok.first()).click();
    });
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('home: one primary feature, real data, no Organized dashboard', () => {
    cy.viewport(...DESKTOP);
    goTo('/');

    cy.get('body').should('have.class', 'jwc-shell');
    cy.contains('h1', 'Weekly Meeting Schedule');
    cy.contains('JW Connect');
    cy.contains('button', 'Open schedule');

    // current-week preview from the demo congregation, not placeholders
    cy.get('#jwc-preview-midweek').should('exist');
    cy.get('article[aria-labelledby="jwc-preview-midweek"]')
      .contains(/\d+ of \d+ parts assigned/)
      .should('exist');

    cy.contains('Coming soon');

    // the seven Organized dashboard cards are gone from the home page
    [
      'Ministry',
      'Persons',
      'Meeting materials',
      'Reports',
      'Congregation',
    ].forEach((header) => {
      cy.contains('h2, h3, p', new RegExp(`^${header}$`)).should('not.exist');
    });

    cy.wait(800);
    cy.screenshot('jwc-01-home-desktop', { capture: 'viewport' });

    cy.viewport(...MOBILE);
    cy.wait(600);
    shouldBeOnTop('nav[aria-label="Main navigation"]');
    cy.screenshot('jwc-02-home-mobile', { capture: 'fullPage' });
  });

  it('schedule: week stays the same across the three tabs', () => {
    cy.viewport(...DESKTOP);
    goTo('/');
    cy.contains('button', 'Open schedule').click();

    cy.location('hash').should('eq', '#/schedule/midweek');
    cy.get('[role="tab"]').should('have.length', 3);
    cy.get('[data-testid="jwc-schedule-view"]').should('exist');
    cy.contains('Chairman');
    cy.wait(800);
    cy.screenshot('jwc-03-schedule-midweek-desktop', { capture: 'viewport' });

    // move one week forward, then check every tab follows
    weekLabel().then((startLabel) => {
      cy.get('button[aria-label="Next week"]').click();
      weekLabel().should('not.eq', startLabel);
    });

    weekLabel().then((label) => {
      cy.contains('[role="tab"]', 'Weekend').click();
      cy.location('hash').should('eq', '#/schedule/weekend');
      weekLabel().should('eq', label);
      cy.contains('Watchtower', { matchCase: false });
      cy.wait(600);
      cy.screenshot('jwc-04-schedule-weekend-desktop', { capture: 'viewport' });

      cy.contains('[role="tab"]', 'Meeting duties').click();
      cy.location('hash').should('eq', '#/schedule/duties');
      weekLabel().should('eq', label);

      // the duties roster is generated for the shared week
      cy.contains('button', 'Duty positions').click();
      for (let i = 0; i < 4; i++) {
        cy.get('[role="dialog"] button[aria-label="Edit"]').eq(i).click();
        cy.contains('button', 'Add baptized brothers').click();
        cy.contains('[role="dialog"] button', 'Save').click();
      }
      cy.get('[role="dialog"] button[aria-label="Close"]').click();
      cy.contains('button', 'Generate').click();
      cy.contains('8 of 8 positions filled');

      // the stored roster belongs to the week shown by the workspace
      readTable<{ weekOf: string }>('duty_schedules').then((rows) => {
        expect(rows.length, 'one duty week generated').to.eq(1);
        const date = new Date(rows[0].weekOf);
        const month = date.toLocaleString('en', { month: 'long' });
        expect(label).to.contain(`${month} ${date.getDate()},`);
      });

      cy.wait(600);
      cy.screenshot('jwc-05-schedule-duties-desktop', { capture: 'viewport' });

      // back to midweek: still the same week
      cy.contains('[role="tab"]', 'Midweek').click();
      weekLabel().should('eq', label);
    });

    // "This week" returns to the current week
    cy.contains('button', 'This week').click();
    cy.contains('This week');
  });

  it('schedule: edit, saved indicator, review, publish step (mobile)', () => {
    cy.viewport(...MOBILE);
    goTo('/');
    cy.contains('h1', 'Weekly Meeting Schedule');

    // bottom navigation → Schedule, then the Midweek tab
    cy.get('nav[aria-label="Main navigation"]')
      .contains('button', 'Schedule')
      .click();
    cy.contains('[role="tab"]', 'Midweek').click();
    cy.location('hash').should('eq', '#/schedule/midweek');

    cy.get('[data-testid="jwc-schedule-view"]').should('exist');
    shouldBeOnTop('[data-testid="jwc-action-bar"]');
    shouldBeOnTop('nav[aria-label="Main navigation"]');
    cy.wait(800);
    cy.screenshot('jwc-06-schedule-view-mobile', { capture: 'viewport' });

    // 3. edit assignments with the existing editor
    cy.contains('button', 'Edit assignments').click();
    cy.get('[data-testid="jwc-editor"]').should('exist');
    cy.get('li[aria-current="step"]').should('contain.text', 'Edit');
    cy.wait(800);
    cy.screenshot('jwc-07-schedule-edit-mobile', { capture: 'viewport' });

    // person selection opens as a bottom sheet on phones
    cy.get('[data-testid="jwc-editor"] .MuiAutocomplete-root input')
      .first()
      .click({ force: true });
    cy.get('.MuiAutocomplete-popper [role="option"]').should('exist');
    cy.get('.MuiAutocomplete-popper').then(($popper) => {
      const rect = $popper[0].getBoundingClientRect();
      // the page always keeps a vertical scrollbar (overflow-y: scroll)
      const { clientWidth, clientHeight } =
        $popper[0].ownerDocument.documentElement;

      expect(rect.bottom, 'sheet sits on the bottom edge').to.be.closeTo(
        clientHeight,
        2
      );
      expect(rect.left, 'sheet starts at the left edge').to.be.closeTo(0, 1);
      expect(rect.width, 'sheet is full width').to.be.closeTo(clientWidth, 2);
    });
    cy.wait(700);
    cy.screenshot('jwc-08-person-sheet-mobile', { capture: 'viewport' });

    // pick someone else: the change is stored immediately
    cy.get('.MuiAutocomplete-popper [role="option"][aria-selected="false"]')
      .first()
      .click();
    cy.get('[data-testid="jwc-saved"]').should(
      'contain.text',
      'Saved just now'
    );
    cy.wait(300);
    cy.screenshot('jwc-09-saved-mobile', { capture: 'viewport' });

    // 4. review
    cy.contains('button', 'Review').click();
    cy.get('[data-testid="jwc-review"]').should('exist');
    cy.get('[data-testid="jwc-review"]').contains(/\d+ of \d+ parts assigned/);
    cy.get('li[aria-current="step"]').should('contain.text', 'Review');

    // 5. publish (connected) or export (this local demo is not connected)
    cy.get('[data-testid="jwc-action-bar"]')
      .contains('button', /^(Publish|Export PDF)$/)
      .should('exist');
    cy.wait(800);
    cy.screenshot('jwc-10-review-mobile', { capture: 'viewport' });

    // the existing tools are still reachable
    cy.get('button[aria-label="More actions"]').click();
    cy.contains('[role="menuitem"]', 'Autofill');
    cy.contains('[role="menuitem"]', 'Meeting settings');
    cy.screenshot('jwc-11-more-menu-mobile', { capture: 'viewport' });
    cy.get('body').type('{esc}');
  });

  it('duties tab and weekend on mobile', () => {
    cy.viewport(...MOBILE);
    cy.scrollTo('top');
    cy.contains('[role="tab"]', 'Weekend').click();
    cy.get('[data-testid="jwc-schedule-view"]').should('exist');
    cy.wait(800);
    cy.screenshot('jwc-12-weekend-mobile', { capture: 'viewport' });

    cy.contains('[role="tab"]', 'Meeting duties').click();
    cy.contains('button', /^(Generate|Regenerate)$/);
    cy.contains('button', 'Duty positions').should('exist');
    cy.wait(800);
    cy.screenshot('jwc-13-duties-mobile', { capture: 'viewport' });
  });

  it('dark appearance', () => {
    cy.viewport(...DESKTOP);
    goTo('/');
    cy.get('header .MuiSwitch-input').first().click({ force: true });
    cy.get('body').then(($body) => {
      const confirm = $body.find('[role="dialog"] button:contains("Confirm")');
      if (confirm.length) cy.wrap(confirm.first()).click();
    });
    cy.get('html').invoke('attr', 'data-theme').should('match', /dark$/);
    cy.wait(800);
    cy.screenshot('jwc-14-home-dark-desktop', { capture: 'viewport' });

    cy.viewport(...MOBILE);
    cy.get('nav[aria-label="Main navigation"]')
      .contains('button', 'Schedule')
      .click();
    cy.contains('[role="tab"]', 'Midweek').click();
    cy.wait(1000);
    cy.screenshot('jwc-15-schedule-dark-mobile', { capture: 'viewport' });

    // the hidden Organized screens keep their own look (and still work)
    cy.viewport(...DESKTOP);
    goTo('/dashboard');
    cy.get('body').should('not.have.class', 'jwc-shell');
    cy.contains('Meetings');
    cy.wait(1000);
    cy.screenshot('jwc-16-organized-dashboard-unchanged', {
      capture: 'viewport',
    });
  });
});
