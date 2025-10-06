import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleDetails } from './role-details';

describe('RoleDetails', () => {
  let component: RoleDetails;
  let fixture: ComponentFixture<RoleDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
