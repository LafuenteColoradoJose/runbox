import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UserService } from './user';
import { environment } from '../../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpTestingController: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(UserService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load users and update the signal', () => {
    const mockUsers = [{ id: 1, username: 'admin', role: 'admin' as const }];
    service.loadUsers().subscribe(users => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpTestingController.expectOne(apiUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(mockUsers);

    expect(service.users()).toEqual(mockUsers);
  });

  it('should create a user and trigger reload', () => {
    const newUser = { username: 'testuser', role: 'user' as const };
    const mockRes = { id: 2, ...newUser };
    
    service.createUser(newUser).subscribe(user => {
      expect(user).toEqual(mockRes);
    });

    const reqPost = httpTestingController.expectOne(apiUrl);
    expect(reqPost.request.method).toEqual('POST');
    reqPost.flush(mockRes);

    const reqGet = httpTestingController.expectOne(apiUrl);
    expect(reqGet.request.method).toEqual('GET');
    reqGet.flush([]);
  });

  it('should update a user and trigger reload', () => {
    const update = { username: 'updated' };
    
    service.updateUser(1, update).subscribe(res => {
      expect(res).toBeNull();
    });

    const reqPut = httpTestingController.expectOne(`${apiUrl}/1`);
    expect(reqPut.request.method).toEqual('PUT');
    reqPut.flush(null);

    const reqGet = httpTestingController.expectOne(apiUrl);
    expect(reqGet.request.method).toEqual('GET');
    reqGet.flush([]);
  });

  it('should delete a user and trigger reload', () => {
    service.deleteUser(1).subscribe(res => {
      expect(res).toBeNull();
    });

    const reqDel = httpTestingController.expectOne(`${apiUrl}/1`);
    expect(reqDel.request.method).toEqual('DELETE');
    reqDel.flush(null);

    const reqGet = httpTestingController.expectOne(apiUrl);
    expect(reqGet.request.method).toEqual('GET');
    reqGet.flush([]);
  });
});
