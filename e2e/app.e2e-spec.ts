import { MusicalStructurePage } from './app.po';

describe('musical-structure App', () => {
  let page: MusicalStructurePage;

  beforeEach(() => {
    page = new MusicalStructurePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
