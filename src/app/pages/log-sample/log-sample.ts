import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

type DropItem = { _id: string; name: string };

@Component({
  selector: 'app-log-sample',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './log-sample.html',
  styleUrls: ['./log-sample.scss']
})
export class LogSampleComponent implements OnInit {
  step = 1;

  formData: any = {
    template: null as any,
    testList: null as DropItem | null,

    site: null as DropItem | null,
    plant: null as DropItem | null,
    unit: null as DropItem | null,
    point: null as DropItem | null,

    product: null as DropItem | null,
    grade: null as DropItem | null,
    stage: null as DropItem | null,

    group: null as DropItem | null,

    priority: 'Normal' as 'Low' | 'Normal' | 'High',
    samplingDate: '',
    receivedDate: '',
    sampleDescription: '',

    organization: null as DropItem | null,
    building: null as DropItem | null,
    room: null as DropItem | null,
    storageUnit: null as DropItem | null,
    shelf: null as DropItem | null,
    box: null as DropItem | null,
    position: null as DropItem | null,
  };

  readonly settingKeys = [
    'siteId','plantId','processUnitId','samplingPointId',
    'productId','gradeId','stageId','testListId',
    'organizationId','buildingId','roomId','storageUnitId','shelfId','boxId','positionId',
    'sampleNumber','samplingDate','receivedDate','sampledBy',
    'priority','sampleDescription','location',
    'groupName','groupId'
  ];

  readonly locationKeys = [
    'organizationId','buildingId','roomId','storageUnitId','shelfId','boxId','positionId'
  ];

  readonly labels: Record<string,string> = {
    siteId: 'Site', plantId: 'Plant', processUnitId: 'Process Unit', samplingPointId: 'Sampling Point',
    productId: 'Product', gradeId: 'Grade', stageId: 'Stage',
    testListId: 'Test Panel (Test List)',
    organizationId: 'Organization', buildingId: 'Building', roomId: 'Room',
    storageUnitId: 'Storage Unit', shelfId: 'Shelf', boxId: 'Box', positionId: 'Position',
    sampleNumber: 'Sample Number', samplingDate: 'Sampling Date/Time', receivedDate: 'Received Date/Time',
    sampledBy: 'Sampled By', priority: 'Priority', sampleDescription: 'Sample Description',
    location: 'Storage Location',
    groupName: 'Group',
    groupId:   'Group'
  };

  templates: DropItem[] = [];  testLists: DropItem[] = [];
  sites: DropItem[] = [];      plants: DropItem[] = [];
  units: DropItem[] = [];      points: DropItem[] = [];
  products: DropItem[] = [];   grades: DropItem[] = [];
  stages: DropItem[] = [];

  organizations: DropItem[] = []; buildings: DropItem[] = [];
  rooms: DropItem[] = [];        storageUnits: DropItem[] = [];
  shelves: DropItem[] = [];      boxes: DropItem[] = [];
  positions: DropItem[] = [];

  groups: DropItem[] = [
    { _id: 'g_chem',  name: 'Chemistry' },
    { _id: 'g_micro', name: 'Microbiology' },
    { _id: 'g_qc',    name: 'Quality Control' },
    { _id: 'g_admin', name: 'Administration' }
  ];

  requiredFields: string[] = [];
  optionalFields: string[] = [];
  anyLocationVisible = false;
  loadingTemplate = false;
  saving = false;

  constructor(private http: HttpClient, private router: Router) {}

  private readonly API = {
    sampleTemplates: 'http://localhost:3004/api/v1/sample-templates',
    testLists:       'http://localhost:3004/api/v1/test-lists',
    sites:           'http://localhost:3004/api/v1/sites',
    plants:          'http://localhost:3004/api/v1/plants',
    units:           'http://localhost:3004/api/v1/process-units',
    points:          'http://localhost:3004/api/v1/sampling-points',
    products:        'http://localhost:3004/api/v1/products',
    grades:          'http://localhost:3004/api/v1/grades',
    stages:          'http://localhost:3004/api/v1/stages',
    organizations:   'http://localhost:3004/api/v1/organizations',
    buildings:       'http://localhost:3004/api/v1/buildings',
    rooms:           'http://localhost:3004/api/v1/rooms',
    storageUnits:    'http://localhost:3004/api/v1/storage-units',
    shelves:         'http://localhost:3004/api/v1/shelves',
    boxes:           'http://localhost:3004/api/v1/boxes',
    positions:       'http://localhost:3004/api/v1/positions',
    samples:         'http://localhost:3005/api/v1/samples',
  };

