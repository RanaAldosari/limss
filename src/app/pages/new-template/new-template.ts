// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { TemplatesService } from '../../services/templates';

// @Component({
//   selector: 'app-new-template',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './new-template.html',
//   styleUrls: ['./new-template.scss']
// })
// export class NewTemplate implements OnInit {
//   saving = false;

//   // مفاتيح “مطلوبة دائمًا” (مقفلة): لا يمكن إخفاؤها ولا جعلها غير مطلوبة
//   private readonly alwaysRequiredKeys = new Set<string>(['testListId']);

//   template: any = {
//     name: '',
//     code: '',
//     description: '',
//     active: false,
//     settings: {
//       siteId:           { visible: true,  required: false },
//       plantId:          { visible: true,  required: false },
//       processUnitId:    { visible: true,  required: true  },
//       samplingPointId:  { visible: true,  required: true  },
//       productId:        { visible: true,  required: true  },
//       gradeId:          { visible: true,  required: false },
//       stageId:          { visible: true,  required: false },

//       // Test Panel (Test List) — مقفلة: ظاهرة + مطلوبة دائمًا
//       testListId:       { visible: true,  required: true  },

//       organizationId:   { visible: false, required: false },
//       buildingId:       { visible: false, required: false },
//       roomId:           { visible: false, required: false },
//       storageUnitId:    { visible: false, required: false },
//       shelfId:          { visible: false, required: false },
//       boxId:            { visible: false, required: false },
//       positionId:       { visible: false, required: false },

//       sampleNumber:     { visible: true,  required: true  },
//       samplingDate:     { visible: true,  required: false },
//       receivedDate:     { visible: true,  required: false },
//       sampledBy:        { visible: true,  required: false },
//       priority:         { visible: true,  required: false },
//       sampleDescription:{ visible: true,  required: false },
//       location:         { visible: true,  required: false },
//       groupName:        { visible: true,  required: false }
//     }
//   };

//   /** جميع المفاتيح المعروضة */
//   settingKeys: string[] = [
//     'siteId','plantId','processUnitId','samplingPointId',
//     'productId','gradeId','stageId','testListId',
//     'organizationId','buildingId','roomId','storageUnitId','shelfId','boxId','positionId',
//     'sampleNumber','samplingDate','receivedDate','sampledBy',
//     'priority','sampleDescription','location','groupName'
//   ];

//   /** تسميات ودّية للواجهة */
//   labels: Record<string, string> = {
//     siteId: 'Site',
//     plantId: 'Plant',
//     processUnitId: 'Process Unit',
//     samplingPointId: 'Sampling Point',
//     productId: 'Product',
//     gradeId: 'Grade',
//     stageId: 'Stage',
//     testListId: 'Test Panel (Test List)',
//     organizationId: 'Organization',
//     buildingId: 'Building',
//     roomId: 'Room',
//     storageUnitId: 'Storage Unit',
//     shelfId: 'Shelf',
//     boxId: 'Box',
//     positionId: 'Position',
//     sampleNumber: 'Sample Number',
//     samplingDate: 'Sampling Date/Time',
//     receivedDate: 'Received Date/Time',
//     sampledBy: 'Sampled By',
//     priority: 'Priority',
//     sampleDescription: 'Sample Description',
//     location: 'Storage Location',
//     groupName: 'Group'
//   };

//   constructor(
//     private templatesService: TemplatesService,
//     private router: Router
//   ) {}

//   ngOnInit() {
//     this.ensureDefaults();
//     this.enforceAlwaysRequired(); // فرض القاعدة قبل أي تحميل

//     // لو تجيبين إعدادات من API
//     this.templatesService.getTemplates().subscribe((res: any) => {
//       const templateFromApi = res?.data?.[0];
//       if (!templateFromApi) return;

//       this.settingKeys.forEach((key) => {
//         const current = this.template.settings[key] ?? { visible: false, required: false };
//         const incoming = templateFromApi?.[key] ?? templateFromApi?.settings?.[key] ?? {};
//         this.template.settings[key] = {
//           visible:  (incoming.visible  ?? current.visible)  ?? false,
//           required: (incoming.required ?? current.required) ?? false
//         };
//       });

//       // بعد الدمج من الـ API، نعيد فرض القاعدة
//       this.enforceAlwaysRequired();
//     });
//   }

//   /** يضمن وجود عنصر settings لكل مفتاح */
//   private ensureDefaults() {
//     this.settingKeys.forEach((key) => {
//       if (!this.template.settings[key]) {
//         this.template.settings[key] = { visible: false, required: false };
//       }
//     });
//   }

//   /** فرض الحقول المقفلة: visible=true و required=true دائمًا */
//   private enforceAlwaysRequired() {
//     this.alwaysRequiredKeys.forEach((key) => {
//       if (!this.template.settings[key]) this.template.settings[key] = { visible: true, required: true };
//       this.template.settings[key].visible = true;
//       this.template.settings[key].required = true;
//     });
//   }

//   /** هل المفتاح مقفول دائمًا؟ */
//   isAlwaysRequired(key: string): boolean {
//     return this.alwaysRequiredKeys.has(key);
//   }

