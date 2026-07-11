const { Category, Product } = require('../models');

exports.getAll = async (req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    res.json(category);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required.' });

    const category = await Category.create({ name, description });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });

    const { name, description } = req.body;
    await category.update({ name, description });
    res.json(category);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });

    const productCount = await Product.count({ where: { category_id: category.id } });
    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category. ${productCount} product(s) are linked to it.`,
      });
    }

    await category.destroy();
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
};
