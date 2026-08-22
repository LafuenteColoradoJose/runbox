import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

import { InventoryService, Host, Group, Inventory } from '../../../core/services/inventory.service';
import { HostDialog } from '../host-dialog/host-dialog';
import { GroupDialog } from '../group-dialog/group-dialog';

@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTabsModule, MatTableModule, 
    MatButtonModule, MatIconModule, MatChipsModule, MatDialogModule,
    NgxEchartsDirective
  ],
  templateUrl: './inventory-detail.html',
  styleUrl: './inventory-detail.css'
})
export class InventoryDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private inventoryService = inject(InventoryService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  inventoryId!: number;
  inventory?: Inventory;
  
  hosts: Host[] = [];
  groups: Group[] = [];
  chartOption: EChartsOption = {};

  hostColumns: string[] = ['name', 'ip_address', 'groups', 'actions'];
  groupColumns: string[] = ['id', 'name', 'actions'];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.inventoryId = Number(params.get('id'));
      this.loadAll();
    });
  }

  loadAll() {
    this.inventoryService.getInventory(this.inventoryId).subscribe(data => {
      this.inventory = data;
      this.cdr.markForCheck();
    });
    this.loadHosts();
    this.loadGroups();
    this.loadTopology();
  }

  loadHosts() {
    this.inventoryService.getHostsByInventory(this.inventoryId).subscribe(data => {
      this.hosts = data;
      this.cdr.markForCheck();
    });
  }

  loadGroups() {
    this.inventoryService.getGroupsByInventory(this.inventoryId).subscribe(data => {
      this.groups = data;
      this.cdr.markForCheck();
    });
  }

  loadTopology() {
    this.inventoryService.getTopologyByInventory(this.inventoryId).subscribe(data => {
      // Tree Graph (Topology tab)
      const rootNode = data.nodes.find(n => n.category === 0);
      if (rootNode) {
        const buildTree = (nodeId: string, nodeName: string, category: number): any => {
          // Find all links where source is current node
          const childrenLinks = data.links.filter(l => l.source === nodeId);
          const children = childrenLinks
            .map(l => {
              const childNode = data.nodes.find(n => n.id === l.target);
              return childNode ? buildTree(childNode.id, childNode.name, childNode.category) : null;
            })
            .filter(c => c !== null);
          
          return {
            name: nodeName,
            children: children.length > 0 ? children : undefined,
            itemStyle: {
              color: category === 0 ? '#ee6666' : category === 1 ? '#5470c6' : category === 2 ? '#91cc75' : '#73c0de',
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              color: '#333',
              fontWeight: category <= 1 ? 'bold' : 'normal'
            }
          };
        };

        const treeData = [buildTree(rootNode.id, rootNode.name, rootNode.category)];

        this.chartOption = {
          tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove'
          },
          series: [
            {
              type: 'tree',
              data: treeData,
              top: '10%',
              left: '20%',
              bottom: '10%',
              right: '25%',
              symbolSize: 15,
              label: {
                position: 'top',
                verticalAlign: 'middle',
                align: 'center',
                fontSize: 14,
                backgroundColor: 'rgba(255,255,255,0.8)',
                padding: [2, 4],
                borderRadius: 3
              },
              leaves: {
                label: {
                  position: 'right',
                  verticalAlign: 'middle',
                  align: 'left'
                }
              },
              expandAndCollapse: true,
              initialTreeDepth: -1,
              animationDuration: 550,
              animationDurationUpdate: 750
            }
          ]
        };
      }

      this.cdr.markForCheck();
    });
  }

  openHostDialog(host?: Host) {
    const dialogRef = this.dialog.open(HostDialog, {
      width: '600px',
      data: { host, inventoryId: this.inventoryId }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadAll();
    });
  }

  deleteHost(id: number) {
    if (confirm('Are you sure you want to delete this host?')) {
      this.inventoryService.deleteHost(id).subscribe(() => this.loadAll());
    }
  }

  openGroupDialog(group?: Group) {
    const dialogRef = this.dialog.open(GroupDialog, {
      width: '500px',
      data: { group, inventoryId: this.inventoryId }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadAll();
    });
  }

  deleteGroup(id: number) {
    if (confirm('Are you sure you want to delete this group?')) {
      this.inventoryService.deleteGroup(id).subscribe(() => this.loadAll());
    }
  }
}
