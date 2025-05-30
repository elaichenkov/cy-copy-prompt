describe('Template spec', () => {
  it('should verify title', () => {
    cy.visit('https://example.cypress.io');
    cy.url().should('include', 'example cypress');
  });

  it('should verify title #2', () => {
    cy.visit('https://example.cypress.io');
    cy.url().should('include', 'cypress');
  });
});
