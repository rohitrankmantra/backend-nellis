const express = require('express');
const router = express.Router();
const { upload } = require('../../middlewares/multer.middleware.js');
const postController = require('../../controllers/postController.js');

router.get('/', postController.getAllPosts);
router.get("/totalPosts",postController.totalBlog)
router.get('/:id', postController.getPost);

router.post('/', upload.fields([{ name: 'image', maxCount: 1 }]), postController.createPost);
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }]), postController.updatePost);
router.delete('/:id', postController.deletePost);

module.exports = router;
