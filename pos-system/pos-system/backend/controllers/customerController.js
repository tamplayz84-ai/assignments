const { Customer } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }
    const customers = await Customer.findAll({ where, order: [['name', 'ASC']] });
    res.json(customers);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    res.json(customer);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required.' });

    const customer = await Customer.create({ name, phone, address });
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const { name, phone, address } = req.body;
    await customer.update({ name, phone, address });
    res.json(customer);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    await customer.destroy();
    res.json({ message: 'Customer deleted.' });
  } catch (err) {
    next(err);
  }
};
