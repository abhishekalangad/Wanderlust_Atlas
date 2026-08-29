import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TravelogueService } from '../../core/services/travelogue.service';
import { AuthService } from '../../core/services/auth.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { Travelogue } from '../../core/models/types';

@Component({
  selector: 'app-travelogues',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent, LoaderComponent],
  templateUrl: './travelogues.component.html',
  styleUrls: ['./travelogues.component.scss'],
})
export class TraveloguesComponent implements OnInit {
  private travelogueService = inject(TravelogueService);
  auth = inject(AuthService);

  travelogues = signal<Travelogue[]>([]);
  loading = signal(true);

  async ngOnInit(): Promise<void> {
    const list = await this.travelogueService.getTravelogues();
    this.travelogues.set(list);
    this.loading.set(false);
  }

  canEdit(item: Travelogue): boolean {
    const user = this.auth.currentUser();
    const isAdmin = this.auth.isAdmin();
    if (!user) return false;
    return user.id === item.user_id || isAdmin;
  }
}
