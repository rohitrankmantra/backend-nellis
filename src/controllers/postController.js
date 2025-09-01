const ErrorHandler = require('../utils/ErrorHandler.js');
const asyncHandler = require('../utils/asyncHandler.js');
const sendResponse = require('../utils/sendResponse');
const { uploadFile, destroyFile } = require('../services/cloudinary.js');
const Post = require('../models/post.js');

module.exports.createPost = asyncHandler(async (req, res, next) => {
  const { title, content, author, tags, status } = req.body;
  const files = req.files;

  if (!title || !content || !author) {
    return next(new ErrorHandler('Title, content, and author are required', 400));
  }

  let imageUrl = '';
  if (files && files.image && files.image.length > 0) {
    try {
      const result = await uploadFile(files.image[0].path);
      imageUrl = result.url;
    } catch (error) {
      return next(new ErrorHandler(`Failed to upload image: ${error.message}`, 500));
    }
  }

  const postData = {
    title,
    content,
    author,
    image: imageUrl || '',
    tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    status: status || 'Published',
  };

  const newPost = await Post.create(postData);

  sendResponse(res, {
    statusCode: 201,
    message: 'Post created successfully!',
    data: newPost,
  });
});

module.exports.updatePost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { title, content, author, tags, status, image } = req.body;
  const files = req.files;

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (author !== undefined) updateData.author = author;
  if (tags !== undefined) {
    updateData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  }
  if (status !== undefined) updateData.status = status;

  if (files && files.image && files.image.length > 0) {
    try {
      const result = await uploadFile(files.image[0].path);
      updateData.image = result.url;
    } catch (error) {
      return next(new ErrorHandler(`Failed to upload image: ${error.message}`, 500));
    }
  } else if (image === '') {
    updateData.image = '';
  } else if (image !== undefined) {
    updateData.image = image;
  }

  if (Object.keys(updateData).length === 0) {
    return next(new ErrorHandler('No valid update data provided', 400));
  }

  const updatedPost = await Post.findByIdAndUpdate(id, { $set: updateData }, {
    new: true,
    runValidators: true,
  });

  if (!updatedPost) {
    return next(new ErrorHandler(`Post not found with ID: ${id}`, 404));
  }

  sendResponse(res, {
    statusCode: 200,
    message: 'Post updated successfully!',
    data: updatedPost,
  });
});

module.exports.getAllPosts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const posts = await Post.find()
    .sort({ publishDate: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Post.countDocuments();
  const totalPages = Math.ceil(totalCount / limit);

  sendResponse(res, {
    statusCode: 200,
    message: posts.length ? 'Posts fetched successfully!' : 'No posts found.',
    data: posts,
    pagination: {
      currentPage: page,
      limit: limit,
      totalPages: totalPages,
      totalItems: totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  });
});

module.exports.getPost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const post = await Post.findById(id);

  if (!post) {
    return next(new ErrorHandler(`Post not found with ID: ${id}`, 404));
  }

  sendResponse(res, {
    statusCode: 200,
    message: 'Post fetched successfully!',
    data: post,
  });
});

module.exports.deletePost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const deletedPost = await Post.findById(id);

  if (!deletedPost) {
    return next(new ErrorHandler(`Post not found with ID: ${id}`, 404));
  }

  if (deletedPost.image) {
    const publicId = deletedPost.image.split('/').pop().split('.')[0];
    try {
      const result = await destroyFile(`blog_posts/${publicId}`);
      if (result.result !== 'ok') {
        console.warn(`Failed to delete Cloudinary asset ${publicId}: ${result.result}`);
      }
    } catch (error) {
      console.error(`Error deleting Cloudinary asset ${publicId}:`, error);
    }
  }

  await Post.findByIdAndDelete(id);

  sendResponse(res, {
    statusCode: 200,
    message: 'Post deleted successfully!',
    data: null,
  });
});


module.exports.totalBlog = asyncHandler(async (req, res, next) => {
  const contact = await Post.countDocuments({});
  sendResponse(res, {
    statusCode: 200, // 200 OK
    message: "Contact total",
    data: contact,
  });
});