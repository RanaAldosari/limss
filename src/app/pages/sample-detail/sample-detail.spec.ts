import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleDetail } from './sample-detail';

describe('SampleDetail', () => {
  let component: SampleDetail;
  let fixture: ComponentFixture<SampleDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
