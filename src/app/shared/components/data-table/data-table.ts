
// import { Component, Input, OnChanges } from '@angular/core';

// @Component({
//   selector: 'app-data-table',
//     templateUrl: './data-table.html',
//   styleUrl: './data-table.scss'
// })
// export class DataTableComponent implements OnChanges {
//   @Input() activeTab: string = 'product-grade'; // التاب الحالي

//   displayedColumns: string[] = [];
//   tableData: any[] = [];

//   ngOnChanges() {
//     this.loadTableData();
//   }

//   loadTableData() {
//     switch (this.activeTab) {
//       case 'product-grade':
//         this.displayedColumns = ['code', 'name'];
//         this.tableData = [
//           { code: 116, name: 'MEWA Grade B' },
//           { code: 116, name: 'MEWA Grade B' },
//         ];
//         break;

//       case 'analysis-type':
//         this.displayedColumns = ['code', 'name'];
//         this.tableData = [
//           { code: 116, name: 'Chemical' },
//           { code: 116, name: 'Chemical' },
//         ];
//         break;

//       case 'analysis-group':
//         this.displayedColumns = ['code', 'name', 'productGradeName'];
//         this.tableData = [
//           { code: 116, name: 'Chemical', productGradeName: '681366a56df0d0a71f7747' },
//           { code: 116, name: 'Chemical', productGradeName: '681366a56df0d0a71f7747' },
//         ];
//         break;

//       case 'analysis':
//         this.displayedColumns = ['code', 'name', 'analysisTypeName', 'analysisGroupName'];
//         this.tableData = [
//           { code: 116, name: 'Chemical', analysisTypeName: '68132f9f769cfb6787c18f3', analysisGroupName: '681366a56df0d0a71f7747' },
//           { code: 116, name: 'Chemical', analysisTypeName: '68132f9f769cfb6787c18f3', analysisGroupName: '681366a56df0d0a71f7747' },
//         ];
//         break;

//       case 'test':
//         this.displayedColumns = ['code', 'name', 'analysisName', 'analysisId'];
//         this.tableData = [
//           { code: 116, name: 'Chemical', analysisName: '68132f9f769cfb6787c18f3', analysisId: '681366a56df0d0a71f7747' },
//           { code: 116, name: 'Chemical', analysisName: '68132f9f769cfb6787c18f3', analysisId: '681366a56df0d0a71f7747' },
//         ];
//         break;
//     }
//   }
// }
