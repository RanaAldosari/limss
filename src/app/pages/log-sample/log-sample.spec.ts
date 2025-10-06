import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogSample } from './log-sample';

describe('LogSample', () => {
  let component: LogSample;
  let fixture: ComponentFixture<LogSample>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogSample]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogSample);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
