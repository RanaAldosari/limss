import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-samples',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './samples.html',
  styleUrls: ['./samples.scss']
})
export class SamplesComponent implements OnInit {
  samples: any[] = [];
  searchTerm = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  private get headers() {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json'
    });
  }

  ngOnInit(): void {
    this.loadSamples();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.loadSamples());
    this.route.queryParams.subscribe(() => this.loadSamples());
  }

  loadSamples() {
    this.http.get<any>('http://localhost:3005/api/v1/samples', { headers: this.headers })
      .subscribe({
        next: (res) => {
          const list = Array.isArray(res?.data) ? res.data : [];
          this.samples = list.map((item: any) => ({
            _id: item._id,
            sampleNumber: item.sampleNumber,
            priority: item.priority ?? '-',
            groupName: item.groupName ?? '-',
            rawStatus: item.status,
            displayStatus: this.mapStatus(item.status),
            testDone: item.testDone ?? 0,
            testTotal: item.testTotal ?? 0,
            createdAt: new Date(item.createdAt).toLocaleDateString(),
          }));
        },
        error: (err) => console.error('Error fetching samples:', err)
      });
  }

  get filteredSamples() {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.samples;

    return this.samples.filter(s => {
      return (
        s.sampleNumber?.toLowerCase().includes(q) ||
        s.priority?.toLowerCase().includes(q) ||
        s.groupName?.toLowerCase().includes(q) ||
        s.displayStatus?.toLowerCase().includes(q) ||
        (typeof s.createdAt === 'string' && s.createdAt.toLowerCase().includes(q)) ||
        // بحث داخل أرقام التقدم أيضاً
        `${s.testDone}/${s.testTotal}`.toLowerCase().includes(q)
      );
    });
  }

  mapStatus(status: string): string {
    switch (status) {
      case 'U': return 'Unreceived';
      case 'R': return 'Rejected';
      case 'C': return 'Completed';
      case 'P': return 'In Progress';
      case 'Rec': return 'Received';
      default: return status || '-';
    }
  }

  getProgress(s: any) { return !s.testTotal ? 0 : (s.testDone / s.testTotal) * 100; }

  viewSample(sample: any) { this.router.navigate(['/home/samples', sample._id]); }

  goToLogSample() { this.router.navigate(['/home/samples/new']); }
}
