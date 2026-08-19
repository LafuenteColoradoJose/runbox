import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
const { app, server } = require('../server');

describe('API Endpoints', () => {
  afterAll(() => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  describe('GET /api/playbooks', () => {
    it('should return a list of playbooks', async () => {
      const response = await request(app).get('/api/playbooks');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // We expect at least one playbook because db.js inserts a Dummy Playbook
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('path');
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should return 404 for a non-existing job', async () => {
      const response = await request(app).get('/api/jobs/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Job no encontrado');
    });

    it('should run a playbook and then fetch the created job', async () => {
      // Step 1: Run a playbook
      const playbooksResponse = await request(app).get('/api/playbooks');
      const playbookId = playbooksResponse.body[0].id;

      const runResponse = await request(app)
        .post('/api/playbooks/run')
        .send({ id: playbookId });

      expect(runResponse.status).toBe(200);
      expect(runResponse.body).toHaveProperty('job');
      
      const jobId = runResponse.body.job.id;

      // Step 2: Fetch the created job
      const jobResponse = await request(app).get(`/api/jobs/${jobId}`);
      expect(jobResponse.status).toBe(200);
      expect(jobResponse.body).toHaveProperty('id', jobId);
      expect(jobResponse.body).toHaveProperty('playbook_id', playbookId);
    });
  });
});
