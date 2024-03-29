const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jsonParser = bodyParser.json();
const cors = require('cors');

const secretKey = process.env.SECRETKEY;

const Vendor = require('../models/vendorModel');
const Item = require('../models/itemModel');
const Review = require('../models/reviewModel');

/*
Get all items
 */
router.get('/', cors(), (req, res) => {
    Item.findAll().then(items => {
        if (!items) {
            return res.status(404).json({
                message: 'No items found'
            })
        }
        return res.status(200).json(items)
    }).catch(error => {
        return res.status(500).json({
            message: 'Error when finding items',
            error: error
        })
    });
});

/*
Get items by name or id
 */
router.get('/:itemId', cors(), (req, res) => {
    Item.findOne({
        where: {
            itemId :req.params.itemId
        }
    }).then(items => {
        if (!items) {
            return res.status(404).json({
                message: 'No items found'
            })
        }
        return res.status(200).json(items)
    }).catch(error => {
        return res.status(500).json({
            message: 'Error when finding items',
            error: error
        })
    });
});

/*
Get items by name
 */
router.get('/name/:itemName', cors(), (req, res) => {
    Item.findOne({
        where: {
            name:req.params.itemName
        }
    }).then(items => {
        if (!items) {
            return res.status(404).json({
                message: 'No items found'
            })
        }
        return res.status(200).json(items)
    }).catch(error => {
        return res.status(500).json({
            message: 'Error when finding items',
            error: error
        })
    });
});

/*
Post an item

Takes JSON Body of:
{
    name: String,
    price: int,
    description: String,
    category: String,
    vendorId: int
}

 */
router.post('/', cors(), jsonParser, passport.authenticate('jwt', {session: false}), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;

    Vendor.findOne({
        where: {
            userId: loggedInUser
        }
    }).then(vendor => {
        if (!vendor) {
            return res.status(403).json({
                message: 'Forbidden, user is not a vendor'
            })
        }
        const data = req.body;
        if (!data.name ||
            !data.price ||
            !data.description ||
            !data.category) {
            return res.status(204).json({
                message: 'Items must have a name, price, description and category.'
            })
        }

        let bodyImageUrl = data.imageUrl || "";
        let itemRating = 0;

        Item.create({
            name: data.name,
            price: data.price,
            description: data.description,
            category: data.category,
            imageUrl: bodyImageUrl,
            vendorId: vendor.vendorId,
            rating: itemRating
        }).then(newItem => {
            return res.status(200).json(newItem)
        }).catch(error => {
            return res.status(500).json({
                message: 'Error when created item',
                error: error
            })
        })
    })
});

/*
Update an item
 */
router.put('/:itemId', cors(), jsonParser, passport.authenticate('jwt', {session: false}), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;

    Vendor.findOne({
        where: {
            userId: loggedInUser
        }
    }).then(vendor => {
        if (!vendor) {
            return res.status(403).json({
                message: 'User is not a vendor'
            })
        }
        Item.findOne({
            where: {
                itemId: req.params.itemId
            }
        }).then(item => {
            if (!item) {
                return res.status(404).json({
                    message: 'Item not found'
                })
            }
            if (item.vendorId !== vendor.vendorId) {
                return res.status(403).json({
                    message: 'User is not the vendor of this item.'
                })
            }
            let data = req.body;

            if (!data.name && !data.description && !data.category && !data.price && !data.imageUrl && !data.rating) {
                return res.status(400).json({
                    message: 'Bad request, json body must contain one of the following: ' +
                        'name, description, category, imageUrl, price or rating'
                })
            }

            let newName = req.body.name || item.name;
            let newDescription = req.body.description || item.description;
            let newPrice = req.body.price || item.price;
            let newCategory = req.body.category || item.category;
            let newImageUrl = req.body.imageUrl || item.imageUrl;
            let newItemRating = req.body.rating || item.rating;

            Item.update({
                name: newName,
                description: newDescription,
                price: newPrice,
                category: newCategory,
                imageUrl: newImageUrl,
                rating: newItemRating
            }, { where: {
                itemId: item.itemId
            }}).then(updatedItem => {
                return res.status(200).json(updatedItem)
            }).catch(error => {
                return res.status(500).json({
                    message: 'Error while updating item',
                    error: error
                })
            })
        }).catch(error => {
            return res.status(500).json({
                message: 'Error while finding item',
                error: error
            })
        });
    }).catch(error => {
        return res.status(500).json({
            message: 'Error while finding vendor',
            error: error
        })
    });
});

