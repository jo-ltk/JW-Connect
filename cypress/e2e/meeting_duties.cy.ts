/// <reference types="cypress" />

/*
End-to-end check of the Meeting Duties organizer, using the TEST mode demo
congregation (start the app with VITE_APP_MODE="TEST" on port 4050).

TEST mode wipes and re-seeds IndexedDB on every page load, so persistence is
checked by leaving the page and coming back, and by reading the stored rows
straight from IndexedDB (which is what survives a browser refresh).
*/

const APP = 'http://localhost:4050';

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

const personButtons = (meeting: 'midweek' | 'weekend') =>
  cy
    .get(`section[aria-labelledby="duty-meeting-${meeting}"]`)
    .find(
      'button[aria-label^="Change who does"], button[aria-label^="Assign someone to"]'
    );

const namesIn = (meeting: 'midweek' | 'weekend') =>
  personButtons(meeting).then(($buttons) =>
    [...$buttons].map((button) => button.innerText.trim())
  );

describe('Meeting duties', () => {
  before(() => {
    cy.viewport(1280, 900);
    cy.visit(`${APP}/#/`);
    cy.contains('button', /start testing/i, { timeout: 180000 }).click();
    // the "what's new" notice may open after the welcome dialog
    cy.wait(2000);
    cy.get('body').then(($body) => {
      const ok = $body.find('[role="dialog"] button:contains("OK")');
      if (ok.length) cy.wrap(ok.first()).click();
    });
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('sets up duties, generates, edits, locks, regenerates and keeps history', () => {
    cy.viewport(1280, 900);
    goTo('/meeting-duties');
    cy.contains('h1, h2, p, span', 'Meeting duties', { timeout: 20000 });

    // the four starting duties are created on first visit
    cy.contains('button', 'Duty positions').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('Sound console operator');
      cy.contains('Stage attendant');
      cy.contains('Microphone 1');
      cy.contains('Microphone 2');
    });

    // make the baptized brothers eligible for every duty
    for (let i = 0; i < 4; i++) {
      cy.get('[role="dialog"] button[aria-label="Edit"]').eq(i).click();
      cy.contains('button', 'Add baptized brothers').click();
      cy.contains('[role="dialog"] button', 'Save').click();
    }
    cy.get('[role="dialog"]')
      .contains(/\b0 eligible/)
      .should('not.exist');
    cy.screenshot('duties-01-positions');
    cy.get('[role="dialog"] button[aria-label="Close"]').click();

    // empty week: everything shows as not assigned
    cy.contains('Not started');
    cy.contains('0 of 8 positions filled');

    // 1. generate a complete roster
    cy.contains('button', 'Generate').click();
    cy.contains('8 of 8 positions filled');
    cy.contains('Draft');
    cy.contains('Not assigned').should('not.exist');
    cy.screenshot('duties-02-generated');

    // 2. nobody holds two positions in the same meeting
    (['midweek', 'weekend'] as const).forEach((meeting) => {
      namesIn(meeting).then((names) => {
        expect(new Set(names).size, `${meeting} unique`).to.eq(names.length);
      });
    });

    // 3. lock the first midweek position
    let lockedName = '';
    let manualName = '';
    personButtons('midweek')
      .first()
      .invoke('text')
      .then((text) => {
        lockedName = text;
      });
    cy.get(
      'section[aria-labelledby="duty-meeting-midweek"] button[aria-label="Lock"]'
    )
      .first()
      .click();
    cy.contains('Locked');

    // 4. assign the second midweek position manually
    personButtons('midweek').eq(1).click();
    cy.get('[role="option"][aria-selected="false"]:not([aria-disabled="true"])')
      .first()
      .find('p, span')
      .first()
      .invoke('text')
      .then((text) => {
        manualName = text;
      });
    cy.get('[role="option"][aria-selected="false"]:not([aria-disabled="true"])')
      .first()
      .click();
    cy.then(() => {
      personButtons('midweek').eq(1).should('contain.text', manualName);
    });
    cy.contains('Manual');

    // 5. regenerate: locked and manual positions are kept
    cy.contains('button', 'Regenerate').click();
    cy.contains('8 of 8 positions filled');
    cy.then(() => {
      personButtons('midweek').first().should('have.text', lockedName);
    });
    cy.then(() => {
      personButtons('midweek').eq(1).should('contain.text', manualName);
    });
    (['midweek', 'weekend'] as const).forEach((meeting) => {
      namesIn(meeting).then((names) => {
        expect(new Set(names).size, `${meeting} unique`).to.eq(names.length);
      });
    });

    // 6. swap two weekend positions
    let soundName = '';
    let stageName = '';
    personButtons('weekend')
      .eq(0)
      .invoke('text')
      .then((text) => {
        soundName = text;
      });
    cy.get(
      'section[aria-labelledby="duty-meeting-weekend"] button[aria-label="Swap"]'
    )
      .first()
      .click();
    cy.get('[role="dialog"]')
      .contains('button', 'Weekend meeting · Stage attendant')
      .find('p')
      .last()
      .invoke('text')
      .then((text) => {
        stageName = text;
      });
    cy.get('[role="dialog"]')
      .contains('button', 'Weekend meeting · Stage attendant')
      .click();
    cy.get('[role="dialog"]').should('not.exist');
    cy.then(() => {
      personButtons('weekend').eq(0).should('have.text', stageName);
      personButtons('weekend').eq(1).should('have.text', soundName);
    });

    // 7. remove an assignment
    cy.get(
      'section[aria-labelledby="duty-meeting-weekend"] button[aria-label="Remove assignment"]'
    )
      .last()
      .click();
    cy.contains('7 of 8 positions filled');

    // 8. history is kept and correct
    readTable<{
      status: string;
      source: string;
      person_uid: string;
    }>('duty_history').then((history) => {
      const active = history.filter((record) => record.status === 'active');
      expect(active.length, 'active history = filled positions').to.eq(7);
      expect(history.some((record) => record.status === 'replaced')).to.eq(
        true
      );
      expect(history.some((record) => record.status === 'removed')).to.eq(true);
      expect(active.some((record) => record.source === 'manual')).to.eq(true);
    });

    // 9. stored roster matches the screen
    readTable<{
      weekOf: string;
      slots: { person_uid: string; locked: boolean }[];
    }>('duty_schedules').then((schedules) => {
      expect(schedules.length).to.eq(1);
      const filled = schedules[0].slots.filter((slot) => slot.person_uid);
      expect(filled.length).to.eq(7);
      expect(schedules[0].slots.filter((slot) => slot.locked).length).to.eq(1);
    });

    // 10. leave and come back: the roster is read back from IndexedDB
    goTo('/');
    cy.contains('Meeting duties', { timeout: 20000 });
    goTo('/meeting-duties');
    cy.contains('7 of 8 positions filled', { timeout: 20000 });
    cy.then(() => {
      personButtons('midweek').first().should('have.text', lockedName);
    });

    // 11. publish, then the next week starts empty
    cy.contains('button', 'Mark as published').click();
    cy.contains('Published');
    cy.get('button[aria-label="Next"]').first().click();
    cy.contains('0 of 8 positions filled');
    cy.contains('button', 'Generate').click();
    cy.contains('8 of 8 positions filled');

    // 12. history dialog
    cy.contains('button', 'History').click();
    cy.get('[role="dialog"]').contains('records');
    cy.screenshot('duties-03-history');
    cy.get('[role="dialog"] button[aria-label="Close"]').click();

    // 13. print (PDF download)
    cy.contains('button', 'Print').click();
    cy.wait(4000);
    cy.exec(
      `node -e "console.log(require('fs').readdirSync(process.argv[1]).join(','))" "${Cypress.config('downloadsFolder')}"`
    )
      .its('stdout')
      .should('match', /MeetingDuties_\d{8}\.pdf/);

    // 14. mobile layout
    cy.viewport(390, 844);
    cy.screenshot('duties-04-mobile');
  });
});
