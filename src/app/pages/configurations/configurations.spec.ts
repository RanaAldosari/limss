import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Configurations } from './configurations';

describe('Configurations', () => {
  let component: Configurations;
  let fixture: ComponentFixture<Configurations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Configurations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Configurations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
