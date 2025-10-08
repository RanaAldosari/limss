import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultDetails } from './result-details';

describe('ResultDetails', () => {
  let component: ResultDetails;
  let fixture: ComponentFixture<ResultDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