  private get headers() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'X-Tenant-Key': localStorage.getItem('tenantKey') || 'default', 
        'Content-Type': 'application/json'
      })
    };
  }

  ngOnInit(): void { this.loadLookups(); }

  private pick(r: any) {
    return Array.isArray(r?.data) ? r.data :
           Array.isArray(r?.items) ? r.items :
           Array.isArray(r?.data?.items) ? r.data.items : [];
  }

  loadLookups() {
    this.http.get<any>(this.API.sampleTemplates, this.headers).subscribe(r => this.templates = this.pick(r));
    this.http.get<any>(this.API.testLists, this.headers).subscribe(r => this.testLists = this.pick(r));
    this.http.get<any>(this.API.sites, this.headers).subscribe(r => this.sites = this.pick(r));
    this.http.get<any>(this.API.plants, this.headers).subscribe(r => this.plants = this.pick(r));
    this.http.get<any>(this.API.units, this.headers).subscribe(r => this.units = this.pick(r));
    this.http.get<any>(this.API.points, this.headers).subscribe(r => this.points = this.pick(r));
    this.http.get<any>(this.API.products, this.headers).subscribe(r => this.products = this.pick(r));
    this.http.get<any>(this.API.grades, this.headers).subscribe(r => this.grades = this.pick(r));
    this.http.get<any>(this.API.stages, this.headers).subscribe(r => this.stages = this.pick(r));
    this.http.get<any>(this.API.organizations, this.headers).subscribe(r => this.organizations = this.pick(r));
    this.http.get<any>(this.API.buildings, this.headers).subscribe(r => this.buildings = this.pick(r));
    this.http.get<any>(this.API.rooms, this.headers).subscribe(r => this.rooms = this.pick(r));
    this.http.get<any>(this.API.storageUnits, this.headers).subscribe(r => this.storageUnits = this.pick(r));
    this.http.get<any>(this.API.shelves, this.headers).subscribe(r => this.shelves = this.pick(r));
    this.http.get<any>(this.API.boxes, this.headers).subscribe(r => this.boxes = this.pick(r));
    this.http.get<any>(this.API.positions, this.headers).subscribe(r => this.positions = this.pick(r));
  }

  /** تطبيع من شكل flat إلى template.settings */
  private normalizeSettingsFromTemplate(raw: any) {
    const s: Record<string, {visible?: boolean; required?: boolean}> = {};
    this.settingKeys.forEach((k) => {
      const v = raw?.[k];
      if (v && typeof v === 'object') {
        const visible = 'visible' in v ? !!v.visible : false;
        const required = 'required' in v ? !!v.required : false;
        if (visible || required) s[k] = { visible, required };
      }
    });
    return s;
  }

  onTemplateChange() {
    const t: any = this.formData.template;
    if (!t) return;

    if (!t.settings || !Object.keys(t.settings).length) {
      this.loadingTemplate = true;
      this.http.get<any>(`${this.API.sampleTemplates}/${t._id}`, this.headers).subscribe({
        next: (res) => {
          const full = res?.data || res;
          const normalized = full?.settings && Object.keys(full.settings).length
            ? full.settings
            : this.normalizeSettingsFromTemplate(full);
          this.formData.template = { ...t, settings: normalized };
          this.recomputeFields();
          this.loadingTemplate = false;
        },
        error: () => {
          const normalized = this.normalizeSettingsFromTemplate(t);
          this.formData.template = { ...t, settings: normalized };
          this.recomputeFields();
          this.loadingTemplate = false;
        }
      });
    } else {
      if (!Object.keys(t.settings).length) t.settings = this.normalizeSettingsFromTemplate(t);
      this.recomputeFields();
    }
  }

  private recomputeFields() {
    const s = (this.formData.template as any)?.settings || {};

    this.requiredFields = Object.keys(s).filter(k => !!s[k]?.visible && !!s[k]?.required);
    this.optionalFields = Object.keys(s).filter(k => !!s[k]?.visible && !s[k]?.required);

    this.anyLocationVisible = this.locationKeys.some(k => !!s[k]?.visible && !s[k]?.required);

    // Debug
    console.log('requiredFields:', this.requiredFields);
    console.log('optionalFields:', this.optionalFields);
    console.log('settings snapshot:', s);
  }

  getSetting(field: string) {
    const t: any = this.formData.template;
    return t?.settings?.[field] || { visible: false, required: false };
  }
  show(field: string) { return !!this.getSetting(field).visible; }
  req(field: string)  { return !!this.getSetting(field).required; }

  // مفاتيح الـ dropdown
  private LOOKUP_KEYS: Record<string, true> = {
    testListId: true, siteId: true, plantId: true, processUnitId: true, samplingPointId: true,
    productId: true, gradeId: true, stageId: true,
    organizationId: true, buildingId: true, roomId: true, storageUnitId: true, shelfId: true, boxId: true, positionId: true,
    groupName: true, 
    groupId:   true   
  };
  isLookup(field: string) { return !!this.LOOKUP_KEYS[field]; }

  getModelFor(field: string) {
    const map: any = {
      testListId: 'testList',
      siteId: 'site', plantId: 'plant', processUnitId: 'unit', samplingPointId: 'point',
      productId: 'product', gradeId: 'grade', stageId: 'stage',
      organizationId: 'organization', buildingId: 'building', roomId: 'room',
      storageUnitId: 'storageUnit', shelfId: 'shelf', boxId: 'box', positionId: 'position',
      samplingDate: 'samplingDate', receivedDate: 'receivedDate',
      priority: 'priority', sampleDescription: 'sampleDescription',
      groupName: 'group',
      groupId:   'group' 
    };
    return map[field] || field;
  }

  getLookupArray(field: string): DropItem[] {
    switch (field) {
      case 'testListId': return this.testLists;
      case 'siteId': return this.sites;
      case 'plantId': return this.plants;
      case 'processUnitId': return this.units;
      case 'samplingPointId': return this.points;
      case 'productId': return this.products;
      case 'gradeId': return this.grades;
      case 'stageId': return this.stages;
      case 'organizationId': return this.organizations;
      case 'buildingId': return this.buildings;
      case 'roomId': return this.rooms;
      case 'storageUnitId': return this.storageUnits;
      case 'shelfId': return this.shelves;
      case 'boxId': return this.boxes;
      case 'positionId': return this.positions;
      case 'groupName':
      case 'groupId':
        return this.groups;
      default: return [];
    }
  }

  private valueFor(field: string) {
    const mk = this.getModelFor(field);
    const v = this.formData[mk];
    if (v && typeof v === 'object') return (v as any)._id || null; 
    const s = (v === 0 || v === false) ? v : (v ?? '').toString().trim();
    return s ? s : null;
  }
  isValidRequired(): boolean {
    return this.requiredFields.every(k => !!this.valueFor(k));
  }
  canGoNextFromRequired(): boolean { return this.isValidRequired(); }

  // Utilities
  private isObjectId = (s?: string) => !!s && /^[0-9a-fA-F]{24}$/.test(s);
  private toId = (x: any) => x && x._id ? x._id : undefined;
  private toISO = (d: string) => d ? new Date(d).toISOString() : undefined;

  saveSample() {
    if (this.saving) return;
    if (!this.isValidRequired()) { alert('Please fill all required fields.'); return; }

    this.saving = true;

    const body: any = {
      sampleTemplateId: this.toId(this.formData.template),
      testListId:       this.toId(this.formData.testList),
      productId:        this.toId(this.formData.product),

      siteId:           this.toId(this.formData.site),
      plantId:          this.toId(this.formData.plant),
      processUnitId:    this.toId(this.formData.unit),
      samplingPointId:  this.toId(this.formData.point),

      gradeId:          this.toId(this.formData.grade),
      stageId:          this.toId(this.formData.stage),

      groupName:        this.formData.group?.name || undefined,

      priority:         this.formData.priority || undefined,
      samplingDate:     this.toISO(this.formData.samplingDate),
      receivedDate:     this.toISO(this.formData.receivedDate),
      sampleDescription:this.formData.sampleDescription || undefined
    };

    const gid = this.toId(this.formData.group);
    if (this.isObjectId(gid)) body.groupId = gid;

    const location: any = {
      organizationId: this.toId(this.formData.organization),
      buildingId:     this.toId(this.formData.building),
      roomId:         this.toId(this.formData.room),
      storageUnitId:  this.toId(this.formData.storageUnit),
      shelfId:        this.toId(this.formData.shelf),
      boxId:          this.toId(this.formData.box),
      positionId:     this.toId(this.formData.position),
    };
    if (Object.values(location).some(Boolean)) body.location = location;

    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);

    this.http.post<any>(this.API.samples, body, this.headers).subscribe({
      next: () => {
        this.saving = false;
        alert('Sample saved successfully');
        this.router.navigate(['/home/samples'], { queryParams: { refresh: Date.now() } });
      },
      error: (err) => {
        this.saving = false;
        console.error('Error saving sample:', err);
        alert(err?.error?.error?.message ?? 'Failed to save sample');
      }
    });
  }
}