/*
Delete an item
 */
router.delete('/:itemId', cors(), passport.authenticate('jwt', { session: false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;

    Vendor.findOne({
        where: {
            userId: loggedInUser
        }
    }).then(vendor => {
        if(!vendor) {
            return res.status(403).json({
                message: 'User is not a vendor'
            })
        }
        Item.findOne({
            where: {
                itemId: req.params.itemId
            }
        }).then(item => {
            if (!item) {
                return res.status(404).json({
                    message: 'Item not found for vendor'
                })
            }
            Review.destroy({
                where: {
                    itemId: req.params.itemId
                }
            }).then(() => {
                Item.destroy({
                    where: {
                        itemId: item.itemId
                    }
                }).then(result => {
                    return res.status(200).json({
                        message: 'Item deleted successfully',
                        resultCode: result
                    })
                }).catch(error => {
                    return res.status(500).json({
                        message: 'Error when deleting item',
                        error: error.toJSON()
                    })
                })
            }).catch(error => {
                return res.status(500).json({
                    message: 'Error while destroying item',
                    error: error
                })
            })
        }).catch(error => {
            return res.status(500).json({
                message: 'Error while finding item',
                error: error
            })
        })
    }).catch(error => {
        return res.status(500).json({
            error: error
        })
    });
});

/*
===============================================
REVIEW ENDPOINTS
===============================================
 */

/*
Get all reviews for item
 */
router.get('/:itemId/reviews', cors(), (req, res) => {
    Review.findAll({
        where: {
            itemId: req.params.itemId
        }
    }).then(reviews => {
        return res.status(200).json(reviews)
    }).catch(error => {
        return res.status(500).json({
            message: 'Error while finding reviews',
            error: error
        })
    })
});

/*
Post review for item
 */
router.post('/:itemId/review', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;

    Item.findOne({
        where: {
            itemId: req.params.itemId
        }
    }).then(item => {
        if (!item) {
            return res.status(404).json({
                message: 'Item not found'
            })
        }
        let data = req.body;
        if (!data.rating || !data.text || !data.title) {
            return res.status(400).json({
                message: 'Bad request, json body must contain rating, title and text key value pairs.'
            })
        }
        Review.findOrCreate({
            where: {
                itemId: item.itemId,
                userId: loggedInUser
            }, defaults: {
                title: data.title,
                text: data.text,
                rating: data.rating
            }
        }).then(results => {
            if (!results[1]) {
                return res.status(409).json({
                    message: 'User has already submitted a review for this item',
                    reviewId: results[0].reviewId
                })
            }
            let ratingResult = handleItemRating(item.itemId);

            if (ratingResult.success) {
                return res.status(200).json(results[0])
            } else if (!ratingResult.success && !ratingResult.error) {
                return res.status(200).json(results[0])
            } else if (!ratingResult.success && ratingResult.error) {
                return res.status(200).json({
                    message: 'Review was created but item rating failed to update, please call refresh rating endpoint (base/item/:itemId/update-rating)',
                    review: results[0],
                    error: ratingResult.error
                })
            }
        }).catch(error => {
            console.log(error);
            return res.status(500).json({
                message: 'Error when creating review',
                error: error
            })
        });
    }).catch(error => {
        return res.status(500).json({
            message: 'Error while finding item',
            error: error
        })
    });
});

/*
Update review for item
 */
