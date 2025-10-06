import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleReports } from './sample-reports';

describe('SampleReports', () => {
  let component: SampleReports;
  let fixture: ComponentFixture<SampleReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
