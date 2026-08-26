import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Organization {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  users_count?: number;
  playbooks_count?: number;
  inventories_count?: number;
}

export interface Group {
  id: number;
  inventory_id?: number;
  name: string;
  variables?: any;
}

export interface Host {
  id: number;
  inventory_id: number;
  name: string;
  ip_address: string;
  variables: any;
  groups?: Group[];
}

export interface Inventory {
  id: number;
  name: string;
  organization_id?: number;
  organization_name?: string;
}

export interface TopologyNode {
  id: string;
  name: string;
  category: number;
  symbolSize: number;
}

export interface TopologyLink {
  source: string;
  target: string;
}

export interface TopologyData {
  nodes: TopologyNode[];
  links: TopologyLink[];
  categories: { name: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http = inject(HttpClient);
  private apiBase = environment.apiUrl;

  // --- Organizations ---
  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.apiBase}/organizations`);
  }
  createOrganization(data: Partial<Organization>): Observable<Organization> {
    return this.http.post<Organization>(`${this.apiBase}/organizations`, data);
  }
  updateOrganization(id: number, data: Partial<Organization>): Observable<any> {
    return this.http.put(`${this.apiBase}/organizations/${id}`, data);
  }
  deleteOrganization(id: number): Observable<any> {
    return this.http.delete(`${this.apiBase}/organizations/${id}`);
  }

  // --- Inventories ---
  getInventories(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.apiBase}/inventories`);
  }
  getInventory(id: number): Observable<Inventory> {
    return this.http.get<Inventory>(`${this.apiBase}/inventories/${id}`);
  }
  createInventory(data: Partial<Inventory>): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.apiBase}/inventories`, data);
  }
  updateInventory(id: number, data: Partial<Inventory>): Observable<any> {
    return this.http.put(`${this.apiBase}/inventories/${id}`, data);
  }
  deleteInventory(id: number): Observable<any> {
    return this.http.delete(`${this.apiBase}/inventories/${id}`);
  }

  // --- Groups ---
  getGroupsByInventory(inventoryId: number): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiBase}/inventories/${inventoryId}/groups`);
  }
  createGroup(inventoryId: number, data: Partial<Group>): Observable<Group> {
    return this.http.post<Group>(`${this.apiBase}/inventories/${inventoryId}/groups`, data);
  }
  updateGroup(id: number, data: Partial<Group>): Observable<any> {
    return this.http.put(`${this.apiBase}/groups/${id}`, data);
  }
  deleteGroup(id: number): Observable<any> {
    return this.http.delete(`${this.apiBase}/groups/${id}`);
  }

  // --- Hosts ---
  getHostsByInventory(inventoryId: number): Observable<Host[]> {
    return this.http.get<Host[]>(`${this.apiBase}/inventories/${inventoryId}/hosts`);
  }
  createHost(inventoryId: number, data: any): Observable<Host> {
    return this.http.post<Host>(`${this.apiBase}/inventories/${inventoryId}/hosts`, data);
  }
  updateHost(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiBase}/hosts/${id}`, data);
  }
  deleteHost(id: number): Observable<any> {
    return this.http.delete(`${this.apiBase}/hosts/${id}`);
  }

  // --- Topology ---
  getTopologyByInventory(inventoryId: number): Observable<TopologyData> {
    return this.http.get<TopologyData>(`${this.apiBase}/inventories/${inventoryId}/topology`);
  }
}
