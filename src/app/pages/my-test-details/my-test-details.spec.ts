import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyTestDetails } from './my-test-details';

describe('MyTestDetails', () => {
  let component: MyTestDetails;
  let fixture: ComponentFixture<MyTestDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyTestDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyTestDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
