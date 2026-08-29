import { Pipe, PipeTransform } from '@angular/core';
import { CATEGORIES } from '../../core/models/types';

@Pipe({
  name: 'categoryIcon',
  standalone: true,
})
export class CategoryIconPipe implements PipeTransform {
  transform(category: string): string {
    const found = CATEGORIES.find((c: { value: string; icon: string }) => c.value === category);
    return found ? found.icon : '📍';
  }
}
