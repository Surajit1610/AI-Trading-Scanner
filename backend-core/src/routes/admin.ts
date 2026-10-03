import express from 'express';
import mongoose from 'mongoose';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Get all users
router.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database not connected');
    
    // Better auth uses 'user' collection
    const users = await db.collection('user').find({}).toArray();
    
    // Exclude password hashes if they exist, send safe data
    const safeUsers = users.map(u => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      accountStatus: u.accountStatus || 'pending',
      createdAt: u.createdAt
    }));

    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user status/role
router.patch('/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { accountStatus, role } = req.body;
    
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database not connected');

    const updateFields: any = {};
    if (accountStatus) updateFields.accountStatus = accountStatus;
    if (role) updateFields.role = role;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    let queryId;
    try {
      queryId = new ObjectId(id);
    } catch (e) {
      // If it's not a valid ObjectId (some setups use UUID strings), fallback to string
      queryId = id;
    }

    const result = await db.collection('user').updateOne(
      { _id: queryId as any },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
