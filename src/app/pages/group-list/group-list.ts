import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

type Id = string;

interface Group {
  _id: Id;
  name: string;
  code?: string;
  description?: string;
}

interface ListItem {
  _id: Id;
  groupId: Id | Group;
  name: string;
  code: string;
  description?: string;
  active?: boolean;
  createdAt?: string;
}

interface ListOption {
  _id: Id;
  listId: Id | { _id: Id; name: string; code: string };
  code: string;
  value: string;
  label: string;
  sortOrder?: number;
  active?: boolean;
}

/** APIs */
const API_BASE = 'http://localhost:3004/api/v1';
const IDENTITY_BASE = 'http://localhost:3001/api/v1';

function buildHeaders(): { headers: HttpHeaders } {
  const token = localStorage.getItem('token') || '';
  const tenant = localStorage.getItem('tenantKey') || 'ibnouf_lab_7_testing';
  return {
    headers: new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'X-Tenant-Code': tenant,
      'Content-Type': 'application/json',
    }),
  };
}

function normalizeCode(v: string | undefined | null): string {
  const s = (v ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return s;
}

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './group-list.html',
  styleUrls: ['./group-list.scss'],
})
export class GroupList {
  constructor(private http: HttpClient) {
    this.fetchGroups();  
    this.fetchLists();
    this.fetchOptions();
  }

  activeTab = signal<'lists' | 'options'>('lists');
  setTab(tab: 'lists' | 'options') { this.activeTab.set(tab); }

  mode = signal<'list' | 'option' | null>(null);
  showForm = computed(() => this.mode() !== null);
  activeTitle = computed(() =>
    this.mode() === 'list'     ? 'Add List'
    : this.mode() === 'option' ? 'Add List Option'
    : 'Value Lists'
  );

  saving = false;
  onAdd() {
    if (this.activeTab() === 'lists') this.openAddList();
    else this.openAddOption();
  }
  onCancel() {
    this.mode.set(null);
    this.newList.set({ name: '', code: '', description: '', active: true });
    this.newListGroupId.set(null);
    this.newOption.set({ code: '', value: '', label: '', sortOrder: 1, active: true });
    this.newOptionListId.set(null);
  }
  onSave() {
    if (this.formInvalid()) return;
    if (this.mode() === 'list') this.addList();
    else if (this.mode() === 'option') this.addOption();
  }

  addingDisabled = computed(() => this.activeTab() === 'options' && !this.lists().length);

  /** ===== State ===== */
  groups = signal<Group[]>([]);
  lists  = signal<ListItem[]>([]);
  options = signal<ListOption[]>([]);
  selectedListId = signal<Id | null>(null);

  /** Search */
  searchTerm: string = '';

  /** ===== Derived ===== */
  filteredLists = computed(() => {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.lists();
    return this.lists().filter(l =>
      [l.code, l.name, l.description || ''].some(v => (v || '').toLowerCase().includes(q))
    );
  });