//   /** تبديل Show */
//   onToggleVisible(key: string, checked: boolean) {
//     if (this.isAlwaysRequired(key)) {
//       // حماية: تجاهل أي محاولة لتغيير testListId
//       this.enforceAlwaysRequired();
//       return;
//     }
//     const s = this.template.settings[key] ?? { visible: false, required: false };
//     s.visible = checked;
//     if (!checked) s.required = false;
//     this.template.settings[key] = { ...s };
//   }

//   /** تبديل Required */
//   onToggleRequired(key: string, checked: boolean) {
//     if (this.isAlwaysRequired(key)) {
//       // حماية: تجاهل أي محاولة لتغيير testListId
//       this.enforceAlwaysRequired();
//       return;
//     }
//     const s = this.template.settings[key] ?? { visible: false, required: false };
//     s.required = s.visible ? checked : false;
//     this.template.settings[key] = { ...s };
//   }

//   saveTemplate() {
//     // تنظيف نهائي + فرض القاعدة
//     this.settingKeys.forEach((k) => {
//       const s = this.template.settings[k];
//       if (!s) return;
//       if (!s.visible && s.required) s.required = false;
//     });
//     this.enforceAlwaysRequired();

//     localStorage.setItem('lastTemplateSettings', JSON.stringify(this.template.settings));

//     this.saving = true;
//     this.templatesService.createTemplate(this.template).subscribe({
//       next: () => {
//         this.saving = false;
//         this.router.navigate(['/home/templates']);
//       },
//       error: () => {
//         this.saving = false;
//         alert('Error creating template');
//       }
//     });
//   }

//   onCancel() {
//     this.router.navigate(['/home/templates']);
//   }
// }


// src/app/pages/new-template/new-template.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-template.html',
  styleUrls: ['./new-template.scss']
})
export class NewTemplate implements OnInit {
  saving = false;

  private readonly alwaysRequiredKeys = new Set<string>(['testListId']);

  readonly settingKeys: string[] = [
    'siteId','plantId','processUnitId','samplingPointId',
    'productId','gradeId','stageId','testListId',
    'organizationId','buildingId','roomId','storageUnitId','shelfId','boxId','positionId',
    'sampleNumber','samplingDate','receivedDate','sampledBy',
    'priority','sampleDescription','location','groupName'
  ];

  template: any = {
    name: '',
    code: '',
    description: '',
    active: true,
    settings: {} as Record<string, { visible: boolean; required: boolean }>
  };

  labels: Record<string, string> = {
    siteId: 'Site', plantId: 'Plant', processUnitId: 'Process Unit', samplingPointId: 'Sampling Point',
    productId: 'Product', gradeId: 'Grade', stageId: 'Stage',
    testListId: 'Test Panel (Test List)',
    organizationId: 'Organization', buildingId: 'Building', roomId: 'Room',
    storageUnitId: 'Storage Unit', shelfId: 'Shelf', boxId: 'Box', positionId: 'Position',
    sampleNumber: 'Sample Number', samplingDate: 'Sampling Date/Time', receivedDate: 'Received Date/Time',
    sampledBy: 'Sampled By', priority: 'Priority', sampleDescription: 'Sample Description',
    location: 'Storage Location', groupName: 'Group'
  };

  private readonly BASE = 'http://localhost:3004/api/v1';
  private get headers() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json'
      })
    };
  }

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.ensureDefaults();
    this.enforceAlwaysRequired();
  }

  private ensureDefaults() {
    this.settingKeys.forEach((k) => {
      if (!this.template.settings[k]) {
        this.template.settings[k] = { visible: false, required: false };
      }
    });
  }

  private enforceAlwaysRequired() {
    this.alwaysRequiredKeys.forEach((k) => {
      this.template.settings[k] = { visible: true, required: true };
    });
  }

  isAlwaysRequired(key: string) { return this.alwaysRequiredKeys.has(key); }

  onToggleVisible(key: string, checked: boolean) {
    if (this.isAlwaysRequired(key)) return;
    const s = this.template.settings[key] ?? { visible: false, required: false };
    s.visible = checked;
    if (!checked) s.required = false;
    this.template.settings[key] = s;
  }

  onToggleRequired(key: string, checked: boolean) {
    if (this.isAlwaysRequired(key)) return;
    const s = this.template.settings[key] ?? { visible: false, required: false };
    s.required = s.visible ? checked : false;
    this.template.settings[key] = s;
  }

  private buildFlatPayloadFromSettings() {
    const s = this.template.settings as Record<string, {visible: boolean; required: boolean}>;
    const flat: any = {};
    this.settingKeys.forEach((k) => {
      const v = s[k] || { visible: false, required: false };
      flat[k] = { visible: !!v.visible, required: !!v.required, modifiable: true };
    });
    return flat;
  }

  saveTemplate() {
    this.ensureDefaults();
    this.enforceAlwaysRequired();

    const flat = this.buildFlatPayloadFromSettings();

    const payload = {
      name: this.template.name,
      code: this.template.code,
      description: this.template.description,
      active: !!this.template.active,
      ...flat
    };

    localStorage.setItem('lastTemplateSettings', JSON.stringify(this.template.settings));

    this.saving = true;
    this.http.post(`${this.BASE}/sample-templates`, payload, this.headers)
      .subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/home/templates']);
        },
        error: () => {
          this.saving = false;
          alert('Error creating template');
        }
      });
  }

  onCancel() { this.router.navigate(['/home/templates']); }
}
