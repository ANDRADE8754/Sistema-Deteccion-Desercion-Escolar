import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiesgoBadgeComponent } from './riesgo-badge.component';

describe('RiesgoBadgeComponent', () => {
  let component: RiesgoBadgeComponent;
  let fixture: ComponentFixture<RiesgoBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiesgoBadgeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RiesgoBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
