const router = require('express').Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const projects = req.user.role === 'Admin'
    ? await Project.find()
    : await Project.find({ memberIds: req.user.id });
  res.json(projects);
});

router.post('/', auth, async (req, res) => {
  try {
    const project = await Project.create({
      ...req.body,
      ownerId: req.user.id,
      memberIds: [req.user.id],
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(project);
});

router.delete('/:id', auth, async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;