import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Coordinat } from './coordinat';

describe('Coordinat', () => {
  let component: Coordinat;
  let fixture: ComponentFixture<Coordinat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Coordinat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Coordinat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
