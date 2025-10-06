import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestReports } from './test-reports';

describe('TestReports', () => {
  let component: TestReports;
  let fixture: ComponentFixture<TestReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
