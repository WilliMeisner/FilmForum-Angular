import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovieExplorer } from './movie-explorer';

describe('MovieExplorer', () => {
  let component: MovieExplorer;
  let fixture: ComponentFixture<MovieExplorer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieExplorer],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieExplorer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