  optionsForSelectedList = computed(() => {
    const lid = this.selectedListId();
    const q = this.searchTerm.trim().toLowerCase();
    return this.options()
      .filter(o => {
        const oid = typeof o.listId === 'string' ? o.listId : o.listId?._id;
        return lid ? oid === lid : false;
      })
      .filter(o => [o.code, o.value, o.label].some(v => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  });

  listNameById = computed(() => {
    const map = new Map<string, string>();
    for (const l of this.lists()) map.set(l._id, l.name);
    return map;
  });
  getListName(id: string | null): string {
    if (!id) return '—';
    return this.listNameById().get(id) || '—';
  }

  formInvalid = computed(() => {
    if (this.mode() === 'list') {
      const f = this.newList(); const gid = this.newListGroupId();
      return !gid || !(f.name || '').trim() || !normalizeCode(f.code as string);
    }
    if (this.mode() === 'option') {
      const f = this.newOption(); const lid = this.newOptionListId();
      return !lid || !normalizeCode(f.code as string) || !normalizeCode(f.value as string) || !(f.label || '').trim();
    }
    return true;
  });

  /** ===== API ===== */
  fetchGroups() {
    this.http.get<{ data: Group[] }>(`${IDENTITY_BASE}/groups`, buildHeaders())
      .subscribe({
        next: (res) => {
          const arr = Array.isArray(res?.data) ? res.data : [];
          this.groups.set(arr.map(g => ({ _id: String(g._id), name: g.name, code: g.code, description: g.description })));
          if (!this.newListGroupId()) {
            const first = this.groups()[0]?._id || null;
            this.newListGroupId.set(first);
          }
        },
        error: (e) => {
          console.error('GET /groups failed', e);
          this.groups.set([]);
        }
      });
  }

  fetchLists() {
    this.http.get<{ data: ListItem[] }>(`${API_BASE}/lists`, buildHeaders())
      .subscribe({
        next: (res) => {
          const data = res?.data || [];
          this.lists.set(data);
          if (!this.selectedListId() && data.length) this.selectedListId.set(data[0]._id);
        },
        error: () => alert('Eroor(Lists).'),
      });
  }

  fetchOptions() {
    this.http.get<{ data: ListOption[] }>(`${API_BASE}/list-entries`, buildHeaders())
      .subscribe({
        next: (res) => this.options.set(res?.data || []),
        error: () => alert('Error(List Options).'),
      });
  }

  onListRowClick(id: Id) {
    this.selectedListId.set(id);
    this.setTab('options');
  }

  newList = signal<Partial<ListItem>>({ name: '', code: '', description: '', active: true });
  newListGroupId = signal<Id | null>(null);

  openAddList() {
    const gid = this.newListGroupId() || this.groups()[0]?._id || null;
    this.newListGroupId.set(gid);
    this.mode.set('list');
  }

  setNewListName(v: string) { this.newList.update(x => ({ ...x, name: v })); }
  setNewListCode(v: string) { this.newList.update(x => ({ ...x, code: normalizeCode(v) })); }
  setNewListDesc(v: string) { this.newList.update(x => ({ ...x, description: v })); }
  setNewListGroup(id: Id)   { this.newListGroupId.set(id); }

  addList() {
    this.saving = true;
    const f = this.newList(); const gid = this.newListGroupId();
    const payload = {
      groupId: gid,
      name: (f.name || '').trim(),
      code: normalizeCode(f.code as string),
      description: (f.description || '').trim(),
      active: f.active ?? true,
    };
    this.http.post<{ data: ListItem }>(`${API_BASE}/lists`, payload, buildHeaders())
      .subscribe({
        next: (res) => {
          const created = res?.data;
          if (created) {
            this.lists.update(arr => [created, ...arr]);
            this.selectedListId.set(created._id);
          }
          this.onCancel();
          this.saving = false;
        },
        error: (err) => { this.saving = false; alert(err?.error?.error?.message || 'Error List'); }
      });
  }

  newOption = signal<Partial<ListOption>>({ code: '', value: '', label: '', sortOrder: 1, active: true });
  newOptionListId = signal<Id | null>(null);

  openAddOption() {
    const lid = this.selectedListId() || this.lists()[0]?._id || null;
    this.newOptionListId.set(lid);
    this.mode.set('option');
  }
  setNewOptCode(v: string)  { this.newOption.update(x => ({ ...x, code: normalizeCode(v) })); }
  setNewOptValue(v: string) { this.newOption.update(x => ({ ...x, value: normalizeCode(v) })); }
  setNewOptLabel(v: string) { this.newOption.update(x => ({ ...x, label: v })); }
  setNewOptSort(v: number | string) {
    const n = typeof v === 'string' ? Number(v) : v;
    this.newOption.update(x => ({ ...x, sortOrder: Number.isFinite(n) ? Number(n) : 0 }));
  }
  setNewOptionList(id: Id) { this.newOptionListId.set(id); }

  addOption() {
    this.saving = true;
    const f = this.newOption(); const lid = this.newOptionListId();
    const payload = {
      listId: lid,
      code: normalizeCode(f.code as string),
      value: normalizeCode(f.value as string),
      label: (f.label || '').trim(),
      sortOrder: Number(f.sortOrder ?? 1),
      active: f.active ?? true,
    };
    this.http.post<{ data: ListOption }>(`${API_BASE}/list-entries`, payload, buildHeaders())
      .subscribe({
        next: (res) => {
          const created = res?.data;
          if (created) this.options.update(arr => [created as ListOption, ...arr]);
          this.onCancel();
          this.saving = false;
        },
        error: (err) => { this.saving = false; alert(err?.error?.error?.message || 'Error Option'); }
      });
  }
}
