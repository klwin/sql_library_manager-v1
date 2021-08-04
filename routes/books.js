const express = require('express');
const router = express.Router();
const Book = require('../models').Book;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

/* Handler function to wrap each route. */
function asyncHandler(cb){
    return async(req, res, next) => {
        try {
            await cb(req, res, next)
        } catch(error){
            // Forward error to the global error handler
            next(error);
        }
    }
}

/* GET books listing. */
router.get('/', asyncHandler(async (req, res) => {

    const page = req.query.page;
    !page || page <= 0 ? res.redirect("?page=1") : null;

    const count = await Book.count();
    const numOfPages = Math.ceil(count / 10);

    const books = await Book.findAll({ limit: 10, offset: (page - 1) * 10, order: [["createdAt","DESC"]] });

    let pageLinks = 1;
    page > numOfPages ? res.redirect(`?page=${numOfPages}`) : null;
    res.render("books/index", {books, title: "Books", numOfPages, pageLinks});
}));

/* Search books */
router.get('/search', asyncHandler(async (req, res) => {
    const term = req.query.term.toLowerCase();
    const page = req.query.page;
    !page || page <= 0 ? res.redirect(`search?term=${term}&page=1`) : null;

    const results = await Book.findAndCountAll({
        where: {
          [Op.or]: [
            {
              title: {
                [Op.like]: `%${term}%` 
              }
            },
            {
              author: {
                [Op.like]: `%${term}%` 
              }
            },
            {
              genre: {
                [Op.like]: `%${term}%` 
              }
            },
            {
              year: {
                [Op.like]: `%${term}%` 
              }
            }
          ]
        },
        limit: 10,
        offset: (page - 1) * 10,
        order: [["createdAt","DESC"]]
    });

    let count = results.count;
    if (count > 0) {
        let pageLinks = 1;
        const numOfPages = Math.ceil(count / 10);
        page > numOfPages ? res.redirect(`?term=${term}&page=${numOfPages}`) : null;
        res.render('books/index', {
            books: results.rows,
            title: 'Search',
            numOfPages,
            term,
            pageLinks
        })
    } else {
        res.render("books/none-found", { term, title: "Search" });
    }
    
}));
  
/* Create a new book form. */
router.get('/new', (req, res) => {
    res.render("books/new", { book: {}, title: "New Book" });
});

/* POST create book. */
router.post('/', asyncHandler(async (req,res) => {
    let book;
    try {
        book = await Book.create(req.body);
        res.redirect("/books/" + book.id);
    } catch (error) {
        if(error.name === "SequelizeValidationError") { // checking the error
            book = await Book.build(req.body);
            res.render("books/new", {book, errors: error.errors, title: "New Article" })
        } else {
            throw error; // error caught in the asyncHandler's catch block
        }
    }
}));

/* GET individual book. */
router.get('/:id', asyncHandler(async (req, res) => {
    const book = await Book.findByPk(req.params.id);
    if(book) {
        res.render("books/edit", { book, title: book.title });  
    } else {
        res.status(404).render('page-not-found');;
    }
}));

/* Update a book. */
router.post('/:id', asyncHandler(async (req, res) => {
    let book;
    try {
      book = await Book.findByPk(req.params.id);
      if(book) {
        await book.update(req.body);
        res.redirect("/books/" + book.id); 
      } else {
        res.status(404).render('page-not-found');;
      }
    } catch (error) {
      if(error.name === "SequelizeValidationError") {
        book = await Book.build(req.body);
        book.id = req.params.id; // make sure correct book gets updated
        res.render("books/edit", { book, errors: error.errors, title: "Edit Book" })
      } else {
        throw error;
      }
    }
}));

/* Delete individual books. */
router.post('/:id/delete', asyncHandler(async (req ,res) => {
    const book = await Book.findByPk(req.params.id);
    if(book) {
        await book.destroy();
        res.redirect("/books");
    } else {
        res.status(404).render('page-not-found');;
    }
}));

module.exports = router;