import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

type RoleModel = {
  _id: string;
  name: string;
  description?: string;
  active?: boolean;
  createdAt?: string;
};

type RoleFunctionModel = {
  _id: string;
  roleId?: string;
  functionCode: string;
  createdAt?: string;
  updatedAt?: string;
};

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './role.html',
  styleUrls: ['./role.scss']
})
export class Role implements OnInit {

  showAddForm = false;
  showEditForm = false;

  roles: RoleModel[] = [];
  loading = false;

  newRole: { name: string; description: string; active: boolean } = {
    name: '',
    description: '',
    active: true
  };

  // تعديل
  editingRoleId: string | null = null;
  editForm: { name: string; description: string; active: boolean } = {
    name: '',
    description: '',
    active: true
  };

  saving = false;

  private readonly urlBase = 'http://localhost:3001/api/v1';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  private get headers() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json'
      })
    };
  }

  /* ========== GET (roles list) ========== */
  loadRoles(): void {
    this.loading = true;
    this.http.get<any>(`${this.urlBase}/roles`, this.headers).subscribe({
      next: (res) => {
        this.roles = (res?.data || []).map((r: any): RoleModel => ({
          _id: r._id,
          name: r.name,
          description: r.description,
          active: r.active ?? false,
          createdAt: r.createdAt
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.roles = [];
      }
    });
  }

  fmtDate(d?: string): string {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  /* ========== ROW ACTIONS ========== */
  toggleActive(role: RoleModel): void {
    const prev = !!role.active;
    role.active = !prev;

    this.http.patch<any>(
      `${this.urlBase}/roles/${role._id}`,
      { active: role.active },
      this.headers
    ).subscribe({
      next: () => {},
      error: () => {
        console.info('Toggle failed on server; kept UI state.');
      }
    });
  }

  delete(role: RoleModel): void {
    if (!confirm(`Delete role "${role.name}"?`)) return;

    this.http.delete<any>(`${this.urlBase}/roles/${role._id}`, this.headers).subscribe({
      next: () => {
        this.roles = this.roles.filter(r => r._id !== role._id);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Cannot delete this role (maybe assigned to users).';
        alert(msg);
      }
    });
  }

  openDetails(role: RoleModel): void {
    Swal.fire({
      title: 'Loading…',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.http.get<any>(`${this.urlBase}/roles/${role._id}/functions`, this.headers)
      .subscribe({
        next: (res) => {
          const functions: RoleFunctionModel[] = (res?.data || []).map((f: any) => ({
            _id: f._id,
            roleId: f.roleId,
            functionCode: f.functionCode,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt
          }));

          const rows = functions.length
            ? functions.map((f, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><code>${f.functionCode}</code></td>
                <td>${this.fmtDate(f.createdAt)}</td>
              </tr>
            `).join('')
            : `<tr><td colspan="3" class="muted">No functions assigned.</td></tr>`;

          Swal.fire({
            html: `
<style>
  .role-swal .swal2-html-container{margin:0;padding:0}
  .role-card{font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;color:#111827}
  .role-title{font-size:20px;font-weight:700;text-align:center;margin:6px 0 2px}
  .role-sub{font-size:12.5px;color:#6b7280;text-align:center;margin-bottom:16px}

  .kv {
    display:grid; grid-template-columns:140px 1fr;
    gap:10px 16px; padding:14px 6px 2px;
    border-top:1px solid #eef0f4; border-bottom:1px solid #eef0f4;
    margin-bottom:14px;
  }
 .kv > div {
    font-size: 13px;
    line-height: 1.4;
    color: #111827;
  }
  .kv code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12.5px;
    background: #f1f5f9;
    color: #0f172a;
    padding: 2px 8px;
    border-radius: 6px;
  }

  .kv label{font-size:12.5px;color:#6b7280}
  .kv .badge{
    padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;
    display:inline-block
  }
  .badge--active{background:#E7F8EF;color:#0B7A45;border:1px solid #BDEBD6}
  .badge--inactive{background:#FDE8E8;color:#B42318;border:1px solid #F7C5C5}

  .section-title{font-weight:700;text-align:center;margin:8px 0 8px}

  .rtable{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0 8px}
  .rtable thead th,.rtable tbody td{padding:12px 16px;text-align:left;vertical-align:middle}
  .rtable thead th{font-size:12.5px;color:#6b7280;font-weight:600}
  .rtable tbody tr{background:#fff;border:1px solid #eef0f4;border-radius:10px;overflow:hidden}
  .rtable tbody tr:nth-child(odd){background:#fafbfc}
  .rtable thead th:first-child,.rtable tbody td:first-child{width:56px;text-align:center;color:#6b7280}
  .rtable tbody td:nth-child(2) code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px}
  .rtable thead th:last-child,.rtable tbody td:last-child{width:220px;white-space:nowrap}
  .muted{color:#9ca3af;text-align:center;padding:16px}

  .func-table td:nth-child(3) {  
  font-size: 12.5px;    
  line-height: 1.35;
  color: #475569;     
  white-space: nowrap;    
}

.role-swal .kv{
  display:grid;
  grid-template-columns:140px 1fr;
  gap:10px 16px;
  padding:14px 8px 6px;
  border-top:1px solid #eef0f4;
  border-bottom:1px solid #eef0f4;
  margin-bottom:14px;
}

.role-swal .kv > div:nth-child(2n){
  text-align:center;
  justify-self:center;
}

.role-swal .kv > div:nth-child(4), 
.role-swal .kv > div:nth-child(6)  
{
  font-size:12.5px;
  line-height:1.35;
  color:#475569;
}

.role-swal .kv .badge{
  display:inline-block;
  margin:0 auto;
}

.role-swal .rtable{
  width:100%;
  table-layout:fixed;
  border-collapse:separate;
  border-spacing:0 8px;
}

.role-swal .rtable thead th,
.role-swal .rtable tbody td{
  padding:12px 16px;
  text-align:left;
  vertical-align:middle;
}

.role-swal .rtable thead th:first-child,
.role-swal .rtable tbody td:first-child{
  width:56px;
  text-align:center;
  color:#6b7280;
}

.role-swal .rtable thead th:last-child,
.role-swal .rtable tbody td:last-child{
  width:220px;
  white-space:nowrap;
}

.role-swal .rtable tbody td:last-child{
  font-size:12.5px;  
  line-height:1.35;
  color:#475569;
  text-align:right;   
}

/* ====== KV (Status / Created / Role ID) ====== */

.role-swal .kv{
  display:grid;
  grid-template-columns:140px 1fr;
  gap:10px 16px;
  padding:14px 8px 6px;
  border-top:1px solid #eef0f4;
  border-bottom:1px solid #eef0f4;
  margin-bottom:14px;
}

.role-swal .kv > div:nth-child(2n-1){
  text-align:left;
}

.role-swal .kv > div:nth-child(2n){
  text-align:right;
  justify-self:end;      
}

.role-swal .kv .badge{
  margin-left:auto;
  margin-right:0;
}
.role-swal .kv code{
  margin-left:auto;
  margin-right:0;
  font-size:12.5px;
  background:#f1f5f9;
  color:#0f172a;
  padding:2px 8px;
  border-radius:6px;
}

/* ======Functions ====== */

.role-swal .rtable thead th:last-child{
  text-align:right;        
  width:220px;        
}

.role-swal .rtable tbody td:last-child{
  text-align:right;
  font-size:12.5px;
  line-height:1.35;
  color:#475569;
  white-space:nowrap;
  width:220px;
}


</style>

<div class="role-card">
  <div class="role-title">${role.name}</div>
  <div class="role-sub">${role.description || ''}</div>

  <div class="kv">
    <label>Status</label>
    <div>
      <span class="badge ${role.active ? 'badge--active' : 'badge--inactive'}">
        ${role.active ? 'Active' : 'Inactive'}
      </span>
    </div>

    <label>Created</label>
    <div>${this.fmtDate(role.createdAt)}</div>

    <label>Role ID</label>
    <div><code>${role._id}</code></div>
  </div>

  <div class="section-title">Functions</div>

  <table class="rtable">
    <colgroup>
      <col style="width:56px" />
      <col style="width:auto" />
      <col style="width:220px" />
    </colgroup>
    <thead>
      <tr>
        <th>#</th>
        <th>Function Code</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</div>
            `,
            width: 720,        
            padding: 0,
            showConfirmButton: false,
            showCloseButton: true,
            customClass: { popup: 'role-swal' }
          });
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed to load',
            text: err?.error?.message || 'Could not load role details.',
            confirmButtonText: 'OK'
          });
        }
      });
  }

  /* ========== ADD (POST) ========== */
  openAdd(): void {
    this.showEditForm = false;
    this.showAddForm = true;
    this.newRole = { name: '', description: '', active: true };
  }
  cancelAdd(): void { this.showAddForm = false; }

  saveNewRole(): void {
    if (!this.newRole.name.trim()) { alert('Role name is required'); return; }
    this.saving = true;
    const body = {
      name: this.newRole.name.trim(),
      description: this.newRole.description || '',
      active: !!this.newRole.active
    };
    this.http.post<any>(`${this.urlBase}/roles`, body, this.headers).subscribe({
      next: (res) => {
        const created: RoleModel = res?.data || {
          _id: crypto.randomUUID?.() || String(Date.now()),
          name: body.name,
          description: body.description,
          active: body.active,
          createdAt: new Date().toISOString()
        };
        this.roles = [created, ...this.roles];
        this.showAddForm = false;
        this.saving = false;
      },
      error: (err) => { this.saving = false; alert(err?.error?.message || 'Failed to create role'); }
    });
  }

  /* ========== EDIT (PUT) ========== */
  openEdit(role: RoleModel): void {
    this.showAddForm = false;
    this.showEditForm = true;

    this.editingRoleId = role._id;
    this.editForm = {
      name: role.name,
      description: role.description || '',
      active: !!role.active
    };
  }
  cancelEdit(): void { this.showEditForm = false; this.editingRoleId = null; }

  saveEditRole(): void {
    if (!this.editingRoleId) return;
    const name = this.editForm.name?.trim();
    if (!name) { alert('Role name is required'); return; }

    this.saving = true;
    const body: any = { name, description: this.editForm.description || '' };

    this.http.put<any>(`${this.urlBase}/roles/${this.editingRoleId}`, body, this.headers).subscribe({
      next: () => {
        this.roles = this.roles.map(r => r._id === this.editingRoleId ? { ...r, ...body } : r);
        this.saving = false;
        this.showEditForm = false;
        this.editingRoleId = null;
      },
      error: (err) => {
        this.saving = false;
        alert(err?.error?.details || err?.error?.message || err?.statusText || 'Failed to update role');
        console.error('PUT /roles/:id failed:', err);
      }
    });
  }
}
