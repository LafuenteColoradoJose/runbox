import { describe, it, expect, beforeAll, afterAll } from 'vitest';
const request = require('supertest');
const { app, server } = require('../server');
const db = require('../db');

describe('RBAC Tests', () => {
  let adminToken;
  let userToken;
  let normalUserId;
  let org1Id, org2Id;
  let inv1Id, inv2Id;
  const uniqueSuffix = Date.now() + Math.floor(Math.random() * 1000);

  beforeAll(async () => {
    // Authenticate admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'administrator', password: 'Usuario1.' });
    adminToken = adminRes.body.token;

    // Create a normal user
    const userRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: `normaluser_rbac_${uniqueSuffix}`, password: 'password', role: 'user', full_name: 'Normal User' });
    normalUserId = userRes.body.id;

    // Authenticate normal user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: `normaluser_rbac_${uniqueSuffix}`, password: 'password' });
    userToken = loginRes.body.token;

    // Create Orgs
    let res = await request(app).post('/api/organizations').set('Authorization', `Bearer ${adminToken}`).send({ name: `Org 1 RBAC ${uniqueSuffix}` });
    org1Id = res.body.id;
    res = await request(app).post('/api/organizations').set('Authorization', `Bearer ${adminToken}`).send({ name: `Org 2 RBAC ${uniqueSuffix}` });
    org2Id = res.body.id;

    // Assign user to Org 1
    db.prepare('INSERT INTO user_organizations (user_id, organization_id) VALUES (?, ?)').run(normalUserId, org1Id);

    // Create Inventories
    res = await request(app).post('/api/inventories').set('Authorization', `Bearer ${adminToken}`).send({ name: `Inv 1 RBAC ${uniqueSuffix}`, organization_id: org1Id });
    inv1Id = res.body.id;
    res = await request(app).post('/api/inventories').set('Authorization', `Bearer ${adminToken}`).send({ name: `Inv 2 RBAC ${uniqueSuffix}`, organization_id: org2Id });
    inv2Id = res.body.id;
  });

  afterAll(async () => {
    server.close();
  });

  it('Normal user should not be able to create an organization', async () => {
    const res = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Hacked Org' });
    expect(res.status).toBe(403);
  });

  it('Normal user should not be able to delete an inventory', async () => {
    const res = await request(app)
      .delete(`/api/inventories/${inv1Id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('Normal user should only see their assigned organizations', async () => {
    const res = await request(app)
      .get('/api/organizations')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(org1Id);
  });

  it('Normal user should only see inventories of their assigned organizations', async () => {
    const res = await request(app)
      .get('/api/inventories')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(inv1Id);
  });

  it('Normal user gets 403 when trying to access hosts of unauthorized inventory', async () => {
    const res = await request(app)
      .get(`/api/inventories/${inv2Id}/hosts`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('Normal user should get their own dashboard stats successfully', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalPlaybooks');
    expect(res.body).toHaveProperty('totalJobs');
  });
});
