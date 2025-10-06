import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

type Id = string;

interface ListItem {
  _id: Id;
  groupId: Id | { _id: Id; name: string; code?: string; description?: string };
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

/** API */
const API_BASE = 'http://localhost:3004/api/v1';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

/** "test value" -> "TEST_VALUE" */
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
    this.fetchLists();
    this.fetchOptions();
  }

  /** ===== Tabs ===== */
  activeTab = signal<'lists' | 'options'>('lists');
  setTab(tab: 'lists' | 'options') { this.activeTab.set(tab); }

  mode = signal<'list' | 'option' | null>(null);
  showForm = computed(() => this.mode() !== null);
  activeTitle = computed(() =>
    this.mode() === 'list'   ? 'Add List'
    : this.mode() === 'option' ? 'Add List Option'
    : 'Value Lists'
  );

  /** Header actions */
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
  lists = signal<ListItem[]>([]);
  options = signal<ListOption[]>([]);
  selectedListId = signal<Id | null>(null);

  /** Search */
  searchTerm: string = '';

  /** ===== Derived ===== */
  groupsFromLists = computed(() => {
    const map = new Map<Id, { _id: Id; name: string; code?: string }>();
    for (const l of this.lists()) {
      const g = typeof l.groupId === 'string'
        ? { _id: l.groupId, name: l.groupId, code: undefined }
        : (l.groupId as { _id: Id; name: string; code?: string } | null);
      if (g && !map.has(g._id)) map.set(g._id, { _id: g._id, name: g.name, code: g.code });
    }
    return Array.from(map.values());
  });

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
  fetchLists() {
    this.http.get<{ data: ListItem[] }>(`${API_BASE}/lists`, { headers: authHeaders() })
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
    this.http.get<{ data: ListOption[] }>(`${API_BASE}/list-entries`, { headers: authHeaders() })
      .subscribe({
        next: (res) => this.options.set(res?.data || []),
        error: () => alert('Error(List Options).'),
      });
  }

  /** ===== Table interactions ===== */
  onListRowClick(id: Id) {
    this.selectedListId.set(id);
    this.setTab('options');
  }

  /** ====== Add List (Page form) ====== */
  newList = signal<Partial<ListItem>>({ name: '', code: '', description: '', active: true });
  newListGroupId = signal<Id | null>(null);

  openAddList() {
    const current = this.selectedListId();
    const currentList = this.lists().find(l => l._id === current);
    const gid = currentList
      ? (typeof currentList.groupId === 'string' ? currentList.groupId : currentList.groupId?._id)
      : (this.groupsFromLists()[0]?._id || null);
    this.newListGroupId.set(gid ?? null);
    this.mode.set('list');                 // << يظهر فورم الصفحة ويختفي الجدول
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
    this.http.post<{ data: ListItem }>(`${API_BASE}/lists`, payload, { headers: authHeaders() })
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

  /** ====== Add Option (Page form) ====== */
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
    this.http.post<{ data: ListOption }>(`${API_BASE}/list-entries`, payload, { headers: authHeaders() })
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
