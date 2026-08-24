import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { InventoryService } from './inventory.service';
import { environment } from '../../../environments/environment';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpTestingController: HttpTestingController;
  const apiBase = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(InventoryService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Organizations ---
  it('should get organizations', () => {
    const mockOrgs = [{ id: 1, name: 'Org 1' }];
    service.getOrganizations().subscribe((orgs) => expect(orgs).toEqual(mockOrgs));
    const req = httpTestingController.expectOne(`${apiBase}/organizations`);
    expect(req.request.method).toEqual('GET');
    req.flush(mockOrgs);
  });

  it('should create an organization', () => {
    const newOrg = { name: 'New Org' };
    const mockRes = { id: 2, name: 'New Org' };
    service.createOrganization(newOrg).subscribe((org) => expect(org).toEqual(mockRes));
    const req = httpTestingController.expectOne(`${apiBase}/organizations`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(newOrg);
    req.flush(mockRes);
  });

  it('should update an organization', () => {
    const update = { name: 'Updated Org' };
    service.updateOrganization(1, update).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/organizations/1`);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(update);
    req.flush({});
  });

  it('should delete an organization', () => {
    service.deleteOrganization(1).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/organizations/1`);
    expect(req.request.method).toEqual('DELETE');
    req.flush({});
  });

  // --- Inventories ---
  it('should get inventories', () => {
    const mockInvs = [{ id: 1, name: 'Inv 1' }];
    service.getInventories().subscribe((invs) => expect(invs).toEqual(mockInvs));
    const req = httpTestingController.expectOne(`${apiBase}/inventories`);
    expect(req.request.method).toEqual('GET');
    req.flush(mockInvs);
  });

  it('should get inventory by id', () => {
    const mockInv = { id: 1, name: 'Inv 1' };
    service.getInventory(1).subscribe((inv) => expect(inv).toEqual(mockInv));
    const req = httpTestingController.expectOne(`${apiBase}/inventories/1`);
    expect(req.request.method).toEqual('GET');
    req.flush(mockInv);
  });

  it('should create an inventory', () => {
    const newInv = { name: 'New Inv' };
    service.createInventory(newInv).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/inventories`);
    expect(req.request.method).toEqual('POST');
    req.flush({ id: 2, ...newInv });
  });

  it('should update an inventory', () => {
    const update = { name: 'Updated Inv' };
    service.updateInventory(1, update).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/inventories/1`);
    expect(req.request.method).toEqual('PUT');
    req.flush({});
  });

  it('should delete an inventory', () => {
    service.deleteInventory(1).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/inventories/1`);
    expect(req.request.method).toEqual('DELETE');
    req.flush({});
  });

  // --- Groups ---
  it('should get groups by inventory', () => {
    service.getGroupsByInventory(1).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/inventories/1/groups`);
    expect(req.request.method).toEqual('GET');
    req.flush([]);
  });

  it('should create a group', () => {
    const newGrp = { name: 'Group 1' };
    service.createGroup(1, newGrp).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/inventories/1/groups`);
    expect(req.request.method).toEqual('POST');
    req.flush({ id: 1, ...newGrp });
  });

  it('should update a group', () => {
    const update = { name: 'Group Updated' };
    service.updateGroup(1, update).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/groups/1`);
    expect(req.request.method).toEqual('PUT');
    req.flush({});
  });

  it('should delete a group', () => {
    service.deleteGroup(1).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/groups/1`);
    expect(req.request.method).toEqual('DELETE');
    req.flush({});
  });

  // --- Hosts ---
  it('should get hosts by inventory', () => {
    service.getHostsByInventory(1).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/inventories/1/hosts`);
    expect(req.request.method).toEqual('GET');
    req.flush([]);
  });

  it('should create a host', () => {
    const newHost = { name: 'Host 1' };
    service.createHost(1, newHost).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/inventories/1/hosts`);
    expect(req.request.method).toEqual('POST');
    req.flush({ id: 1, ...newHost });
  });

  it('should update a host', () => {
    const update = { name: 'Host Updated' };
    service.updateHost(1, update).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/hosts/1`);
    expect(req.request.method).toEqual('PUT');
    req.flush({});
  });

  it('should delete a host', () => {
    service.deleteHost(1).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/hosts/1`);
    expect(req.request.method).toEqual('DELETE');
    req.flush({});
  });

  // --- Topology ---
  it('should get topology by inventory', () => {
    service.getTopologyByInventory(1).subscribe((res) => expect(res).toBeTruthy());
    const req = httpTestingController.expectOne(`${apiBase}/inventories/1/topology`);
    expect(req.request.method).toEqual('GET');
    req.flush({ nodes: [], links: [], categories: [] });
  });

});
