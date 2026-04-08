const Category = require('../models/category.model');

const categoryController = {
    // GET /api/categories
    getAllCategories: async (req, res) => {
        try {
            const categories = await Category.find({ is_active: 1 })
                .sort({ name: 1 });

            res.json({
                success: true,
                data: { categories }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // GET /api/categories/:id
    getCategoryById: async (req, res) => {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Danh mục không tồn tại'
                });
            }

            res.json({
                success: true,
                data: { category }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // POST /api/categories
    createCategory: async (req, res) => {
        try {
            const category = new Category(req.body);
            await category.save();

            res.status(201).json({
                success: true,
                message: 'Tạo danh mục thành công',
                data: { category }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // PUT /api/categories/:id
    updateCategory: async (req, res) => {
        try {
            const category = await Category.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Danh mục không tồn tại'
                });
            }

            res.json({
                success: true,
                message: 'Cập nhật danh mục thành công',
                data: { category }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // DELETE /api/categories/:id
    deleteCategory: async (req, res) => {
        try {
            const category = await Category.findByIdAndDelete(req.params.id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Danh mục không tồn tại'
                });
            }

            res.json({
                success: true,
                message: 'Xóa danh mục thành công'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = categoryController;
