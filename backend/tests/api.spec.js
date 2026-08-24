import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { EventEmitter } from 'events';
import cp from 'child_process';
const { app, server } = require('../server');

describe('API Endpoints', () => {
  let token;

  beforeAll(async () => {
    vi.spyOn(cp, 'spawn').mockImplementation(() => {
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      setTimeout(() => {
        child.stdout.emit('data', 'Mock stdout data');
        child.stderr.emit('data', 'Mock stderr data');
        child.emit('close', 0);
      }, 10);
      return child;
    });

    // Login to get token for tests
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'administrator', password: 'Usuario1.' });
    token = res.body.token;
  });

  afterAll(() => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  describe('GET /api/playbooks', () => {
    it('should return 401 if no token provided', async () => {
      const response = await request(app).get('/api/playbooks');
      expect(response.status).toBe(401);
    });

    it('should return 401 for an invalid token', async () => {
      const response = await request(app)
        .get('/api/playbooks')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Token inválido o expirado.');
    });

    it('should return a list of playbooks when authenticated', async () => {
      const response = await request(app)
        .get('/api/playbooks')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('path');
    });
  });

  describe('Auth Errors', () => {
    it('should return 401 for invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({ username: 'administrator', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Credenciales inválidas');
    });
    it('should return 401 for non-existent user', async () => {
      const res = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'password' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Credenciales inválidas');
    });
  });

  describe('Playbooks CRUD', () => {
    let playbookId;
    it('should create a playbook', async () => {
      const res = await request(app)
        .post('/api/playbooks')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Playbook API', path: '/test/path.yml' });
      if (res.status !== 200) console.error('Create Playbook Error:', res.body);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'Test Playbook API');
      expect(res.body).toHaveProperty('path', '/test/path.yml');
      playbookId = res.body.id;
    });

    it('should update a playbook', async () => {
      const res = await request(app)
        .put(`/api/playbooks/${playbookId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Playbook', path: '/test/updated.yml', organization_id: null });
      if (res.status !== 200) console.error('Update Playbook Error:', res.body);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should create a git playbook', async () => {
      const res = await request(app)
        .post('/api/playbooks')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          name: 'Git Playbook', 
          source_type: 'git',
          git_repo_url: 'https://github.com/test/repo.git',
          git_branch: 'main',
          git_path: 'playbook.yml'
        });
      if (res.status !== 200) console.error('Create Git Playbook Error:', res.body);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('source_type', 'git');
      expect(res.body).toHaveProperty('git_repo_url', 'https://github.com/test/repo.git');
      expect(res.body).toHaveProperty('git_branch', 'main');
      expect(res.body).toHaveProperty('git_path', 'playbook.yml');
      const gitPlaybookId = res.body.id;
      
      const resUpdate = await request(app)
        .put(`/api/playbooks/${gitPlaybookId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          name: 'Updated Git Playbook', 
          source_type: 'git',
          git_repo_url: 'https://github.com/test/repo2.git',
          git_branch: 'develop',
          git_path: 'site.yml'
        });
      expect(resUpdate.status).toBe(200);
      expect(resUpdate.body).toHaveProperty('success', true);
    });

    it('should delete a playbook', async () => {
      const res = await request(app)
        .delete(`/api/playbooks/${playbookId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should return 500 when database fails', async () => {
      const db = require('../db');
      const originalPrepare = db.prepare;
      db.prepare = vi.fn().mockImplementation(() => { throw new Error('DB Error'); });
      
      const res = await request(app)
        .post('/api/playbooks')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Fail Playbook', path: '/fail' });
      
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'DB Error');
      
      db.prepare = originalPrepare;
    });
  });

  describe('Users API', () => {
    let userId;
    
    it('should list users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should create a user', async () => {
      const dynamicUsername = `testuser_${Date.now()}`;
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: dynamicUsername, password: 'password123', role: 'viewer', organizations: [] });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      userId = res.body.id;
    });

    it('should update a user', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'admin', organizations: [] });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should delete a user', async () => {
      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });

  describe('Static Files', () => {
    it('should serve index.html for unknown non-api routes', async () => {
      const response = await request(app).get('/some-random-route');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should return 404 for a non-existing job', async () => {
      const response = await request(app)
        .get('/api/jobs/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Job no encontrado');
    });

    it('should run a playbook and then fetch the created job', async () => {
      const playbooksResponse = await request(app)
        .get('/api/playbooks')
        .set('Authorization', `Bearer ${token}`);
      const playbookId = playbooksResponse.body[0].id;

      const runResponse = await request(app)
        .post('/api/playbooks/run')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: playbookId });

      expect(runResponse.status).toBe(200);
      expect(runResponse.body).toHaveProperty('job');
      
      const jobId = runResponse.body.job.id;

      const jobResponse = await request(app)
        .get(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(jobResponse.status).toBe(200);
      expect(jobResponse.body).toHaveProperty('id', jobId);
      expect(jobResponse.body).toHaveProperty('playbook_id', playbookId);
    });
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return 401 if no token provided', async () => {
      const response = await request(app).get('/api/dashboard/stats');
      expect(response.status).toBe(401);
    });

    it('should return dashboard stats when authenticated', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalPlaybooks');
      expect(response.body).toHaveProperty('totalJobs');
      expect(response.body).toHaveProperty('failedJobs');
      expect(response.body).toHaveProperty('recentJobs');
      expect(Array.isArray(response.body.recentJobs)).toBe(true);
    });
  });
  describe('Organizations API', () => {
    let orgId;
    it('should create an organization', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Org' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'Test Org');
      orgId = res.body.id;
    });

    it('should list organizations', async () => {
      const res = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should update an organization', async () => {
      const res = await request(app)
        .put(`/api/organizations/${orgId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Org' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should delete an organization', async () => {
      const res = await request(app)
        .delete(`/api/organizations/${orgId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });

  describe('Inventories API', () => {
    let invId;
    it('should create an inventory', async () => {
      const res = await request(app)
        .post('/api/inventories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Inventory' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      invId = res.body.id;
    });

    it('should list inventories', async () => {
      const res = await request(app)
        .get('/api/inventories')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should update an inventory', async () => {
      const res = await request(app)
        .put(`/api/inventories/${invId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Inventory', organization_id: null });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should get an inventory by id', async () => {
      const res = await request(app)
        .get(`/api/inventories/${invId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', invId);
    });

    it('should return 404 for non-existent inventory', async () => {
      const res = await request(app)
        .get('/api/inventories/9999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    describe('Groups and Hosts API', () => {
      let groupId, hostId;

      it('should create a group', async () => {
        const res = await request(app)
          .post(`/api/inventories/${invId}/groups`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Test Group', variables: '{"var": "value"}' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id');
        groupId = res.body.id;
      });

      it('should list groups in an inventory', async () => {
        const res = await request(app)
          .get(`/api/inventories/${invId}/groups`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });

      it('should create a host in a group', async () => {
        const res = await request(app)
          .post(`/api/inventories/${invId}/hosts`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'test-host', ip_address: '1.2.3.4', groups: [groupId] });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id');
        hostId = res.body.id;
      });

      it('should list hosts in an inventory', async () => {
        const res = await request(app)
          .get(`/api/inventories/${invId}/hosts`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });

      it('should update a host', async () => {
        const res = await request(app)
          .put(`/api/hosts/${hostId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'test-host-2', ip_address: '4.3.2.1', groups: [groupId] });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
      });

      it('should get topology for inventory', async () => {
        const res = await request(app)
          .get(`/api/inventories/${invId}/topology`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('nodes');
        expect(res.body).toHaveProperty('links');
      });

      it('should delete a host', async () => {
        const res = await request(app)
          .delete(`/api/hosts/${hostId}`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
      });

      it('should update a group', async () => {
        const res = await request(app)
          .put(`/api/groups/${groupId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Updated Group', variables: '{}' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
      });

      it('should delete a group', async () => {
        const res = await request(app)
          .delete(`/api/groups/${groupId}`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
      });
    });

    it('should delete an inventory', async () => {
      const res = await request(app)
        .delete(`/api/inventories/${invId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
});
