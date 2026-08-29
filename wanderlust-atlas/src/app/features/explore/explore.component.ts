import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DestinationsService } from '../../core/services/destinations.service';
import { DestinationCardComponent } from '../../shared/components/destination-card/destination-card.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { Destination, DestinationFilters, CATEGORIES, CONTINENTS, SEASONS, DestinationCategory, Difficulty } from '../../core/models/types';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DestinationCardComponent, FooterComponent],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
})
export class ExploreComponent implements OnInit {
  private destService = inject(DestinationsService);

  destinations = signal<Destination[]>([]);
  loading = this.destService.loading;
  viewMode = signal<'grid' | 'list'>('grid');
  sidebarOpen = signal(false);

  skeletons = Array(9).fill(0);

  // Filter state
  searchQuery = signal('');
  selectedCategory = signal<DestinationCategory | ''>('');
  selectedContinent = signal('');
  selectedDifficulty = signal<Difficulty | ''>('');
  selectedSeason = signal('');
  minCost = signal(0);
  maxCost = signal(10000);
  sortBy = signal<DestinationFilters['sortBy']>('featured');

  readonly categories = CATEGORIES;
  readonly continents = CONTINENTS;
  readonly seasons = SEASONS;
  readonly difficulties: Difficulty[] = ['easy', 'moderate', 'challenging'];

  private searchTimeout: any;

  async ngOnInit(): Promise<void> {
    await this.loadDestinations();
  }

  async loadDestinations(): Promise<void> {
    const filters: DestinationFilters = {
      search: this.searchQuery() || undefined,
      category: this.selectedCategory() || undefined,
      continent: this.selectedContinent() || undefined,
      difficulty: this.selectedDifficulty() || undefined,
      bestSeason: this.selectedSeason() || undefined,
      minCost: this.minCost() > 0 ? this.minCost() : undefined,
      maxCost: this.maxCost() < 10000 ? this.maxCost() : undefined,
      sortBy: this.sortBy(),
    };
    const results = await this.destService.getDestinations(filters);
    this.destinations.set(results);
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadDestinations(), 300);
  }

  async onFilterChange(): Promise<void> {
    await this.loadDestinations();
  }

  async clearFilters(): Promise<void> {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.selectedContinent.set('');
    this.selectedDifficulty.set('');
    this.selectedSeason.set('');
    this.minCost.set(0);
    this.maxCost.set(10000);
    this.sortBy.set('featured');
    await this.loadDestinations();
  }

  toggleView(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.selectedCategory() ||
      this.selectedContinent() ||
      this.selectedDifficulty() ||
      this.selectedSeason() ||
      this.searchQuery() ||
      this.minCost() > 0 ||
      this.maxCost() < 10000
    );
  }
}
