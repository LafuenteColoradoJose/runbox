import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryDetail } from './inventory-detail';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { AuthService } from '../../../core/services/auth';
import { MatDialog } from '@angular/material/dialog';
import { of, BehaviorSubject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NGX_ECHARTS_CONFIG } from 'ngx-echarts';

describe('InventoryDetail', () => {
  let component: InventoryDetail;
  let fixture: ComponentFixture<InventoryDetail>;
  
  let mockInventoryService: any;
  let mockAuthService: any;
  let mockDialog: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    (globalThis as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    mockInventoryService = {
      getInventory: vi.fn().mockReturnValue(of({ id: 1, name: 'Test Inventory' })),
      getHostsByInventory: vi.fn().mockReturnValue(of([{ id: 10, name: 'Host 1' }])),
      getGroupsByInventory: vi.fn().mockReturnValue(of([{ id: 20, name: 'Group 1' }])),
      getTopologyByInventory: vi.fn().mockReturnValue(of({
        nodes: [
          { id: '1', name: 'Root', category: 0 },
          { id: '2', name: 'Child 1', category: 1 },
          { id: '3', name: 'Child 2', category: 2 },
          { id: '4', name: 'Child 3', category: 3 }
        ],
        links: [
          { source: '1', target: '2' },
          { source: '2', target: '3' },
          { source: '2', target: '4' }
        ]
      })),
      deleteHost: vi.fn().mockReturnValue(of(true)),
      deleteGroup: vi.fn().mockReturnValue(of(true))
    };

    mockAuthService = {
      currentUser: vi.fn().mockReturnValue({ role: 'admin' })
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(true))
      })
    };

    mockActivatedRoute = {
      paramMap: new BehaviorSubject(new Map([['id', '1']]))
    };

    TestBed.overrideProvider(MatDialog, { useValue: mockDialog });

    await TestBed.configureTestingModule({
      imports: [InventoryDetail],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NGX_ECHARTS_CONFIG, useValue: { echarts: () => import('echarts') } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    
    fixture = TestBed.createComponent(InventoryDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and load data', () => {
    expect(component).toBeTruthy();
    expect(component.inventoryId).toBe(1);
    expect(component.inventory?.name).toBe('Test Inventory');
    expect(component.hosts.length).toBe(1);
    expect(component.groups.length).toBe(1);
    expect(component.hostColumns).toEqual(['name', 'ip_address', 'groups', 'actions']);
    expect(component.groupColumns).toEqual(['id', 'name', 'actions']);
  });

  it('should remove actions columns if user is not admin', () => {
    mockAuthService.currentUser.mockReturnValue({ role: 'user' });
    const localFixture = TestBed.createComponent(InventoryDetail);
    const localComponent = localFixture.componentInstance;
    expect(localComponent.hostColumns).toEqual(['name', 'ip_address', 'groups']);
    expect(localComponent.groupColumns).toEqual(['id', 'name']);
  });

  it('should build tree graph in loadTopology correctly', () => {
    expect(component.chartOption).toBeDefined();
    const series: any = (component.chartOption as any).series;
    expect(series).toBeDefined();
    expect(series.length).toBe(1);
    
    const treeData = series[0].data;
    expect(treeData.length).toBe(1);
    expect(treeData[0].name).toBe('Root');
    expect(treeData[0].children.length).toBe(1);
    expect(treeData[0].children[0].name).toBe('Child 1');
    expect(treeData[0].children[0].children.length).toBe(2);
    expect(treeData[0].itemStyle.color).toBe('#ee6666'); // category 0
    expect(treeData[0].children[0].itemStyle.color).toBe('#5470c6'); // category 1
    expect(treeData[0].children[0].children[0].itemStyle.color).toBe('#91cc75'); // category 2
    expect(treeData[0].children[0].children[1].itemStyle.color).toBe('#73c0de'); // category 3
  });

  it('should handle loadTopology without rootNode', () => {
    mockInventoryService.getTopologyByInventory.mockReturnValue(of({ nodes: [], links: [] }));
    component.chartOption = {};
    component.loadTopology();
    expect(component.chartOption).toEqual({});
  });

  it('should open host dialog and reload on close with result', () => {
    const loadAllSpy = vi.spyOn(component, 'loadAll');
    component.openHostDialog();
    expect(mockDialog.open).toHaveBeenCalled();
    expect(loadAllSpy).toHaveBeenCalled();
  });

  it('should open host dialog and not reload if closed without result', () => {
    mockDialog.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(false)) });
    const loadAllSpy = vi.spyOn(component, 'loadAll');
    component.openHostDialog();
    expect(loadAllSpy).not.toHaveBeenCalled();
  });

  it('should delete host if confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const loadAllSpy = vi.spyOn(component, 'loadAll');
    component.deleteHost(10);
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this host?');
    expect(mockInventoryService.deleteHost).toHaveBeenCalledWith(10);
    expect(loadAllSpy).toHaveBeenCalled();
  });

  it('should not delete host if cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.deleteHost(10);
    expect(mockInventoryService.deleteHost).not.toHaveBeenCalled();
  });

  it('should open group dialog and reload on close with result', () => {
    const loadAllSpy = vi.spyOn(component, 'loadAll');
    component.openGroupDialog();
    expect(mockDialog.open).toHaveBeenCalled();
    expect(loadAllSpy).toHaveBeenCalled();
  });

  it('should open group dialog and not reload if closed without result', () => {
    mockDialog.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(false)) });
    const loadAllSpy = vi.spyOn(component, 'loadAll');
    component.openGroupDialog();
    expect(loadAllSpy).not.toHaveBeenCalled();
  });

  it('should delete group if confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const loadAllSpy = vi.spyOn(component, 'loadAll');
    component.deleteGroup(20);
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this group?');
    expect(mockInventoryService.deleteGroup).toHaveBeenCalledWith(20);
    expect(loadAllSpy).toHaveBeenCalled();
  });

  it('should not delete group if cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.deleteGroup(20);
    expect(mockInventoryService.deleteGroup).not.toHaveBeenCalled();
  });
});
