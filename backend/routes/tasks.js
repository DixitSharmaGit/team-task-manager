const router = require('express').Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const tasks = req.user.role === 'Admin'
    ? await Task.find()
    : await Task.find({ $or: [{ assigneeId: req.user.id }, { createdById: req.user.id }] });
  res.json(tasks);
});

router.post('/', auth, async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, createdById: req.user.id });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

router.delete('/:id', auth, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;