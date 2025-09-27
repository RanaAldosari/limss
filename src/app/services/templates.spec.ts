import { TestBed } from '@angular/core/testing';

import { TemplatesService } from './templates';

describe('Templates', () => {
  let service: TemplatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplatesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
