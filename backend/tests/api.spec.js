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
});