router.put('/:itemId/review', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;

    Item.findOne({
        where: {
            itemId: req.params.itemId
        }
    }).then(item => {
        if (!item) {
            return res.status(404).json({
                message: 'Item not found'
            })
        }
        let data = req.body;
        if (!data.rating && !data.text && !data.title) {
            return res.status(400).json({
                message: 'Bad request, json body must contain one of the following: ' +
                    'rating, title or text key value pairs.'
            })
        }
        Review.findOne({
            where: {
                itemId: item.itemId,
                userId: loggedInUser
            }
        }).then(review => {
            if (!review) {
                return res.status(404).json({
                    message: 'User has not reviewed this item',
                })
            }
            let newTitle = data.title || review.title;
            let newText = data.text || review.text;
            let newRating = data.rating || review.rating;

            Review.update({
                title: newTitle,
                text: newText,
                rating: newRating
            }, {
                where: {
                    reviewId: review.reviewId
                }
            }).then(rowsUpdated => {
                if (rowsUpdated>0) {
                    let updateRatingResult = handleItemRating(item.itemId);
                    if(updateRatingResult.success) {
                        return res.status(200).json({
                            message: 'Review updated successfully'
                        })
                    } else if(!updateRatingResult.error){
                        return res.status(200).json({
                            message: 'Review updated successfully'
                        })
                    } else if(!updateRatingResult.success && updateRatingResult.error) {
                        return res.status(500).json({
                            message: 'Review was updated successfully but there was an error updating the item rating',
                            error: updateRatingResult.error
                        })
                    }
                } else {
                    return res.status(200).json({
                        message: 'No rows in database were updated and no errors occurred. ' +
                            'Request JSON body data possibly identical to existing database values'
                    })
                }
            }).catch(error => {
                console.log(error);
                return res.status(500).json({
                    message: 'Error while updating review',
                    error: error
                })
            })
        }).catch(error => {
            return res.status(500).json({
                message: 'Error when finding review',
                error: error
            })
        });
    }).catch(error => {
        return res.status(500).json({
            message: 'Error while finding item',
            error: error
        })
    });
});

/*
Delete a review for item
 */
router.delete('/:itemId/review', cors(), passport.authenticate('jwt', { session: false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;

    Review.findOne({
        where: {
            itemId: req.params.itemId,
            userId: loggedInUser
        }
    }).then(review => {
        if (!review) {
            return res.status(404).json({
                message: 'Review not found'
            })
        }
        Review.destroy({
            where: {
                itemId: req.params.itemId,
                userId: loggedInUser
            }
        }).then(updatedRows => {
            if (updatedRows>0) {
                return res.status(200).json({
                    message: 'Review deleted successfully'
                })
            } else {
                return res.status(400).json({
                    message: 'Something went wrong, review not deleted'
                })
            }
        }).catch(error => {
            return res.status(500).json({
                message: 'Error while destroying review',
                error: error
            })
        })
    }).catch(error => {
        return res.status(500).json({
            message: 'Error while finding review',
            error: error
        })
    })
});

router.put('/:itemId/update-rating', cors(), (req, res) => {
    let results = handleItemRating(req.params.itemId);

    if (results.success) {
        return res.status(200).json({
            message: 'Rating updated successfully'
        })
    } else {
        return res.status(500).json({
            message: 'Rating was not updated due to an error',
            error: results.error
        })
    }

});

function handleItemRating(itemId) {
    Review.findAll({
        where: {
            itemId: itemId
        }
    }).then(reviews => {
        let fiveStars = 0;
        let fourStars = 0;
        let threeStars = 0;
        let twoStars = 0;
        let oneStar = 0;

        for(let i = 0; i < reviews.length; i++)
        {
            switch (reviews[i].rating) {
                case 5 :
                    fiveStars++;
                    break;
                case 4 :
                    fourStars++;
                    break;
                case 3 :
                    threeStars++;
                    break;
                case 2:
                    twoStars++;
                    break;
                case 1:
                    oneStar++;
                    break;
            }
        }

        let newRating = (((5 * fiveStars) + (4 * fourStars) + (3 * threeStars) + (2 * twoStars) + oneStar)/(fiveStars+fourStars+threeStars+twoStars+oneStar));

        Item.update({
            rating: newRating
        }, { where: {
            itemId: itemId
        }}).then(rowsUpdated => {
            return {
                success: rowsUpdated > 0,
                error: null
            };
        }).catch(() => {
            return {
                success: false,
                error: error
            }
        })
    })
}

module.exports = router;
