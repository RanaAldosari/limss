import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sample-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './sample-detail.html',
  styleUrls: ['./sample-detail.scss']
})
export class SampleDetailComponent implements OnInit {
  sample: any;
  tests: any[] = [];

  // Receive modal
  showReceiveModal = false;
  receiveComment = '';
  receiving = false;

  private readonly API = {
    samples:        'http://localhost:3005/api/v1/samples',
    sampleTemplates:'http://localhost:3004/api/v1/sample-templates',
    testLists:      'http://localhost:3004/api/v1/test-lists',
    sites:          'http://localhost:3004/api/v1/sites',
    plants:         'http://localhost:3004/api/v1/plants',
    units:          'http://localhost:3004/api/v1/process-units',
    points:         'http://localhost:3004/api/v1/sampling-points',
    products:       'http://localhost:3004/api/v1/products',
    grades:         'http://localhost:3004/api/v1/grades',
    stages:         'http://localhost:3004/api/v1/stages',
    organizations:  'http://localhost:3004/api/v1/organizations',
    buildings:      'http://localhost:3004/api/v1/buildings',
    rooms:          'http://localhost:3004/api/v1/rooms',
    storageUnits:   'http://localhost:3004/api/v1/storage-units',
    shelves:        'http://localhost:3004/api/v1/shelves',
    boxes:          'http://localhost:3004/api/v1/boxes',
    positions:      'http://localhost:3004/api/v1/positions',
  };

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      this.loadSample(id);
    });
  }

  // ---------- HTTP helpers ----------
  private getHeaders() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json'
      })
    };
  }
  private pickData = (r: any) => r?.data ?? r ?? null;

  private safeGet(url: string | null) {
    if (!url) return of(null);
    return this.http.get<any>(url, this.getHeaders())
      .pipe(map(this.pickData), catchError(() => of(null)));
  }

  private loadSample(id: string | null) {
    if (!id) return;
    this.http.get<any>(`${this.API.samples}/${id}`, this.getHeaders()).subscribe({
      next: (res) => {
        const s = res?.data;
        if (!s) { this.sample = null; this.tests = []; return; }
        this.hydrateSample(s);
      },
      error: () => { this.sample = null; this.tests = []; }
    });
  }

  private hydrateSample(s: any) {
    const loc = s.location || {};

    forkJoin({
      sampleTemplate: this.safeGet(s.sampleTemplateId ? `${this.API.sampleTemplates}/${s.sampleTemplateId}` : null),
      testList:       this.safeGet(s.testListId       ? `${this.API.testLists}/${s.testListId}`       : null),
      product:        this.safeGet(s.productId        ? `${this.API.products}/${s.productId}`         : null),
      grade:          this.safeGet(s.gradeId          ? `${this.API.grades}/${s.gradeId}`             : null),
      stage:          this.safeGet(s.stageId          ? `${this.API.stages}/${s.stageId}`             : null),
      site:           this.safeGet(s.siteId           ? `${this.API.sites}/${s.siteId}`               : null),
      plant:          this.safeGet(s.plantId          ? `${this.API.plants}/${s.plantId}`             : null),
      unit:           this.safeGet(s.processUnitId    ? `${this.API.units}/${s.processUnitId}`        : null),
      point:          this.safeGet(s.samplingPointId  ? `${this.API.points}/${s.samplingPointId}`     : null),

      org:            this.safeGet(loc.organizationId ? `${this.API.organizations}/${loc.organizationId}` : null),
      building:       this.safeGet(loc.buildingId     ? `${this.API.buildings}/${loc.buildingId}`         : null),
      room:           this.safeGet(loc.roomId         ? `${this.API.rooms}/${loc.roomId}`                 : null),
      storageUnit:    this.safeGet(loc.storageUnitId  ? `${this.API.storageUnits}/${loc.storageUnitId}`   : null),
      shelf:          this.safeGet(loc.shelfId        ? `${this.API.shelves}/${loc.shelfId}`             : null),
      box:            this.safeGet(loc.boxId          ? `${this.API.boxes}/${loc.boxId}`                 : null),
      position:       this.safeGet(loc.positionId     ? `${this.API.positions}/${loc.positionId}`        : null),
    }).subscribe(refs => {
      this.sample = {
        ...s,
        sampleTemplateId: refs.sampleTemplate || s.sampleTemplateId,
        testListId:       refs.testList       || s.testListId,
        productId:        refs.product        || s.productId,
        gradeId:          refs.grade          || s.gradeId,
        stageId:          refs.stage          || s.stageId,
        siteId:           refs.site           || s.siteId,
        plantId:          refs.plant          || s.plantId,
        processUnitId:    refs.unit           || s.processUnitId,
        samplingPointId:  refs.point          || s.samplingPointId,
        location: {
          ...s.location,
          organizationId: refs.org        || loc.organizationId,
          buildingId:     refs.building   || loc.buildingId,
          roomId:         refs.room       || loc.roomId,
          storageUnitId:  refs.storageUnit|| loc.storageUnitId,
          shelfId:        refs.shelf      || loc.shelfId,
          boxId:          refs.box        || loc.boxId,
          positionId:     refs.position   || loc.positionId,
        }
      };

      this.tests = this.sample?.testListId ? [
        { ...(this.sample.testListId as any), status: (this.sample.status || 'Pending') }
      ] : [];
    });
  }

  // ---------- Receive ----------
  get isReceived(): boolean {
    const s = (this.sample?.status || '').toString().toUpperCase();
    return !!this.sample?.receivedDate || ['RCV', 'RECEIVED', 'AUTHORIZED'].includes(s);
  }
  get canReceive(): boolean { return !!this.sample && !this.isReceived; }

  openReceive() {
    if (!this.canReceive) { alert('This sample is already received.'); return; }
    this.showReceiveModal = true;
  }
  closeReceive() { if (!this.receiving) this.showReceiveModal = false; }

  private extractErrMsg(err: any): string {
    return err?.error?.error?.message || err?.error?.message || err?.message || 'Failed to receive sample';
  }

  private applyReceivePatch(p?: any) {
    const newStatus = (p?.status || 'RCV').toString().toUpperCase();
    const newReceivedDate = p?.receivedDate || new Date().toISOString();

    this.sample = { ...this.sample, status: newStatus, receivedDate: newReceivedDate };
    this.tests = (this.tests || []).map(t => ({ ...t, status: newStatus }));
  }

  confirmReceive() {
    if (!this.sample?._id || this.receiving) return;
    this.receiving = true;

    const url = `${this.API.samples}/${this.sample._id}/receive`;
    const body: any = this.receiveComment.trim() ? { comment: this.receiveComment.trim() } : {};

    this.http.post<any>(url, body, this.getHeaders()).subscribe({
      next: (res) => {
        this.applyReceivePatch(res?.data);
        this.receiving = false;
        this.showReceiveModal = false;
        this.receiveComment = '';

        this.router.navigate(['/tests'], {
          queryParams: {
            sampleId: this.sample?._id,
            sampleNumber: this.sample?.sampleNumber
          }
        });

        alert('Sample received successfully.');
      },
      error: (err) => {
        this.receiving = false;
        alert(this.extractErrMsg(err));
      }
    });
  }

  statusClass(s?: string): string {
    if (!s) return 'pending';
    const norm = s.toString().trim().toLowerCase();
    if (norm === 'rcv') return 'received';
    return norm.replace(/\s+/g, '-');
  }

  onPrint()    { window.print(); }
  onAuthorize(){ alert('Sample authorized'); }
  onReject()   { alert('Sample rejected'); }
  onCancel()   { alert('Sample canceled'); }
  onRestore()  { alert('Sample restored'); }
}
