import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestMain } from './test-main';

describe('TestMain', () => {
  let component: TestMain;
  let fixture: ComponentFixture<TestMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestMain]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestMain);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
